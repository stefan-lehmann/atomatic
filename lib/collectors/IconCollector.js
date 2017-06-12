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

  collectSection(...args) {
    super.collectSection(...args);
    const [sectionConfig] = args,
      {title, source, dest, generator} = sectionConfig,
      destDir = dest || source;

    this.setIndexFile.call(this, {title, section: {destDir, generator}});
  }

  setIndexFile(indexFileOptions) {
    const
      {getGetSectionDataFunction, getIcons} = this,
      {title, section: {destDir, generator}} = indexFileOptions,
      sourceDir = path.resolve(__dirname, '..', '..', 'app/sections/icons'),
      filename = path.relative(process.cwd(), path.join(sourceDir, 'index.pug')),
      file = this.createFileObj({filename, section: {sourceDir, destDir, generator}});

    Object.defineProperty(file, 'title', {
      get: () => title
    });

    Object.defineProperty(file, 'data', {
      get: () => {
        const data = getGetSectionDataFunction.call(file);
        data.locals.icons = getIcons.call(this);
        data.pageTitle = data.title;
        data.generator = file.generator;
        return data;
      }
    });

    return this.CollectorStore.setFile(file);
  }

  setFile(fileOptions) {
    const {filename, section: {sourceDir, destDir}} = fileOptions;

    this.CollectorPaths.set(filename, sourceDir, destDir);
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