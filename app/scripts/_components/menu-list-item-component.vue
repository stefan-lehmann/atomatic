<script>
  import menuListComponent from './menu-list-component.vue';

  export default {

    components: {
      menuListComponent
    },

    data() {
      return {
        active: false
      };
    },

    props: {
      item: {
        type: Object,
        required: true
      },
      level: {
        type: Number,
        required: true,
        default: 0
      }
    },

    methods: {
      toggle () {
        this.active = !this.active;
      },

      getUrl () {
        const
          {urls = []} =  this.item,
          [first = {url: ''}] = urls,
          {url = first.url} =  this.item;
        return '#' + url
      },

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
            return false
          }
        }
        return true;
      }
    },

    beforeMount() {
      this.item.active = false;
    }
  };
</script>

<template>
  <li v-if="isParentItem()" class="dsc-nav__list-item">
                <span
                    @click="toggle()"
                    :class="['dsc-nav__link',
                            'dsc-nav__link--level'+level,
                             active ? 'dsc-nav__list-item--active' : '']">
                  {{ item.title }}
                </span>
    <menu-list-component
        v-if="active === true"
        :items="item.urls"
        :active="item.active"
        :level="level+1"></menu-list-component>
  </li>
  <li v-else class="dsc-nav__list-item">
    <a :href="getUrl()"
       :class="['dsc-nav__link',
                            'dsc-nav__link--level'+level,
                             active ? 'dsc-nav__list-item--active' : '']">
      {{ item.title }}
    </a>
  </li>
</template>