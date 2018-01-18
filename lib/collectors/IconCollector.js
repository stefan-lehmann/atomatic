const
  path = require('path'),
  sgUtil = require('../util'),
  Collector = require('./Collector');

class IconCollector extends Collector {

  constructor(...args) {
    super(...args);

    this.globPattern = path.join('**', '*.svg');
    this.icons = new Map();
  }

  collectSection(...args) {
    const
      section = Object.assign(super.collectSection(...args), {
        sourceDir: path.resolve(__dirname, '..', '..', 'app/sections/icons'),
        warnOnMissingDataFile: false
      });

    this.setIndexFile.call(this, section);
  }

  setIndexFile(section) {
    const
      {getGetSectionDataFunction, getIcons, logLevel} = this,
      {title, sourceDir, destDir} = section,
      filename = path.relative(process.cwd(), path.join(sourceDir, 'index.pug')),
      file = this.createFileObj({filename, section});

    Object.defineProperty(file, 'title', {
      get: () => title
    });

    Object.defineProperty(file, 'data', {
      get: () => {
        if (!file._data || file._data.timestamp !== file.timestamp) {
          file._data = getGetSectionDataFunction.call(file);
          file._data.locals.icons = getIcons.call(this, destDir);
          file._data.pageTitle = file.title;
          file._data.collector = file.collector;
          file._data.timestamp = Date.now();

          if (logLevel > 2) {
            sgUtil.log(`Component Data: \u001b[1m${file.title}\u001b[22m generated. (${file.timestamp})`, 'info');
          }
        }
        else if (logLevel > 2) {
          sgUtil.log(`Component Data: \u001b[1m${file.title}\u001b[22m use cached. (${file.timestamp})`);
        }
        return file._data;
      }
    });

    return this.CollectorStore.setFile(file);
  }

  setFile({filename, section: {sourceDir, destDir}}) {
    this.CollectorPaths.set(filename, sourceDir, destDir);
    this.icons.set(filename, sgUtil.readFileContents(filename));
  }

  unsetFile(filename) {
    this.icons.delete(filename);
  }

  getIcons(destDir) {
    const
      getComponentName = this.getComponentName.bind(this),
      copySource = this.getCopySourceFunction(),
      icons = {};

    this.icons.forEach((icon, filename) => {
      copySource(filename, getComponentName(destDir, filename));
      icons[this.CollectorPaths.relativeFileName(filename)] = icon;
    });

    return icons;
  }

  initDataLoader() {
    return null;
  }
}

module.exports = IconCollector;