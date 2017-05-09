import Vue from 'vue/dist/vue';
import decamelize from 'decamelize';

const internalHooks = [
    'bind',
    'inserted',
    'update',
    'componentUpdated',
    'unbind'
  ],
  reservedProperties = [
    'constructor'
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

        const
          {value} = Object.getOwnPropertyDescriptor(proto, propertyName);

        if (internalHooks.indexOf(propertyName) !== -1) {
          this.options[propertyName] = (...attrs) => {
            this.super.apply(this.options, attrs);
            this[propertyName].apply(this.options, attrs);
          };
          return;
        }

        if (typeof value === 'function') {
          this.options[propertyName] = this[propertyName];
        }
      });

    return this.options;
  }

  super(...attrs) {
    if (!this.$store) {
      this.$store = attrs[2].context.$store;
    }
  }

  static register(...attrs) {
    const
      directive = new attrs[0](),
      [name] = decamelize(directive.name, '-').split('-directive');

    Vue.directive(name, directive);
  }
}

export default VueDirective;



