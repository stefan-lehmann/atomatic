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

  collectMatchingSections(sections, generator) {
    sections
      .filter((section) => section.generator === generator)
      .map((section) => this.collectSection.call(this, section, generator));
  }

  collectSection(sectionConfig, generator) {
    const
      {
        baseDir, viewerRootPath, htmlExt, globPattern, CollectorStore,
        setIndexFile, setFile, unsetFile, touchFileSystem, initDataLoader
      } = this,
      {title, source, dest} = sectionConfig,
      sourcedDir = path.resolve(path.join(baseDir, source)),
      destDir = dest || source,
      dataLoader = initDataLoader.call(this, sectionConfig),
      {url} = setIndexFile.call(this, title, destDir, generator, dataLoader);

    const section = {
      url: url,
      title: title,
      active: false,
      destDir: destDir,
      sourcedDir: sourcedDir,
      globPattern: globPattern,
      watchPattern: path.join(baseDir, source, '**', '*'),
      route: `/${viewerRootPath}/${destDir}/*.${htmlExt}`,
      setFile: setFile.bind(this),
      unsetFile: unsetFile.bind(this),
    };

    touchFileSystem
      .call(this, sourcedDir)
      .map((filename) => setFile.call(this, filename, sourcedDir, destDir, dataLoader));

    CollectorStore.setSection(section);
  }

  setIndexFile(title, destDir, generator, dataLoader) {
    const
      {getGetSectionDataFunction} = this,
      sourceDir = path.resolve(__dirname, '..', '..', 'app/sections', generator),
      filename = path.join(sourceDir, 'index.pug'),
      indexFile = this.createFileObj(filename, sourceDir, destDir, dataLoader, true);

    Object.defineProperty(indexFile, 'title', {
      get: () => title
    });

    Object.defineProperty(indexFile, 'data', {
      get: () => getGetSectionDataFunction.call(indexFile)
    });

    return this.CollectorStore.setFile(indexFile);
  }

  unsetFile(filename) {
    this.CollectorStore.unsetFile(filename);
  }

  setFile(filename, sourcedDir, destDir, dataLoader) {
    const file = this.createFileObj(filename, sourcedDir, destDir, dataLoader);
    return this.CollectorStore.setFile(file);
  }

  createFileObj(filename, sourcedDir, destDir, dataLoader, isIndexFile = false) {
    const {
        constructor, getSaveHtmlFunction, getSaveLocalsFunction, getCssFiles,
        CollectorPaths, TemplateEngine
      } = this,
      renderHook = this.constructor.renderHook;

    CollectorPaths.set(filename, sourcedDir, destDir);

    return {
      filename: filename,
      instance: constructor.name,
      isIndexFile: isIndexFile,
      url: CollectorPaths.resolveUrl(filename),
      destDir: destDir,
      cssFiles: getCssFiles.call(this),
      saveHtml: getSaveHtmlFunction.call(this, filename),
      saveLocals: getSaveLocalsFunction.call(this, filename),
      get orderValue() {
        return this.data.orderValue || filename;
      },
      get data() {
        const data = dataLoader.getData(this.filename);
        data.title = this.title;
        data.instance = constructor.name;
        return data;
      },
      get render() {
        return TemplateEngine.render(this, renderHook);
      },
      get title() {
        const data = sgUtil.readRelatedData(this.filename);
        return data.title || 'No Name';
      }
    };
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
    return {
      title: this.title,
      instance: this.instance,
      app: {
        cssFiles: this.cssFiles
      },
      locals: {
        files: this.sectionFiles
      }
    };
  }
}

module.exports = Collector;