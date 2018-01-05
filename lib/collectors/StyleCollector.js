const
  path = require('path'),
  Collector = require('./Collector');

class StyleCollector extends Collector {

  constructor(...args) {
    super(...args);

    this.templateExt = 'pug';
    this.generatedViewerCssFile = this.conf.get('generatedViewerCssFile', 'generated.css');
    this.globPattern = path.join('**', `!(index)*.${this.templateExt}`);
    this.baseDir = path.resolve(__dirname, '..', '..', 'app/sections');
    this.warnOnMissingDataFile = false;
  }

  getGetSectionDataFunction() {
    const sectionData = super.getGetSectionDataFunction();
    sectionData.locals = {};
    return sectionData;
  }

  getCssFiles() {
    const {viewerRootPath, generatedViewerCssFile} = this;
    return super.getCssFiles().concat([`/${viewerRootPath}/css/${generatedViewerCssFile}`]);
  }
}

module.exports = StyleCollector;