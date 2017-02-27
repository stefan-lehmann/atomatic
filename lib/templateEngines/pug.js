const
  pug = require('pug'),
  extend = require('extend');

class pugRenderEngine {

  constructor(options) {
    this.options = options;
  }

  render(templatePath, locals, globals) {
    let options = extend({},
      this.options,
      locals,
      globals);
    return pug.renderFile(templatePath, options);
  }
}

module.exports = pugRenderEngine;