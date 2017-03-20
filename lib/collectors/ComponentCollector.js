const
  path = require('path'),
  Collector = require('./Collector'),
  sgUtil = require('../util');

class ComponentCollector extends Collector {

  constructor(...args) {
    super(...args);

    this.generator = 'components';
  }

  setFile(filename, sourcedDir, destDir, dataLoader) {

    let parentUrl = '';

    path.relative(sourcedDir, filename)
      .split(path.sep)
      .reverse()
      .splice(2)
      .reverse()
      .map((name, index, array) => {
      const folderName = path.join(sourcedDir, path.join(...array.slice(0, index+1)));
      if (folderName !== filename) {
        parentUrl = this.setIndexFile(name, folderName, sourcedDir, destDir, parentUrl);
      }
    });

    const file = Object.assign(this.createFileObj(filename, sourcedDir, destDir, dataLoader), {parentUrl});
    return this.CollectorStore.setFile(file);
  }

  setIndexFile(name, filename, sourcedDir, destDir, parentUrl) {
    const file = Object.assign(this.createFileObj(filename, sourcedDir, destDir), {parentUrl});

    Object.defineProperty(file, 'orderValue', {
      get: () => filename
    });

    Object.defineProperty(file, 'data', {
      get: () => null
    });

    Object.defineProperty(file, 'render', {
      get: () => ''
    });

    Object.defineProperty(file, 'title', {
      get: () => sgUtil.getTitleFromName(name)
    });

    this.CollectorStore.setFile(file);
    return file.url;
  }

  getCssFiles() {
    return [];
  }

}

module.exports = ComponentCollector;