if (!process.env.NODE_CONFIG_DIR) {
  process.env.NODE_CONFIG_DIR = require('path').join(__dirname, '..', 'config');
}

const
  fs = require('fs'),
  path = require('path'),
  config = require('config');

class ConfigManager {

  constructor() {

    this.config = config;
    this.util = config.util;

    this.copyExtend = this.copyExtend.bind(this);
  }

  extend(config) {
    this.config = this.util.extendDeep({}, this.config, config);
  }

  copyExtend(config) {
    const conf = {
      config: this.util.extendDeep({}, this.util.cloneDeep(this.config), config),
    };
    conf.has = this.has.bind({config: conf.config});
    conf.get = this.get.bind({has: conf.has, config: conf.config});
    return conf;
  }

  initConfig(config) {

    const rootPath = process.cwd();

    if (typeof config === 'string') {
      config = require(path.join(rootPath, config));
    }

    this.extend(config);
    this.extend({
      rootPath,
      viewerDest: path.join(this.get('dest'), this.get('app.viewerRootPath')),
      package: JSON.parse(fs.readFileSync('./package.json')),
      globOptions: {
        cache:{},
        statCache: {},
        symlinks: {},
        nodir: true,
        nocase: true,
        absolute: false
      }
    });
    return this;
  }

  get(configPath, defaultValue) {
    return ('undefined' !== typeof defaultValue && !this.has(configPath)) ? defaultValue : this.config.get(configPath);
  }

  has(configPath) {
    return this.config.has(configPath);
  }
}

module.exports = new ConfigManager();