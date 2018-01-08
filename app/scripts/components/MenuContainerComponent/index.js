import VueComponent from '../../vue/VueComponent';

class MenuContainerComponent extends VueComponent {

  props() {
    return {
      template: require('./template.pug')({})
    };
  }

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

MenuContainerComponent.register('menu-container', MenuContainerComponent);

export default MenuContainerComponent;

