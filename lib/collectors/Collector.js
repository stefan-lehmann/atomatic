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

  touchFileSystem(sourceDir) {
    const {globPattern, globOptions} = this;
    return glob.sync(path.join(sourceDir, globPattern), globOptions);
  }

  collectMatchingSections(sections, generator) {
    sections
      .filter((sectionConfig) => sectionConfig.generator === generator)
      .map((sectionConfig) => this.collectSection.call(this, sectionConfig));
  }

  collectSection(sectionConfig) {
    const
      {
        baseDir, viewerRootPath, htmlExt, globPattern, CollectorStore,
        setFile, unsetFile, updateFile, touchFileSystem, initDataLoader
      } = this,
      {title, source, dest, generator, warnOnMissingDataFile = true} = sectionConfig,
      sourceDir = path.resolve(path.join(baseDir, source)),
      destDir = dest || source,
      dataLoader = initDataLoader.call(this, sectionConfig);

    const section = {
      generator,
      title,
      destDir,
      sourceDir,
      dataLoader,
      globPattern,
      watchPattern: path.join(baseDir, source, '**', '*'),
      url: `/${viewerRootPath}/${destDir}`,
      route: `/${viewerRootPath}/${destDir}/*.${htmlExt}`,
      setFile: setFile.bind(this),
      unsetFile: unsetFile.bind(this),
      updateFile: updateFile.bind(this),
      warnOnMissingDataFile: warnOnMissingDataFile
    };

    touchFileSystem
      .call(this, sourceDir)
      .map((filename) => {
        setFile.call(this, {filename, section})
      });

    CollectorStore.setSection(section);
  }

  unsetFile(filename) {
    this.CollectorStore.unsetFile(filename);
  }

  setFile(fileOptions) {
    return this.CollectorStore.setFile(this.createFileObj(fileOptions));
  }

  updateFile(filename) {
    this.CollectorStore.updateFile(filename);
  }

  createFileObj(fileOptions) {
    const
      {
        constructor, getSaveHtmlFunction, getSaveLocalsFunction, getCssFiles,
        readRelatedData, getRenderHookFunction, CollectorPaths, TemplateEngine
      } = this,
      {filename, section: {sourceDir, destDir, dataLoader, generator, warnOnMissingDataFile}} = fileOptions;

    CollectorPaths.set(filename, sourceDir, destDir);
    return {
      filename: filename,
      generator: generator,
      instance: constructor.name,
      url: CollectorPaths.resolveUrl(filename),
      destDir: destDir,
      cssFiles: getCssFiles.call(this),
      saveHtml: getSaveHtmlFunction.call(this, filename),
      saveLocals: getSaveLocalsFunction.call(this, filename),
      renderHook: getRenderHookFunction.call(this),
      get orderValue() {
        return this.data.orderValue;
      },
      get data() {
        const data = dataLoader ? dataLoader.getData(this) : {};
        data.title = this.title;
        data.pageTitle = this.pageTitle || data.title;
        data.instance = this.instance;
        data.generator = this.generator;
        return data;
      },
      get render() {
        return TemplateEngine.render(this);
      },
      get title() {
        const data = readRelatedData(this.filename, warnOnMissingDataFile);
        return data.title || sgUtil.getTitleFromFilename(this.filename);
      }
    };
  }

  readRelatedData(filename, warnOnMissingDataFile) {
    return sgUtil.readRelatedData(filename, warnOnMissingDataFile);
  }

  initDataLoader(sectionConfig) {
    return new this.DataLoader(this.conf.copyExtend(sectionConfig));
  }

  getSaveHtmlFunction(filename) {
    filename = this.CollectorPaths.resolveDestHtml(filename);
    return (renderOutput) => sgUtil.writeFile(filename, renderOutput.html);
  }

  getSaveLocalsFunction(filename) {
    filename = this.CollectorPaths.resolveDestData(filename);
    return (data) => sgUtil.writeJsonFile(filename, data.locals);
  }

  getRenderHookFunction() {
    return (file, source) => {
      const {data: {locals = {}}} = file;
      return {source, locals};
    }
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