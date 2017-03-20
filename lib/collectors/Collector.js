const
  glob = require('glob'),
  path = require('path'),
  extend = require('extend'),
  sgUtil = require('../util');

class Collector {

  constructor(settings) {

    this.conf = settings.conf;
    this.CollectorStore = settings.CollectorStore;
    this.CollectorPaths = settings.CollectorPaths;
    this.TemplateEngine = settings.TemplateEngine;
    this.DataLoader = settings.DataLoader;
    this.ImageGenerator = settings.ImageGenerator;

    this.baseDir = this.conf.get('baseDir');
    this.viewerRootPath = this.conf.get('app.viewerRootPath');
    this.templateExt = this.conf.get('templateExt');
    this.htmlExt = this.conf.get('htmlExt');
    this.globOptions = this.conf.get('globOptions');
    this.globPattern = path.join('**', '!(_)**', `!(_)*.${this.templateExt}`);
  }

  touchFileSystem(sourcedDir) {
    const {globPattern, globOptions} = this;
    return glob.sync(path.join(sourcedDir, globPattern), globOptions);
  }

  collectMatchingSections(sections) {
    sections
      .filter((sectionConfig) => sectionConfig.generator === this.generator)
      .map((sectionConfig) => this.collectSection.call(this, sectionConfig));
  }

  collectSection(sectionConfig) {
    const
      {
        baseDir, viewerRootPath, htmlExt, globPattern, CollectorStore,
        CollectorPaths, setFile, unsetFile, touchFileSystem, initDataLoader
      } = this,
      {title, source, dest, generator} = sectionConfig,
      sourcedDir = path.resolve(path.join(baseDir, source)),
      destDir = dest || source,
      dataLoader = initDataLoader.call(this, sectionConfig);

    const section = {
      generator,
      title,
      destDir,
      sourcedDir,
      dataLoader,
      globPattern,
      watchPattern: path.join(baseDir, source, '**', '*'),
      url: `/${viewerRootPath}/${destDir}`,
      route: `/${viewerRootPath}/${destDir}/*.${htmlExt}`,
      setFile: setFile.bind(this),
      unsetFile: unsetFile.bind(this)
    };

    touchFileSystem
      .call(this, sourcedDir)
      .map((filename) => setFile.call(this, filename, sourcedDir, destDir, dataLoader));

    CollectorStore.setSection(section);
  }

  unsetFile(filename) {
    this.CollectorStore.unsetFile(filename);
  }

  setFile(filename, sourcedDir, destDir, dataLoader) {
    const file = this.createFileObj(filename, sourcedDir, destDir, dataLoader);
    return this.CollectorStore.setFile(file);
  }

  createFileObj(filename, sourcedDir, destDir, dataLoader) {
    const {
        generator, constructor, getSaveHtmlFunction, getSaveLocalsFunction, getCssFiles, readRelatedData,
        CollectorPaths, TemplateEngine
      } = this;

    CollectorPaths.set(filename, sourcedDir, destDir);

    return {
      filename: filename,
      generator: generator,
      instance: constructor.name,
      url: CollectorPaths.resolveUrl(filename),
      destDir: destDir,
      cssFiles: getCssFiles.call(this),
      saveHtml: getSaveHtmlFunction.call(this, filename),
      saveLocals: getSaveLocalsFunction.call(this, filename),
      get orderValue() {
        return this.data.orderValue || filename;
      },
      get data() {
        const data = dataLoader.getData(this);
        data.title = this.title;
        data.pageTitle = this.pageTitle || data.title;
        data.instance = this.instance;
        return data;
      },
      get render() {
        return TemplateEngine.render(this);
      },
      get title() {
        const data = readRelatedData(this.filename);
        return data.title || sgUtil.getTitleFromFilename(this.filename);
      }
    };
  }

  readRelatedData(filename) {
    return sgUtil.readRelatedData(filename);
  }

  initDataLoader(sectionConfig) {
    return new this.DataLoader(this.conf.copyExtend(sectionConfig));
  }

  getSaveHtmlFunction(filename) {
    filename = this.CollectorPaths.resolveDestHtml(filename);
    return (html) => sgUtil.writeFile(filename, html);
  }

  getSaveLocalsFunction(filename) {
    filename = this.CollectorPaths.resolveDestData(filename);
    return (locals) => sgUtil.writeJsonFile(filename, locals);
  }

  getCssFiles() {
    return [`/${this.viewerRootPath}/css/app.css`];
  }

  getGetSectionDataFunction() {
    const {title, instance, cssFiles, sectionFiles} = this;
    return {title, instance, app: {cssFiles}, locals: {files: sectionFiles}};
  }
}

module.exports = Collector;