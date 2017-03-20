<script>
  import menuListItemComponent from './menu-list-item-component.vue';

  export default {

    components: {
      menuListItemComponent
    },

    data: () => ({
      level: 0
    }),

    computed: {
      sections() {
        return this.$store.state.sections;
      }
    },
    beforeCreate () {
      this.$store.dispatch('fetchSections')
    }
  };
</script>

<template>
  <div class="dsc-nav">
    <ul class="dsc-nav__list" :class="'dsc-nav__list--level'+level">
      <menu-list-item-component
          v-for="(sectionItem, index) in sections"
          :key="sectionItem.title"
          :item="sectionItem"
          :level="level"></menu-list-item-component>
    </ul>
  </div>
</template>