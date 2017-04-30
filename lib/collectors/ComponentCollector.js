const
  path = require('path'),
  Collector = require('./Collector'),
  sgUtil = require('../util');

class ComponentCollector extends Collector {

  constructor(...args) {
    super(...args);
  }

  getSaveHtmlFunction(filename) {
    filename = this.CollectorPaths.resolveDestHtml(filename);
    return (renderOutput) => {
      sgUtil.writeFile(filename, renderOutput.html);
      sgUtil.writeFile(sgUtil.replaceFileExtension(filename, `body.${this.htmlExt}`), renderOutput.body);
    }
  }

  getCssFiles() {
    return [];
  }

}

module.exports = ComponentCollector;