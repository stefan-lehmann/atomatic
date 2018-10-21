import VueComponent from '../../vue/VueComponent';
import templateFn from './template.pug';

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
      template: templateFn({})
    };
  }
}

SourceCodeComponent.register('source-code', SourceCodeComponent);

export default SourceCodeComponent;


