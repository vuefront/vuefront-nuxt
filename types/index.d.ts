import Vue from 'vue'

declare module 'vue/types/vue' {
    interface Vue {
      $vuefront: {
        options: any
      }
    }
  }