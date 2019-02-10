const
  fs = require('fs'),
  path = require('path'),
  extend = require('extend'),
  objectHash = require('object-hash'),
  sgUtil = require('./util');

class TemplateEngine {
  constructor({conf}) {
    this.conf = conf;
    this.baseDir = conf.get('baseDir');
    this.logLevel = conf.get('logLevel', 0);
    this.engines = new Map();
    this.cache = new Map();

    this.setDefaultEngine();
    this.setCustomEngine();

    this.render = this.render.bind(this);
  }

  async wrap(source, data = {}, templatePath, instance) {

    const wrapperTemplatePath = this.getWrapperTemplatePath(instance);

    if (!fs.existsSync(wrapperTemplatePath)) {
      return source;
    }

    const
      baseDir = this.conf.get('rootPath'),
      global = this.conf.get('app.globals');

    global.packageName = this.conf.get('package.name');
    global.packageVersion = this.conf.get('version', this.conf.get('package.version'));

    const
      options = extend({}, data, {
        global,
        source,
        templatePath,
        baseDir,
        cache: false,
        pretty: true
      });

    return this.engines.get('pug').render(wrapperTemplatePath, {}, options);
  }

  getWrapperTemplatePath(instance) {
    const filename = `../app/templates/wrapper/${instance}Template.pug`;
    return this.conf.get(`app.wrapperTemplates.${instance}`, path.join(__dirname, filename));
  }

  setDefaultEngine() {
    const
      engine = require('./templateEngines/pug'),
      options = {
        basedir: this.baseDir,
        pretty: true,
        cache: false,
        plugins: [require('./pugGlobLoaderPlugin')]
      };
    this.setEngine(new engine(options));
  }

  setCustomEngine() {

    const {conf} = this;

    if (conf.has('customTemplateEngine')) {

      if (conf.has('customTemplateEngine.name')) {
        const
          engine = require('./templateEngines/' + conf.get('customTemplateEngine.name')),
          options = conf.get('customTemplateEngine.options', {}),
          root = path.resolve(this.baseDir),
          ext = conf.get('templateExt');

        this.setEngine(new engine(options, root, ext));
      }
      else {
        this.setEngine(conf.get('customTemplateEngine'));
      }
    }
  }

  setEngine(engine) {
    this.engines.set(engine.ext, engine);
  }

  async render(file, global = {}, wrap = true) {
    const {filename, componentName, instance, timestamp, saveHtml, saveLocals, renderHook, extension} = file;
    const data = extend({}, file.data);
    const hash = file.hash ? file.hash : objectHash.MD5({componentName, data, global});

    if (this.cache.has(hash) && this.cache.get(hash).timestamp === timestamp) {
      if (this.logLevel > 0) {
        sgUtil.log(`Component: \u001b[1m${componentName}\u001b[22m use cached (${hash}).`);
      }
      return this.cache.get(hash);
    }

    let
      {locals, schema} = data,
      html = '',
      source = '';

    if (!fs.existsSync(filename)) {
      sgUtil.log(`Component: \u001b[1m${componentName}\u001b[22m template file missing.`, 'warn');
      return {html, source, data, locals};
    }

    delete data.locals;

    const engine = this.engines.get(extension)

    source = await engine.render(filename, locals, extend({}, {atomatic: data}, global));

    if (typeof source !== 'string' && source.error) {

      if (typeof saveLocals === 'function') {
        saveLocals({locals, schema});
      }

      if (typeof saveHtml === 'function') {
        saveHtml({html: source.error, source});
      }

      return source.error;
    }

    if (typeof renderHook === 'function') {
      ({source, locals} = renderHook(file, source));
    }

    if (wrap) {
      html = await this.wrap(source, data, filename, instance);
    }

    if (typeof saveHtml === 'function') {
      saveHtml({html, source});
    }

    if (typeof saveLocals === 'function') {
      saveLocals({locals, schema});
    }

    sgUtil.log(`Component: \u001b[1m${componentName}\u001b[22m rendered (${hash}).`, 'info');
    this.cache.set(hash, {html, source, data, locals, timestamp: timestamp});

    return this.cache.get(hash);
  }

  kill() {
    [...this.engines.values()]
      .filter(engine => typeof engine.kill === 'function')
      .map((engine) => engine.kill())
  }
}

module.exports = TemplateEngine;
