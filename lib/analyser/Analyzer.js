const
  fs = require('fs'),
  path = require('path'),
  glob = require('glob'),
  sgUtil = require('../util'),
  storedAnalyzes = new Map();

class Analyzer {

  constructor(source, options, dumpData) {

    this.source = source;
    this.hash = sgUtil.hashCode(source);
    this.options = options;
    this.dumpData = dumpData;

    this.getFiles = this.getFiles.bind(this);
  }

  getFiles() {
    return glob.sync(this.source, this.options);
  }

  getFileContents() {
    return this.getFiles()
               .map((filename) => sgUtil.readFileContents(filename)).join('\n')
  }

  hasSourceChanged() {
    const
      {hash, getFiles} = this,
      {time = false} = storedAnalyzes.get(hash) || {};

    let hasChanged = true;

    if (time !== false) {
      hasChanged = false;
      getFiles().some((filename) => {
        if (time < new Date(fs.statSync(filename).ctime).getTime()) {
          return hasChanged = true;
        }
      });
    }
    return hasChanged;
  }

  getAnalysis() {
    const {hasSourceChanged, getStoredData, startWrappedAnalysis} = this;

    return (hasSourceChanged.call(this) === false) ? getStoredData.call(this) : startWrappedAnalysis.call(this);
  }

  getStoredData() {
    return storedAnalyzes.has(this.hash) ? storedAnalyzes.get(this.hash).data : startWrappedAnalysis.call(this);
  }

  getVersion() {
    return storedAnalyzes.has(this.hash) ? storedAnalyzes.get(this.hash).version : 0;
  }

  startWrappedAnalysis() {
    const
      {hash, constructor, analyze, getVersion} = this,
      data = analyze.call(this),
      version = getVersion.call(this);

    storedAnalyzes.set(hash, {
      time: new Date().getTime(),
      data: data,
      version: (version + 1)
    });

    if (this.dumpData) {
      sgUtil.dumpData(path.join('.tmp', constructor.name, `${hash}.json`), data);
    }
    return data;
  }
}

module.exports = Analyzer;