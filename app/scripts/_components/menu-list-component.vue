<script>

  export default {

    beforeCreate() {
      this.$options.components.menuListItemComponent = require('./menu-list-item-component.vue')
    },

    props: {
      items: {
        type: Array,
        required: true
      },
      level: {
        type: Number,
        required: true,
        'default': 0
      }
    }
  };
</script>

<template>
  <ul class="dsc-nav__list" :class="'dsc-nav__list--level'+level">
    <menu-list-item-component
        v-for="(urlItem, index) in items"
        :key="urlItem.title"
        :item="urlItem"
        :level="level"></menu-list-item-component>
  </ul>
</template>