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

  wrap(source, data = {}, templatePath, wrapperTemplatePath) {
    const
      options = extend({}, data, {
        source: source,
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
        pretty: true,
        cache: false,
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

  render(file) {

    if (!fs.existsSync(file.filename)) {
      sgUtil.log('Template file missing [' + file.filename + ']', 'warn');
      return {html: '', source: '', data: {}};
    }

    let html, source, locals;

    const
      {filename, data, saveHtml, saveLocals, renderHook} = file,
      {schema = {}, instance: collector} = data,
      engine = this.engines.get(sgUtil.getFileExtension(filename)),
      defaultWrapperTemplateFilename = path.join(__dirname, `../app/templates/wrapper/${collector}Template.pug`),
      wrapperTemplateFilename = ConfigManager.get(`app.wrapperTemplates.${collector}`, defaultWrapperTemplateFilename);

    ({locals} = data);

    source = engine.render(filename, locals, this.globals);

    if (typeof renderHook === 'function') {
      ({source, locals} = renderHook(file, source));
    }

    html = source;
    if (fs.existsSync(wrapperTemplateFilename)) {
      html = this.wrap(source, data, filename, wrapperTemplateFilename);
    }

    saveHtml({html, source});
    saveLocals({locals, schema});

    return {html, source, data};
  }


  kill() {
    [...this.engines.values()]
      .filter(engine => typeof engine.kill === 'function')
      .map((engine) => engine.kill())
  }
}

module.exports = TemplateEngine;