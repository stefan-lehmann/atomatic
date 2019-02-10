const
  minimatch = require('minimatch'),
  path = require('path'),
  globWatcher = require('glob-watcher'),
  sgUtil = require('./util');

class Watcher {
  constructor({conf, browserSync, CollectorStore: {getSections, getFiles, updateTimestamp}}) {
    this.getSections = getSections;
    this.getFiles = getFiles;
    this.updateTimestamp = updateTimestamp;
    this.browserSync = browserSync;

    this.globOptions = conf.get('globOptions');
    this.htmlExt = conf.get('htmlExt');
    this.templateExt = conf.get('templateExt');
    this.dataExt = conf.get('dataExt');
    this.emitDelay = conf.get('emitDelay', 100);
    this.logLevel = conf.get('logLevel', 0);
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
    if (minimatch(filename, `**/*.${this.templateExt}`)) {
      if (this.logLevel > 1) {
        sgUtil.log(`Watcher: file has been added (${filename})`);
      }
      const affectedUrls = this.updateTimestamp(filename);
      this.removeCaches(filename, section);
      section.setFile({filename, section});
      this.emitDelayed(filename, affectedUrls, 'onadd');
    }

    if (minimatch(filename, `**/*.+(${this.dataExt}|js)`)) {
      this.onChangeFiles(filename, section);
    }
  }

  onChangeFiles(filename, section) {
    if (this.logLevel > 1) {
      sgUtil.log(`Watcher: file has been updated (${filename})`);
    }

    if (minimatch(filename, `**/*+(${this.templateExt}|${this.dataExt}|js)`)) {
      filename = sgUtil.replaceFileExtension(filename, this.templateExt);

      const affectedUrls = this.updateTimestamp(filename);

      section.updateFile(filename);
      this.removeCaches(filename, section);
      this.emitDelayed(filename, affectedUrls, 'onchange');
    }
  }

  onUnlinkFiles(filename, section) {
    if (minimatch(filename, `**/*.${this.templateExt}`)) {
      if (this.logLevel > 1) {
        sgUtil.log(`Watcher: file has been unlinked (${filename})`);
      }

      const affectedUrls = this.updateTimestamp(filename);

      section.unsetFile(filename);
      this.removeCaches(filename, section);
      this.emitDelayed(filename, affectedUrls, 'onunlink');
    }

    if (minimatch(filename, `**/*.+(${this.dataExt}|js)`)) {
      this.onChangeFiles(filename, section);
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

  emitDelayed(filename, affectedUrls, origin) {
    const
      {htmlExt, templateExt, dataExt, emitQue, emitDelay, addToEmitQue, resetEmitQue, browserSync} = this,
      extension = sgUtil.getFileExtension(filename);

    if ([htmlExt, templateExt, dataExt].indexOf(extension) !== -1) {

      addToEmitQue({filename, extension});
      clearTimeout(this.emitTimeout);

      const extensions = Object.keys(emitQue);

      this.emitTimeout = setTimeout(() => {
        sgUtil.log(`[atomatic] Emit reload based on file changes`, 'bs');
        browserSync.sockets.emit('atomatic:reload', affectedUrls);
        browserSync.emitter.emit('atomatic:change', affectedUrls);

        if (!origin !== 'onchange' || !extensions.indexOf(dataExt)) {
          browserSync.sockets.emit('atomatic:fetchSection');
        }
        resetEmitQue();
      }, emitDelay);
    }
  }

  removeCaches(filename, section) {
    section._timestamp = 0;
    const dirname = path.dirname(filename);

    Object.keys(this.globOptions.cache)
      .filter(key => key.indexOf(dirname) !== -1)
      .map(key => delete this.globOptions.cache[key]);
  }
}

module.exports = Watcher;
