import VueComponent from '../../vue/VueComponent';
import templateFn from './template.pug';

class MenuContainerComponent extends VueComponent {

  props() {
    return {
      watch: {
        url: {
          handler: 'onSearchChange'
        }
      },
      template: templateFn({})
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
    return this.$store.getters.filteredStructure || this.$store.getters.sections;
  }

  get isFiltered() {
    return !!this.$store.getters.filteredStructure;
  }
}

MenuContainerComponent.register('menu-container', MenuContainerComponent);

export default MenuContainerComponent;

