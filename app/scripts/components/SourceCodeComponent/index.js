import VueComponent from '../../vue/VueComponent';


class SourceCodeComponent extends VueComponent {

  props() {
    return {
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
  }
}

SourceCodeComponent.register('source-code', SourceCodeComponent);

export default SourceCodeComponent;


