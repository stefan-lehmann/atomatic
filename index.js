const
  AppBuilder = require('./lib/AppBuilder'),
  FakeDataLoader = require('./lib/dataLoader/FakeDataLoader'),
  StylesDataLoader = require('./lib/dataLoader/StylesDataLoader'),
  PatternDataLoader = require('./lib/dataLoader/PatternDataLoader'),
  TemplateEngine = require('./lib/TemplateEngine'),
  CollectorStore = require('./lib/CollectorStore'),
  CollectorPaths = require('./lib/CollectorPaths'),
  StyleCollector = require('./lib/collectors/StyleCollector'),
  IconCollector = require('./lib/collectors/IconCollector'),
  PatternCollector = require('./lib/collectors/PatternCollector'),
  ComponentCollector = require('./lib/collectors/ComponentCollector'),
  TemplateCollector = require('./lib/collectors/TemplateCollector'),
  DevServer = require('./lib/DevServer'),
  Watcher = require('./lib/Watcher'),
  ConfigManager = require('./lib/ConfigManager');

class AtomaticCore {

  create(config) {

    this.create = () => this;

    this.conf = ConfigManager.initConfig(config);;

    this.TemplateEngine = new TemplateEngine(
      this.conf.get('baseDir')
    );

    this.CollectorStore = new CollectorStore({
      conf: this.conf,
      TemplateEngine: this.TemplateEngine
    });

    this.CollectorPaths = new CollectorPaths({
      conf: this.conf
    });

    this.collect();

    return this;
  }

  getConfig(key, defaultValue) {
    return this.conf.get(key, defaultValue);
  }

  collect() {

    new StyleCollector({
      conf: this.conf,
      CollectorStore: this.CollectorStore,
      TemplateEngine: this.TemplateEngine,
      CollectorPaths: this.CollectorPaths,
      DataLoader: StylesDataLoader
    }).collectMatchingSections(ConfigManager.get('sections'), 'style');

    new IconCollector({
      conf: this.conf,
      CollectorStore: this.CollectorStore,
      TemplateEngine: this.TemplateEngine,
      CollectorPaths: this.CollectorPaths
    }).collectMatchingSections(ConfigManager.get('sections'), 'icons');

    new PatternCollector({
      conf: this.conf,
      CollectorStore: this.CollectorStore,
      TemplateEngine: this.TemplateEngine,
      CollectorPaths: this.CollectorPaths,
      DataLoader: PatternDataLoader
    }).collectMatchingSections(ConfigManager.get('sections'), 'patterns');

    new ComponentCollector({
      conf: this.conf,
      CollectorStore: this.CollectorStore,
      TemplateEngine: this.TemplateEngine,
      CollectorPaths: this.CollectorPaths,
      DataLoader: FakeDataLoader
    }).collectMatchingSections(ConfigManager.get('sections'), 'components');

    new TemplateCollector({
      conf: this.conf,
      CollectorStore: this.CollectorStore,
      TemplateEngine: this.TemplateEngine,
      CollectorPaths: this.CollectorPaths,
      DataLoader: FakeDataLoader
    }).collectMatchingSections(ConfigManager.get('sections'), 'templates');

    return this;
  }

  buildViewer(browserSync = null) {
    return new AppBuilder(this.conf, this.CollectorStore, browserSync)
      .browserifyViewerScripts()
      .generateViewerStyles()
      .copyViewerAssets()
      .generateViewerPages();
  }

  build() {

    this.onEnd = this
      .buildViewer()
      .saveCollectedData()
      .renderCollected()
      .onEndAll;

    return this;
  }

  watch() {

    const server = new DevServer({
      conf: this.conf,
      CollectorStore: this.CollectorStore
    }).start();

    const watcher = new Watcher({
      conf: this.conf,
      CollectorStore: this.CollectorStore,
      browserSync: server.browserSync
    });

    this
      .buildViewer(watcher)
      .saveCollectedData();

    watcher.start();
    server.addRoutes();
  }

  kill() {
    this.TemplateEngine.kill();
  }

  getCollectedFiles() {
    return this.CollectorStore.getFiles();
  }

  compileFile(filename) {
    const {render:{source}} = this.CollectorStore.getFiles().get(filename);
    return source;
  }
}

const Atomatic = new AtomaticCore();

module.exports = Atomatic;