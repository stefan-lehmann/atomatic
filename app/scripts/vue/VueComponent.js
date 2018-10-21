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

let appMethods;


class VueComponent {

  constructor(options) {
    const properties = {};
    let prototype = this;

    while (prototype != null && prototype.constructor.name !== 'VueComponent') {
      prototype = Object.getPrototypeOf(prototype || this);
      if (prototype) {
        Object.getOwnPropertyNames(prototype)
          .forEach((propertyName) => {
            if (!properties[propertyName] && reservedProperties.indexOf(propertyName) === -1) {
              properties[propertyName] = prototype;
            }
          });
      }
    }

    options = Object.assign({}, options, this.props.call(this));

    Object.entries(properties)
      .forEach(([propertyName, prototype]) => {
    const
          {value, get, set} = Object.getOwnPropertyDescriptor(prototype, propertyName) || {},
          {methods = {nextTick: Vue.nextTick}, computed = {}} = options;

        if (internalHooks.indexOf(propertyName) !== -1) {
          options = Object.assign(options, {[propertyName]: this[propertyName]});
          return;
        }

        if (typeof value === 'function') {
          Object.assign(methods, {[propertyName]: value});
          options.methods = methods;
          return;
        }

        if (get || set) {
          Object.assign(computed, {
            [propertyName]: {
              get,
              set
            }
          });
          options.computed = computed;
        }
      });

    this.options = options;

    return options;
  }

  get root() {
    if (!appMethods) {
      appMethods = this._getAppMethods(this.$root);
    }
    return appMethods;
  }

  static register(name, ComponentClass) {
    Vue.component(name, new ComponentClass({name}));

    return name;
  }

  props() {
    return {};
  }

  _getAppMethods(app) {
    return Object.getOwnPropertyNames(app)
      .filter((methodName, index, methodsNames) => {
        return methodsNames.indexOf(methodName) === index
          && typeof app[methodName] === 'function'
          && methodName.indexOf('_') !== 0
          && methodName.indexOf('$') !== 0;
      })
      .reduce((carry, name) => {
        carry[name] = app[name];
        return carry;
      }, {});
  }
}

export default VueComponent;



