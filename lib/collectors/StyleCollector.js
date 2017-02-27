const
  path = require('path'),
  sgUtil = require('../util'),
  Collector = require('./Collector');

class StyleCollector extends Collector {

  constructor(...args) {
    super(...args);

    this.globPattern = path.join('**', `!(index)*.${this.templateExt}`);
    this.baseDir = path.resolve(__dirname, '..', '..', 'app/sections');
  }

  getGetSectionDataFunction() {
    return {
      title: this.title,
      instance: this.instance,
      app: {
        cssFiles: this.cssFiles
      },
      locals: {
      }
    };
  }
}

module.exports = StyleCollector;