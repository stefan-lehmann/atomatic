const
  ComponentCollector = require('./ComponentCollector');

class TemplateCollector extends ComponentCollector {

  constructor(...args) {
    super(...args);
    this.generator = 'templates';
  }

}

module.exports = TemplateCollector;