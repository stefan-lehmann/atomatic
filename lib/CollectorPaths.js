const
  path = require('path'),
  sgUtil = require('./util');

class CollectorPaths {

  constructor({conf}) {

    this.dest = conf.get('dest');
    this.viewerDest = conf.get('viewerDest');
    this.templateDest = conf.get('templateDest');
    this.htmlExt = conf.get('htmlExt');
    this.dataExt = conf.get('dataExt');
    this.sources = new Map();
  }

  set(filename, sourceDir, destDir) {
    this.sources.set(filename, {destDir, sourceDir});
  }

  get(filename) {
    return this.sources.get(filename);
  }

  relativeFileName(filename) {
    const {sourceDir} = this.get(filename);
    return path.relative(sourceDir, filename);
  }

  resolveDest(filename, ext) {
    const
      {viewerDest, get, relativeFileName} = this,
      {destDir} = get.call(this, filename);

    filename = relativeFileName.call(this, filename);
    filename = path.join(viewerDest, destDir, filename);

    return sgUtil.replaceFileExtension(filename, ext);
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

  resolveTemplateSourceDest(componentName) {
    const {dest, templateDest} = this;
    return path.resolve(path.join(dest, templateDest, componentName));
  }
}

module.exports = CollectorPaths;