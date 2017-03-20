const
  path = require('path'),
  sgUtil = require('../util'),
  Collector = require('./Collector');

class IconCollector extends Collector {

  constructor(...args) {
    super(...args);

    this.generator = 'icons';
    this.globPattern = path.join('**', '!(_)*.svg');
    this.icons = new Map();
  }

  collectSection(...args) {
    super.collectSection(...args);
    const [sectionConfig] = args,
    {title, source, dest} = sectionConfig,
    destDir = dest || source;

    this.setIndexFile.call(this, title, destDir);
  }

  setIndexFile(title, destDir) {
    const
      {getGetSectionDataFunction, getIcons} = this,
      sourceDir = path.resolve(__dirname, '..', '..', 'app/sections', destDir),
      filename = path.join(sourceDir, 'index.pug'),
      file = this.createFileObj(filename, sourceDir, destDir);

    Object.defineProperty(file, 'title', {
      get: () => title
    });

    Object.defineProperty(file, 'data', {
      get: () => {
        const data = getGetSectionDataFunction.call(file);
        data.locals.icons = getIcons.call(this);
        data.pageTitle = data.title;
        return data;
      }
    });

    return this.CollectorStore.setFile(file);
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