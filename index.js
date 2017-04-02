const
  AppBuilder = require('./lib/AppBuilder'),
  RecursiveDataLoader = require('./lib/dataLoader/RecursiveDataLoader'),
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

class DesignSystemCreator {

  constructor(config, watch, cb) {

    ConfigManager.initConfig(config);

    this.TemplateEngine = new TemplateEngine(
      ConfigManager.get('baseDir'));

    this.CollectorStore = new CollectorStore({
      conf: ConfigManager,
      TemplateEngine: this.TemplateEngine
    });

    this.CollectorPaths = new CollectorPaths({
      conf: ConfigManager
    });

    if (watch) {
      this.server = new DevServer({
        conf: ConfigManager,
        CollectorStore: this.CollectorStore
      });
      this.server.start(cb);

      this.Watcher = new Watcher({
        conf: ConfigManager,
        CollectorStore: this.CollectorStore,
        browserSync: this.server.browserSync
      });
    }

    this
      .collect(ConfigManager)
      .buildApp(ConfigManager)
      .onEndAll(() => {
        if (!watch && typeof cb === 'function') {
          this.TemplateEngine.kill();
          cb();
        }
      });

    if (watch) {
      this.Watcher.start();
      this.server.addRoutes();
    }
  }

  getConfig(key, defaultValue) {
    return ConfigManager.get(key, defaultValue);
  }

  collect(ConfigManager) {

    new StyleCollector({
      conf: ConfigManager,
      CollectorStore: this.CollectorStore,
      TemplateEngine: this.TemplateEngine,
      CollectorPaths: this.CollectorPaths,
      DataLoader: StylesDataLoader
    }).collectMatchingSections(ConfigManager.get('sections'));

    new IconCollector({
      conf: ConfigManager,
      CollectorStore: this.CollectorStore,
      TemplateEngine: this.TemplateEngine,
      CollectorPaths: this.CollectorPaths
    }).collectMatchingSections(ConfigManager.get('sections'));

    new PatternCollector({
      conf: ConfigManager,
      CollectorStore: this.CollectorStore,
      TemplateEngine: this.TemplateEngine,
      CollectorPaths: this.CollectorPaths,
      DataLoader: PatternDataLoader
    }).collectMatchingSections(ConfigManager.get('sections'));

    new ComponentCollector({
      conf: ConfigManager,
      CollectorStore: this.CollectorStore,
      TemplateEngine: this.TemplateEngine,
      CollectorPaths: this.CollectorPaths,
      DataLoader: RecursiveDataLoader
    }).collectMatchingSections(ConfigManager.get('sections'));

    new TemplateCollector({
      conf: ConfigManager,
      CollectorStore: this.CollectorStore,
      TemplateEngine: this.TemplateEngine,
      CollectorPaths: this.CollectorPaths,
      DataLoader: RecursiveDataLoader
    }).collectMatchingSections(ConfigManager.get('sections'));

    return this;
  }

  buildApp(ConfigManager, cb) {

    return new AppBuilder(ConfigManager, this.CollectorStore, this.Watcher)
      .browserifyViewerScripts()
      .generateViewerStyles()
      .copyViewerAssets()
      .generateViewerPages()
      .renderCollected()
      .saveCollectedData()
  }

}
module.exports = DesignSystemCreator;