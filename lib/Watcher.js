const
  minimatch = require('minimatch'),
  path = require('path'),
  globWatcher = require('glob-watcher'),
  sgUtil = require('./util');

class Watcher {

  constructor({conf, browserSync, CollectorStore:{getSections, getFiles, markFileAsDirty}}) {

    this.getSections = getSections;
    this.getFiles = getFiles;
    this.markFileAsDirty = markFileAsDirty;
    this.browserSync = browserSync;

    this.htmlExt = conf.get('htmlExt');
    this.templateExt = conf.get('templateExt');
    this.dataExt = conf.get('dataExt');
    this.emitDelay = conf.get('emitDelay', 500);
    this.emitTimeout = null;
    this.emitQue = {};

    this.watch = this.watch.bind(this);
    this.start = this.start.bind(this);
    this.onAddFiles = this.onAddFiles.bind(this);
    this.onUnlinkFiles = this.onUnlinkFiles.bind(this);
    this.emitDelayed = this.emitDelayed.bind(this);
    this.resetEmitQue = this.resetEmitQue.bind(this);
    this.addToEmitQue = this.addToEmitQue.bind(this);
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
    const
      {setFile, globPattern, sourceDir} = section;

    if (minimatch(filename, path.join(sourceDir, globPattern))) {
      setFile({filename, section});
      this.emitDelayed(filename);
    }
  }

  onChangeFiles(filename, section) {
    this.markFileAsDirty(filename);
    this.emitDelayed(filename);
  }

  onUnlinkFiles(filename, section) {
    const
      {unsetFile, globPattern, sourceDir} = section,
      pattern = path.join(sourceDir, globPattern.replace(/\!\(_\)/g, ''));

    if (minimatch(filename, pattern)) {
      unsetFile(filename);
      this.emitDelayed(filename);
    }
  }

  addToEmitQue({filename, extension}) {
    if (this.emitQue[extension] === undefined) {
      this.emitQue[extension] = [];
    }
    this.emitQue[extension].push(filename);
  }

  resetEmitQue() {
    this.emitQue = {};
  }

  emitDelayed(filename) {
    const
      {htmlExt, templateExt, dataExt, emitDelay, emitQue, addToEmitQue, resetEmitQue, browserSync} = this,
      extension = sgUtil.getFileExtension(filename);

    sgUtil.log(`${filename} has been changed`);

    if ([htmlExt, templateExt, dataExt].indexOf(extension) !== -1) {

      addToEmitQue({filename, extension});
      clearTimeout(this.emitTimeout);

      this.emitTimeout = setTimeout(() => {
        browserSync.sockets.emit('atomatic:files-changed', emitQue);
        resetEmitQue();
        sgUtil.log(`[atomatic] Reloading Viewers...`, 'bs');
      }, emitDelay);
    }
  }
}

module.exports = Watcher;