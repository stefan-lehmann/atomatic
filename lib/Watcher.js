const
  minimatch = require('minimatch'),
  path = require('path'),
  globWatcher = require('glob-watcher'),
  sgUtil = require('./util');

class Watcher {

  constructor(settings) {

    const {getSections, getFiles} = settings.CollectorStore;
    const {reload} = settings.browserSync;

    this.conf = settings.conf;
    this.getSections = getSections;
    this.getFiles = getFiles;
    this.reload = reload;

    this.htmlExt = this.conf.get('htmlExt');
    this.reloadDelay = this.conf.get('reloadDelay', 100);
    this.reloadTimeout = null;

    this.watch = this.watch.bind(this);
    this.start = this.start.bind(this);
    this.onAddFiles = this.onAddFiles.bind(this);
    this.onUnlinkFiles = this.onUnlinkFiles.bind(this);
    this.reloadDelayed = this.reloadDelayed.bind(this);
  }

  watch(section) {
    const {watchPattern} = section;

    return globWatcher(watchPattern, {ignoreInitial: true})
      .on('change', (filename) => this.onChangeFiles(path.resolve(filename), section))
      .on('add', (filename) => this.onAddFiles(path.resolve(filename), section))
      .on('unlink', (filename) => this.onUnlinkFiles(path.resolve(filename), section));
  }

  start() {
    this.getSections().forEach(this.watch);
  }

  onAddFiles(filename, section) {
    const {setFile, globPattern, dataLoader, sourceDir, destDir} = section;
    if (minimatch(filename, path.join(sourceDir, globPattern))) {
      setFile(filename, sourceDir, destDir, dataLoader);
      this.reloadDelayed(filename);
    }
  }

  onChangeFiles(filename, section) {
    // const {updateFile} = section;
    // updateFile(filename);
    this.reloadDelayed(filename);
  }

  onUnlinkFiles(filename, section) {
    const
      {unsetFile, globPattern, sourceDir} = section,
      pattern = path.join(sourceDir, globPattern.replace(/\!\(_\)/g, ''));

    if (minimatch(filename, pattern)) {
      unsetFile(filename);
      this.reloadDelayed(filename);
    }
  }

  reloadDelayed(filename) {
    sgUtil.log(`${filename} was changed`);
    const {reload, htmlExt, reloadDelay} = this;
    clearTimeout(this.reloadTimeout);
    this.reloadTimeout = setTimeout(() => reload(`*.${htmlExt}`), reloadDelay);
  }
}

module.exports = Watcher;