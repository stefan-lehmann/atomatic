const
  fs = require('fs'),
  path = require('path'),
  glob = require('glob'),
  sgUtil = require('../util');

class Collector {

  constructor({conf, CollectorStore, CollectorPaths, TemplateEngine, DataLoader}) {

    this.conf = conf;
    this.CollectorStore = CollectorStore;
    this.CollectorPaths = CollectorPaths;
    this.TemplateEngine = TemplateEngine;
    this.DataLoader = DataLoader;

    this.copyExtend = conf.copyExtend;
    this.baseDir = conf.get('baseDir');
    this.viewerRootPath = conf.get('app.viewerRootPath');
    this.templateExt = conf.get('templateExt');
    this.htmlExt = conf.get('htmlExt');
    this.globOptions = conf.get('globOptions');
    this.logLevel = conf.get('logLevel', 0);
    this.warnOnMissingDataFile = this.logLevel > 2;
    this.globPattern = path.join('**', '**', `*.${this.templateExt}`);
    this.logLevel = conf.get('logLevel', 0);
  }

  touchFileSystem(sourceDir) {
    const {globPattern, globOptions} = this;
    return glob.sync(path.join(sourceDir, globPattern), globOptions);
  }

  collectMatchingSections(sections, collector) {
    sections
      .filter((sectionConfig) => sectionConfig.collector === collector)
      .map((sectionConfig) => this.collectSection.call(this, sectionConfig));
  }

  collectSection(sectionConfig) {
    const
      {
        baseDir, viewerRootPath, htmlExt, globPattern, warnOnMissingDataFile, CollectorStore,
        setFile, unsetFile, updateFile, touchFileSystem, initDataLoader
      } = this,
      {title, source, dest, collector} = sectionConfig,
      sourceDir = path.resolve(path.join(baseDir, source)),
      destDir = dest || source,
      dataLoader = initDataLoader.call(this, sectionConfig);

    const section = {
      collector,
      title,
      destDir,
      sourceDir,
      dataLoader,
      globPattern,
      warnOnMissingDataFile,
      watchPattern: path.join(baseDir, source, '**', '*'),
      url: `/${viewerRootPath}/${destDir}`,
      route: `/${viewerRootPath}/${destDir}/*.${htmlExt}`,
      setFile: setFile.bind(this),
      unsetFile: unsetFile.bind(this),
      updateFile: updateFile.bind(this)
    };

    touchFileSystem
      .call(this, sourceDir)
      .map((filename) => {
        setFile.call(this, {filename, section})
      });

    CollectorStore.setSection(section);

    return section;
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

  createFileObj({filename, section: {sourceDir, destDir, url: sectionUrl, dataLoader, collector, warnOnMissingDataFile}}) {

    const {
      constructor: {name: instance}, logLevel,
      getSaveHtmlFunction, getSaveLocalsFunction, getComponentName,
      getCssFiles, readRelatedData, getRenderHookFunction,
      CollectorPaths, TemplateEngine
    } = this;

    CollectorPaths.set(filename, sourceDir, destDir);

    const
      url = CollectorPaths.resolveUrl(filename),
      sectionPath = path.relative(sectionUrl, path.dirname(url));

    return {
      filename,
      collector,
      destDir,
      instance,
      sectionPath,
      url,
      warnOnMissingDataFile,
      timestamp: Date.now(),
      childComponents: [],
      parentComponents: [],
      componentName: getComponentName.call(this, sourceDir, filename),
      exclude: path.basename(filename).substr(0, 1) !== '_',
      extension: sgUtil.getFileExtension(filename),
      cssFiles: getCssFiles.call(this),
      saveHtml: getSaveHtmlFunction.call(this, filename),
      saveLocals: getSaveLocalsFunction.call(this, filename),
      renderHook: getRenderHookFunction.call(this),
      get template() {
        if (!this._template || this._template.timestamp !== this.timestamp) {

          if (!fs.existsSync(this.filename)) {
            return '';
          }

          this._template = {
            content: sgUtil.readFileContents(this.filename),
            timestamp: this.timestamp
          };
        }
        return this._template.content;
      },
      get orderValue() {
        return this.data.orderValue || sectionPath;
      },
      get data() {

        if (!this._data || this._data.timestamp !== this.timestamp) {
          this._data = dataLoader ? dataLoader.getData(this) : {};
          this._data.title = this.title;
          this._data.pageTitle = this.pageTitle || this._data.title;
          this._data.instance = this.instance;
          this._data.collector = this.collector;
          this._data.timestamp = this.timestamp;

          if (logLevel > 1) {
            sgUtil.log(`Data: \u001b[1m${this.componentName}\u001b[22m generated. (${this.timestamp})`, 'info');
          }
        }
        else if (logLevel > 1) {
          sgUtil.log(`Data: \u001b[1m${this.componentName}\u001b[22m use cached. (${this.timestamp})`);
        }
        return this._data;
      },
      get render() {
        return TemplateEngine.render(this);
      },
      get title() {
        if (!this._title || !this._data || this._data.timestamp !== this.timestamp) {
          const {title = sgUtil.getTitleFromFilename(this.filename)} =
              sgUtil.readRelatedData(this.filename, this.warnOnMissingDataFile);
          this._title = title;
        }
        return this._title;
      }
    };
  }

  readRelatedData(filename) {
    return filename ? sgUtil.readJson5File(filename) : {};
  }

  initDataLoader(sectionConfig) {
    return new this.DataLoader(this.copyExtend(sectionConfig), this.warnOnMissingDataFile);
  }

  getSaveHtmlFunction(filename) {
    filename = this.CollectorPaths.resolveDestHtml(filename);
    return ({html}) => sgUtil.writeFile(filename, html);
  }

  getSaveLocalsFunction(filename) {
    filename = this.CollectorPaths.resolveDestData(filename);
    return ({locals}) => sgUtil.writeJsonFile(filename, locals);
  }

  getRenderHookFunction() {
    return ({data: {locals = {}}}, source) => ({source, locals});
  }

  getCssFiles() {
    return [`/${this.viewerRootPath}/css/app.css`];
  }

  getGetSectionDataFunction() {
    const {title, instance, cssFiles, sectionFiles} = this;
    return {title, instance, app: {cssFiles}, locals: {files: sectionFiles}};
  }

  getComponentName(sourceDir, filename) {
    const
      componentType = path.basename(sourceDir),
      componentName = path.basename(sgUtil.removeFileExtension(filename)).replace(/_/g, '');

    return `${componentType}-${componentName}`;
  }
}

module.exports = Collector;