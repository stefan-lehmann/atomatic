import Vue from 'vue';

const internalHooks = [
    'data',
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted',
    'beforeDestroy',
    'destroyed',
    'beforeUpdate',
    'updated',
    'activated',
    'deactivated',
    'render'
  ],
  reservedProperties = [
    'constructor',
    'template',
    'props',
    'nextTick'
  ];

class VueComponent {

  constructor(options) {

    const
      proto = Object.getPrototypeOf(this),
      {name = this.constructor.name} = this.options = Object.assign({}, options, this.props());

    this.options.name = name;

    Object.getOwnPropertyNames(proto)
      .filter(propertyName => reservedProperties.indexOf(propertyName) === -1)
      .map(propertyName => {

        const
          {value, get, set} = Object.getOwnPropertyDescriptor(proto, propertyName) || {},
          {methods = {nextTick: Vue.nextTick}, computed = {}} = this.options;

        if (internalHooks.indexOf(propertyName) !== -1) {
          this.options[propertyName] = this[propertyName];
          return;
        }

        if (typeof value === 'function') {
          Object.assign(methods, {[propertyName]: value});
          this.options.methods = methods;
          return;
        }

        if (get || set) {
          Object.assign(computed, {[propertyName]: {get, set}});
          this.options.computed = computed;
        }
      });

    return this.options;
  }

  props() {
    return {};
  }

  static register(name, componentClass) {
    Vue.component(name, new componentClass({name}));
  }
}

export default VueComponent;



