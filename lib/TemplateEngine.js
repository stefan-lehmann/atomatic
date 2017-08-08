const
  fs = require('fs'),
  extend = require('extend'),
  glob = require('glob'),
  path = require('path'),
  sgUtil = require('./util');

class TemplateEngine {

  constructor({conf}) {

    this.conf = conf;
    this.baseDir = conf.get('baseDir');
    this.engines = new Map();

    this.setDefaultEngine();
    this.setCustomEngine();

    this.render = this.render.bind(this);
  }

  wrap(source, data = {}, templatePath, instance) {

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

  render(file, global = {}) {

    if (!fs.existsSync(file.filename)) {
      sgUtil.log('Template file missing [' + file.filename + ']', 'warn');
      return {html: '', source: '', data: {}};
    }

    const
      {filename, data, data: {schema = {}, instance}, saveHtml, saveLocals, renderHook} = file,
      engine = this.engines.get(sgUtil.getFileExtension(filename));

    let {locals} = data;
    delete data.locals;

    let source = engine.render(filename, locals, extend({}, {atomatic: data}, global));

    if (typeof renderHook === 'function') {
      ({source, locals} = renderHook(file, source));
    }

    const html = this.wrap(source, data, filename, instance);

    saveHtml({html, source});
    saveLocals({locals, schema});

    return {html, source, data, locals};
  }

  kill() {
    [...this.engines.values()]
      .filter(engine => typeof engine.kill === 'function')
      .map((engine) => engine.kill())
  }
}

module.exports = TemplateEngine;