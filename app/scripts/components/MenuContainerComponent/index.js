import VueComponent from '../../services/VueComponent';

const props = {
  template: require('./template.pug')({})
};

class MenuContainerComponent extends VueComponent {

  beforeCreate() {
    this.$store.dispatch('fetchSections');
    if (window.___browserSync___) {
      ___browserSync___.socket.on('atomatic:fetchSection', () => {
        console.warn('%cAtomatic fetch:', 'font-weight:bold', 'Section');
        this.$store.dispatch('fetchSections');
      });
    }
  }

  data() {
    return {level: 0};
  }

  get sections() {
    return this.$store.getters.sections;
  }
}

VueComponent.register(MenuContainerComponent, props);


