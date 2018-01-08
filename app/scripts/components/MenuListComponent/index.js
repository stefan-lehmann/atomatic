import VueComponent from '../../vue/VueComponent';

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
      template: require('./template.pug')({})
    };
  }
}

MenuListComponent.register('menu-list', MenuListComponent);

export default MenuListComponent;