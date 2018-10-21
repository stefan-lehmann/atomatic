import VueComponent from '../../vue/VueComponent';
import templateFn from './template.pug';

class MenuListComponent extends VueComponent {

  props() {
    return {
      props: {
        items: {
          type: Array,
          required: true
        },
        level: {
          type: Number,
          required: true,
          default: 0
        }
      },
      template: templateFn({})
    };
  }
}

MenuListComponent.register('menu-list', MenuListComponent);

export default MenuListComponent;
