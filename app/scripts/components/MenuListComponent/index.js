import VueComponent from '../../services/VueComponent';

const props = {
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

class MenuListComponent extends VueComponent {
}

VueComponent.register(MenuListComponent, props);

