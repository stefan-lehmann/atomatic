import Vue from 'vue';

const internalHooks = [
    'bind',
    'inserted',
    'update',
    'componentUpdated',
    'unbind'
  ],
  reservedProperties = [
    'constructor',
    'el',
    'vm',
    'expression'
  ];

class VueDirective {

  constructor(options = {}) {
    const
      proto = Object.getPrototypeOf(this),
      {name = this.constructor.name} = options;

    this.options = options;
    this.options.name = name;

    Object.getOwnPropertyNames(proto)
      .filter(propertyName => reservedProperties.indexOf(propertyName) === -1)
      .map(propertyName => {

        const {value} = Object.getOwnPropertyDescriptor(proto, propertyName) || {};

        if (internalHooks.indexOf(propertyName) !== -1) {
          this.options[propertyName] = (...attrs) => {
            this[propertyName].apply(Object.assign({}, this.options, this.super.apply(this.options, attrs)), attrs);
          };
          return;
        }

        if (typeof value === 'function') {
          this.options[propertyName] = value;
        }
      });

    return this.options;
  }

  static register(name, directiveClass) {
    Vue.directive(name, new directiveClass({name}));
  }

  super(...attrs) {
    const
      [$el, , vm] = attrs,
      {context: {$store}} = vm;

    return {
      $el,
      vm,
      $store,
      context: {},
      nextTick: Vue.nextTick
    }
  }
}

export default VueDirective;