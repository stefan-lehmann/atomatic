const
  pug = require('pug'),
  extend = require('extend'),
  sgUtil = require('../util');

class pugRenderEngine {

  constructor(options) {
    this.options = options;
  }

  render(templatePath, locals, globals) {
    try {
      return pug.renderFile(templatePath, extend({}, this.options, locals, globals));
    }
    catch(err) {
      sgUtil.log(err, 'warn');
      return err;
    }
  }
}

module.exports = pugRenderEngine;