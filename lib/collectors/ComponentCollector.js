const
  Collector = require('./Collector');

class ComponentCollector extends Collector {

  constructor(...args) {
    super(...args);
    this.generator = 'components';
  }
}

module.exports = ComponentCollector;