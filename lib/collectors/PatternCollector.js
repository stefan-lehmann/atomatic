const
  extend = require('extend'),
  sgUtil = require('../util'),
  Collector = require('./Collector'),
  PatternRenderHook = require('../hooks/PatternRenderHook');

class PatternCollector extends Collector {

  constructor(...args) {
    super(...args);
    this.generator = 'patterns';
  }

  static renderHook(body, locals) {
    return new PatternRenderHook(body, locals).get();
  }
}

module
  .exports = PatternCollector;