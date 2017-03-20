import Vue from 'vue/dist/vue';

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
    'template'
  ];

class VueComponent {

  constructor(options = {}) {

    const
      proto = Object.getPrototypeOf(this),
      {name = this.constructor.name} = options;

    this.options = options;
    this.options.name = name;

    Object.getOwnPropertyNames(proto)
      .filter(propertyName => reservedProperties.indexOf(propertyName) === -1)
      .map(propertyName => {

        const
          {value, get, set} = Object.getOwnPropertyDescriptor(proto, propertyName),
          {methods = {}, computed = {}} = this.options;

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

  static register(...attrs){
    const component = new attrs[0](attrs[1]);
    Vue.component(component.name, component);
  }
}

export default VueComponent;



