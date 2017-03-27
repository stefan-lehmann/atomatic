const
  pug = require('pug'),
  extend = require('extend'),
  sgUtil = require('../util');

class pugRenderEngine {

  constructor(options = {}, ext = 'pug') {
    this.options = options;
    this.ext = ext;
  }

  render(templatePath, locals, globals = {}) {
    try {
      return pug.renderFile(templatePath, extend({}, this.options, locals, globals));
    }
    catch (err) {
      sgUtil.log(err, 'warn');
      return err;
    }
  }
}

module.exports = pugRenderEngine;