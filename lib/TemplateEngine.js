const
  fs = require('fs'),
  extend = require('extend'),
  glob = require('glob'),
  path = require('path'),
  sgUtil = require('./util'),
  ConfigManager = require('./ConfigManager');


class TemplateEngine {

  constructor(baseDir, globals) {
    this.baseDir = baseDir;
    this.globals = globals || {};
    this.engines = new Map();

    this.setDefaultEngine();
    this.setCustomEngine();

    this.render = this.render.bind(this);
  }

  wrap(body, data = {}, templatePath) {
    const
      options = extend({}, data, {
        body: body,
        cache: false,
        pretty: true,
        templatePath: templatePath,
        baseDir: ConfigManager.get('rootPath'),
        global: ConfigManager.get('app.globals')
      }),
      defaultTemplatePath = path.join(__dirname, `../app/templates/wrapper/${data.instance}Template.pug`),
      wrapperTemplatePath = ConfigManager.get(`app.wrapperTemplate.${data.instance}`, defaultTemplatePath);

    return this.engines.get('pug').render(wrapperTemplatePath, {}, options);
  }

  setDefaultEngine() {
    const
      engine = require('./templateEngines/pug'),
      options = {
        basedir: this.baseDir,
        plugins: [require('./pugGlobLoaderPlugin')]
      };
    this.setEngine(new engine(options));
  }

  setCustomEngine() {
    if (ConfigManager.has('customTemplateEngine')) {

      if (ConfigManager.has('customTemplateEngine.name')) {
        const
          engine = require('./templateEngines/' + ConfigManager.get('customTemplateEngine.name')),
          options = ConfigManager.get('customTemplateEngine.options', {}),
          root = path.resolve(this.baseDir),
          ext = ConfigManager.get('templateExt');

        this.setEngine(new engine(options, root, ext));
      }
      else {
        this.setEngine(ConfigManager.get('customTemplateEngine'));
      }
    }
  }

  setEngine(engine) {
    this.engines.set(engine.ext, engine);
  }

  render(file, renderHook) {
    const
      {filename, ext, data, saveHtml, saveLocals} = file,
      {locals} = data;

    if (!fs.existsSync(filename)) {
      sgUtil.log('Template file missing [' + filename + ']', 'warn');
      return '';
    }

    let body = this.engines.get(ext).render(filename, locals, this.globals);

    if (typeof renderHook === 'function') {
      body = renderHook(body, data);
    }
    const wrappedBody = this.wrap(body, data, filename);

    saveHtml(wrappedBody);
    saveLocals(locals);

    return {wrappedBody, body};
  }

  kill() {
    [...this.engines.values()]
      .filter(engine => typeof engine.kill === 'function')
      .map((engine) => engine.kill())
  }
}

module.exports = TemplateEngine;