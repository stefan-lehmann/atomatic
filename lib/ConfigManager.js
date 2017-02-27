process.env.NODE_CONFIG_DIR = require('path').join(__dirname, '..', 'config');

const
  fs = require('fs'),
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
    this.extend(config);
    this.extend({
      rootPath: process.cwd(),
      viewerDest: `${this.get('dest')}/${this.get('app.viewerRootPath')}`,
      package: JSON.parse(fs.readFileSync('./package.json')),
      globOptions: {
        statCache: {},
        cache: {},
        symlinks: {},
        nodir: true
      }
    });
  }

  get(configPath, defaultValue) {
    return ('undefined' !== typeof defaultValue && !this.has(configPath)) ? defaultValue : this.config.get(configPath);
  }

  has(configPath) {
    return this.config.has(configPath);
  }
}

module.exports = new ConfigManager();