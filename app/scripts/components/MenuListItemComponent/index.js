import VueComponent from '../../vue/VueComponent';
import templateFn from './template.pug';

class MenuListItemComponent extends VueComponent {

  get classObject() {
    return {
      'dsc-nav__link': true,
      ['dsc-nav__link--level' + this.level]: true,
      'dsc-nav__link--filtered': this.filtered,
      'dsc-nav__link--active': this.activeState,
      'dsc-nav__link--current': this.current
    };
  }

  get activeState() {
    return this.$store.getters.menuItemActiveStates[this.item.url];
  }

  get current() {
    return this.$store.getters.url === this.item.url || this.$store.getters.url === this.item.baseUrl;
  }

  props() {
    return {
      props: {
        item: {
          type: Object,
          required: true
        },
        level: {
          type: Number,
          required: true,
          default: 0
        },
        filtered: {
          type: Boolean,
          default: false
        }
      },
      template: templateFn({})
    };
  }

  toggle() {
    this.$store.commit('toggleMenuItemActiveState', {url: this.item.url});
  }

  setUrl() {
    this.$store.dispatch('setUrl', this.getResolvedUrl());
  }

  isParentItem() {
    if (this.item.urls === undefined) {
      return false;
    }
    if (this.item.urls.length === 0) {
      return false;
    }
    if (this.item.urls.length < 2) {
      const [firstChild] = this.item.urls;
      if (!firstChild.urls || firstChild.urls.length === 0) {
        return false;
      }
    }
    return true;
  }

  getResolvedUrl() {
    const
      {item: {baseUrl, urls: [{url = this.item.url}] = [{url: this.item.url}]}} = this;

    return this.filtered ? baseUrl : url;
  }
}

MenuListItemComponent.register('menu-list-item', MenuListItemComponent);

export default MenuListItemComponent;
