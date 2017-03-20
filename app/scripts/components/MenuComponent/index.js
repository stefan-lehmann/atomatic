import VueComponent from '../../services/VueComponent';

const props = {
  template: require('./template.pug')({})
};

class MenuComponent extends VueComponent {

  beforeCreate() {
    this.$store.dispatch('fetchSections');
  }

  data() {
    return {level: 0};
  }

  get sections() {
    return this.$store.getters.sections;
  }
}

VueComponent.register(MenuComponent, props);


