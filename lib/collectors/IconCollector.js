const
  path = require('path'),
  sgUtil = require('../util'),
  Collector = require('./Collector');

class IconCollector extends Collector {

  constructor(...args) {
    super(...args);
    this.globPattern = path.join('**', '!(_)*.svg');
    this.icons = new Map();
  }

  setIndexFile(title, destDir) {
    const
      {getGetSectionDataFunction, getIcons} = this,
      sourceDir = path.resolve(__dirname, '..', '..', 'app/sections', destDir),
      filename = path.join(sourceDir, 'index.pug'),
      indexFile = this.createFileObj(filename, sourceDir, destDir, true);

    Object.defineProperty(indexFile, 'title', {
      get: () => title
    });

    Object.defineProperty(indexFile, 'data', {
      get: () => {
        const data = getGetSectionDataFunction.call(indexFile);
        data.locals.icons = getIcons.call(this);
        data.pageTitle = data.title;
        return data;
      }
    });

    return this.CollectorStore.setFile(indexFile);
  }

  setFile(filename, sourcedDir, destDir) {
    this.CollectorPaths.set(filename, sourcedDir, destDir);
    this.icons.set(filename, sgUtil.readFileContents(filename));
  }

  unsetFile(filename) {
    this.icons.delete(filename);
  }

  getIcons() {
    const icons = {};
    this.icons.forEach((icon, filename) => {
      icons[this.CollectorPaths.relativeFileName(filename)] = icon;
    });
    return icons;
  }

  initDataLoader() {
    return null;
  }

}

module.exports = IconCollector;