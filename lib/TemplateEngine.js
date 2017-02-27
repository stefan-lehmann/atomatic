const
  fs = require('fs'),
  extend = require('extend'),
  glob = require('glob'),
  pug = require('pug'),
  path = require('path'),
  sgUtil = require('./util'),
  ConfigManager = require('./ConfigManager');


class TemplateEngine {

  constructor(baseDir, ext, globals) {
    this.baseDir = baseDir;
    this.ext = ext;
    this.globals = globals || {};
    this.getEngine();

    this.render = this.render.bind(this);
  }

  get(property) {
    return this[property];
  }

  set(property, value) {
    return this[property] = value;
  }

  _wrap(data, body, templatePath) {
    const
      options = extend({}, data, {
        body: body,
        cache: false,
        pretty: true,
        templatePath: templatePath,
        baseDir: ConfigManager.get('rootPath'),
        global: ConfigManager.get('app.globals'),
        plugins: [require('./pugGlobLoaderPlugin')]
      }),
      defaultTemplatePath = path.join(__dirname, `../app/templates/wrapper/${data.instance}Template.pug`),
      wrapperTemplatePath = ConfigManager.get(`app.wrapperTemplate.${data.instance}`, defaultTemplatePath);

    return pug.renderFile(wrapperTemplatePath, options);
  }

  getEngine() {

    if (!ConfigManager.has('templateEngine')) {
      sgUtil.log('Could not connect to template engine ' + ConfigManager.has('templateEngine') + '', 'warn');
    }

    if (ConfigManager.has('templateEngine.name')) {
      let
        engine = require('./templateEngines/' + ConfigManager.get('templateEngine.name')),
        options = {
          basedir: this.baseDir,
          plugins: [require('./pugGlobLoaderPlugin')]
        };
      this._engine = new engine(options);
    }
    else {
      this._engine = ConfigManager.get('templateEngine');
    }
  }

  render(file, renderHook=false) {
    const
      {filename, data, saveHtml, saveLocals} = file,
      {locals} = data;

    if (!fs.existsSync(filename)) {
      sgUtil.log('Template file missing [' + filename + ']', 'warn');
      return '';
    }

    let body = this._engine.render(filename, locals, this.globals);
    if (typeof renderHook === 'function') {
      body = renderHook(body, locals);
    }

    const html = this._wrap(data, body, filename);

    saveHtml(html);
    saveLocals(locals);

    return html;
  }

  kill() {
    if ('function' === typeof this._engine.done) {
      this._engine.done();
    }
  }
}

module.exports = TemplateEngine;