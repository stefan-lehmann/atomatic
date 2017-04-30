const
  fs = require('fs'),
  extend = require('extend'),
  glob = require('glob'),
  path = require('path'),
  sgUtil = require('./util'),
  ConfigManager = require('./ConfigManager');


class TemplateEngine {

  constructor(baseDir, globals = {}) {
    this.baseDir = baseDir;
    this.globals = globals;
    this.engines = new Map();

    this.setDefaultEngine();
    this.setCustomEngine();

    this.render = this.render.bind(this);
  }

  wrap(body, data = {}, templatePath, wrapperTemplatePath) {
    const
      options = extend({}, data, {
        body: body,
        cache: false,
        pretty: true,
        templatePath: templatePath,
        baseDir: ConfigManager.get('rootPath'),
        global: ConfigManager.get('app.globals'),
      });

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
      {filename, data, saveHtml, saveLocals} = file,
      {locals, instance: generator} = data,
      defaultWrapperTemplateFilename = path.join(__dirname, `../app/templates/wrapper/${generator}Template.pug`),
      wrapperTemplateFilename = ConfigManager.get(`app.wrapperTemplates.${generator}`, defaultWrapperTemplateFilename);

    if (!fs.existsSync(filename)) {
      sgUtil.log('Template file missing [' + filename + ']', 'warn');
      return '';
    }

    const engine = this.engines.get(sgUtil.getFileExtension(filename));
    let body = engine.render(filename, locals, this.globals);

    if (typeof renderHook === 'function') {
      body = renderHook(body, data);
    }

    let html = body;
    if (fs.existsSync(wrapperTemplateFilename)) {
      html = this.wrap(body, data, filename, wrapperTemplateFilename);
    }

    saveHtml({html, body});
    saveLocals(locals);

    return {html, body, data};
  }



  kill() {
    [...this.engines.values()]
      .filter(engine => typeof engine.kill === 'function')
      .map((engine) => engine.kill())
  }
}

module.exports = TemplateEngine;