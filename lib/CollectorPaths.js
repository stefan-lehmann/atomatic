const
  path = require('path'),
  sgUtil = require('./util');

class CollectorPaths {

  constructor(settings) {

    this.dest = settings.conf.get('dest');
    this.viewerDest = settings.conf.get('viewerDest');
    this.htmlExt = settings.conf.get('htmlExt');
    this.dataExt = settings.conf.get('dataExt');
    this.sources = new Map();
  }

  set(filename, sourcedDir, destDir) {
    this.sources.set(filename, {destDir, sourcedDir});
  }

  get(filename) {
    return this.sources.get(filename);
  }

  relativeFileName(filename) {
    const {sourcedDir} = this.get(filename);
    return path.relative(sourcedDir, filename);
  }

  resolveDest(filename, ext) {
    const
      {viewerDest, get, relativeFileName} = this,
      {destDir} = get.call(this, filename);

    filename = relativeFileName.call(this, filename);
    filename = path.join(viewerDest, destDir, filename);

    return sgUtil.replaceFileExtension(filename, ext);
  }

  resolveDestJpeg(filename) {
    const {resolveDest, htmlExt} = this;
    return resolveDest.call(this, filename, 'jpeg');
  }

  resolveDestHtml(filename) {
    const {resolveDest, htmlExt} = this;
    return resolveDest.call(this, filename, htmlExt);
  }

  resolveDestData(filename) {
    const {resolveDest, dataExt} = this;
    return resolveDest.call(this, filename, dataExt);
  }

  resolveUrl(filename) {
    const {resolveDestHtml, dest} = this;
    return path.join('/', path.relative(dest, resolveDestHtml.call(this, filename)));
  }
}

module.exports = CollectorPaths;