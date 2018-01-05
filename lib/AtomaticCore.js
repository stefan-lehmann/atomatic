const
  AppBuilder = require('./AppBuilder'),
  FakeDataLoader = require('./dataLoader/FakeDataLoader'),
  StylesDataLoader = require('./dataLoader/StylesDataLoader'),
  PatternDataLoader = require('./dataLoader/PatternDataLoader'),
  TemplateEngine = require('./TemplateEngine'),
  CollectorStore = require('./CollectorStore'),
  CollectorPaths = require('./CollectorPaths'),
  StyleCollector = require('./collectors/StyleCollector'),
  IconCollector = require('./collectors/IconCollector'),
  PatternCollector = require('./collectors/PatternCollector'),
  ComponentCollector = require('./collectors/ComponentCollector'),
  TemplateCollector = require('./collectors/TemplateCollector'),
  DevServer = require('./DevServer'),
  Watcher = require('./Watcher'),
  ConfigManager = require('./ConfigManager');

class AtomaticCore {

  create(config) {

    this.create = () => this;

    this.conf = ConfigManager.initConfig(config);

    this.CollectorStore = new CollectorStore({
      conf: this.conf
    });

    this.CollectorPaths = new CollectorPaths({
      conf: this.conf
    });

    this.TemplateEngine = new TemplateEngine({
      conf: this.conf,
      CollectorStore: this.CollectorStore
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

  buildViewer() {
    return new AppBuilder(this.conf, this.CollectorStore)
      .browserifyViewerScripts()
      .generateViewerStyles()
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

  compileFile(file, global = {}) {
    if (typeof file === 'string') {
      file = this.getCollectedFiles().get(file);
    }
    return this.TemplateEngine.render(file, global);
  }
}

module.exports = AtomaticCore;