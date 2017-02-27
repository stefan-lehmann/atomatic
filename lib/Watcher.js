const
  minimatch = require('minimatch'),
  path = require('path'),
  globWatcher = require('glob-watcher');

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
      .on('change', this.reloadDelayed)
      .on('add', (filename) => this.onAddFiles(path.resolve(filename), section))
      .on('unlink', (filename) => this.onUnlinkFiles(path.resolve(filename), section));
  }

  start() {
    this.getSections().forEach(this.watch);
  }

  onAddFiles(filename, section) {
    const {setFile, globPattern, sourcedDir, destDir} = section;
    if (minimatch(filename, path.join(sourcedDir, globPattern))) {
      setFile(filename, sourcedDir, destDir);
      this.reloadDelayed();
    }
  }

  onUnlinkFiles(filename, section) {
    const
      {unsetFile, globPattern, sourcedDir} = section,
      pattern = path.join(sourcedDir, globPattern.replace(/\!\(_\)/g, ''));
    if (minimatch(filename, filename, pattern)) {
      unsetFile(filename);
      this.reloadDelayed();
    }
  }

  reloadDelayed() {
    const {reload, htmlExt, reloadDelay} = this;
    clearTimeout(this.reloadTimeout);
    this.reloadTimeout = setTimeout(() => reload(`*.${htmlExt}`), reloadDelay);
  }
}

module.exports = Watcher;