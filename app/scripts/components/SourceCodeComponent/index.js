import VueComponent from '../../services/VueComponent';

const props = {
  props: {
    sourceCode: {
      type: String,
      required: true,
      default: ''
    },
    language: {
      type: String,
      required: true,
      default: ''
    },
    title: {
      type: String,
      default: ''
    }
  },

  template: require('./template.pug')({})
};

class SourceCodeComponent extends VueComponent {


}

VueComponent.register(SourceCodeComponent, props);


