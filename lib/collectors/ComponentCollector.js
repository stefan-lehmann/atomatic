const
  Collector = require('./Collector'),
  sgUtil = require('../util');

class ComponentCollector extends Collector {

  createFileObj(fileOptions) {
    const file = super.createFileObj(fileOptions);

    file.storedComponentFiles = this.CollectorStore.getFiles;

    Object.defineProperty(file, 'childComponents', {
      get: () => {
        const {template, storedComponentFiles} = file;
        return [...storedComponentFiles().values()].filter(({componentName}) => template.indexOf(componentName) !== -1);
      }
    });

    Object.defineProperty(file, 'parentComponents', {
      get: () => {
        const {componentName, storedComponentFiles} = file;

        return [...storedComponentFiles().values()].filter(({childComponents}) => {
          return childComponents.map(({componentName}) => componentName).indexOf(componentName) !== -1
        });
      }
    });

    sgUtil.copyFile(file.filename, this.CollectorPaths.resolveTemplateSourceDest.call(this.CollectorPaths, file.componentName));

    return file;
  }

  getSaveHtmlFunction(filename) {
    filename = this.CollectorPaths.resolveDestHtml(filename);

    const
      extention = sgUtil.getFileExtension(filename),
      sourceFileName = sgUtil.replaceFileExtension(filename, `source.${extention}`);

    return ({html, source}) => {
      sgUtil.writeFile(filename, html);
      sgUtil.writeFile(sourceFileName, source);
    }
  }

  getSaveLocalsFunction(filename) {
    filename = this.CollectorPaths.resolveDestData(filename);

    const
      extention = sgUtil.getFileExtension(filename),
      schemaFileName = sgUtil.replaceFileExtension(filename, `schema.${extention}`);

    return ({locals, schema}) => {
      sgUtil.writeJsonFile(filename, locals);
      sgUtil.writeJsonFile(schemaFileName, schema);
    }
  }

  getCssFiles() {
    return [];
  }
}

module.exports = ComponentCollector;