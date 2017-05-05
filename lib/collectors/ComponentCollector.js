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
    const
      extention = sgUtil.getFileExtension(filename),
      sourceFileName = sgUtil.replaceFileExtension(filename, `source.${extention}`);
    return (renderOutput) => {
      const {html, source} = renderOutput;
      sgUtil.writeFile(filename, html);
      sgUtil.writeFile(sourceFileName, source);
    }
  }

  getSaveLocalsFunction(filename) {
    filename = this.CollectorPaths.resolveDestData(filename);
    const
      extention = sgUtil.getFileExtension(filename),
      schemaFileName = sgUtil.replaceFileExtension(filename, `schema.${extention}`);
    return (data) => {
      const {locals, schema} = data;
      sgUtil.writeJsonFile(filename, locals);
      sgUtil.writeJsonFile(schemaFileName, schema);
    }
  }

  getCssFiles() {
    return [];
  }

}

module.exports = ComponentCollector;