import VueDirective from '../../services/VueDirective';

class PersistScrollPosDirective extends VueDirective {

  inserted(el, binding){
    const
      {$store} = this,
      {value:id='test'} = binding;

    el.addEventListener('scroll', this.scrollHandler.bind({$store, id}));
    el.scrollTop = this.$store.getters.scrollPos[id] || 0;
  }

  scrollHandler(event) {
    const
      {id} = this,
      {target: {scrollTop}} = event;

    this.$store.commit('scrollPos', {id, scrollTop});
  }

}

VueDirective.register(PersistScrollPosDirective);


