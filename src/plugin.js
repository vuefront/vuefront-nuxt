import Vue from 'vue'
import VueI18n from 'vue-i18n'
import VueApollo from 'vue-apollo'
import ApolloClient from "apollo-boost";
import _ from 'lodash'
import 'isomorphic-fetch'

Vue.use(VueI18n)

const baseURL = process.browser
? '<%= options.browserBaseURL %>'
: '<%= options.baseURL %>'

export const init = (ctx, inject) => {
  const client = new ApolloClient({
      uri: baseURL,
      headers: {
        accept: 'application/json; charset=UTF-8',
        'content-type': 'application/json; charset=UTF-8'
      },
      onError: (error) => {
        if (error.graphQLErrors) {
          console.log('ApolloClient graphQLErrors')
          console.log(error.graphQLErrors)
        }
        if (error.networkError) {
          console.log('ApolloClient networkError')
          console.log(error.networkError.bodyText)
        }
      },
      request: (operation) => {
        operation.setContext({
          fetchOptions: {
            credentials: 'include'
          }
        });

        const headers = {}
        if (
          ctx.store.getters['common/customer/token']
        ) {
          headers['Authorization'] = `Bearer ${
            ctx.store.getters['common/customer/token']
          }`
        }

        headers['Cookie'] = _.map(
          ctx.app.$cookies.getAll(),
          (value, index) => {
            let resValue = value
            if(typeof value === 'object') {
              resValue = JSON.stringify(resValue)
            }
            if (typeof value === 'array') {
              resValue = JSON.stringify(resValue)
            }
            return index + '=' + resValue
          }
        ).join(';')

        operation.setContext({
          headers
        });
      }
    });
    Vue.use(VueApollo)
    
    inject('vfapollo', client)
}

function loadLocaleMessages(options) {
  const locales = require.context(`~/locales`, true, /\.json$/)
  const messages = {}

  <% for (var key in options.themeOptions.locales) { %>
    if(_.isUndefined(messages['<%= key %>'])) {
      messages['<%= key %>'] = {}
    }

    <% for (var key2 in options.themeOptions.locales[key]) { %>
      <% if (options.themeOptions.locales[key][key2].type === 'full') { %>
    messages['<%= key %>'] = _.merge({}, messages['<%= key %>'], require('<%= options.themeOptions.locales[key][key2].path %>'))
    <% } else { %>
    messages['<%= key %>'] = _.merge({}, messages['<%= key %>'], require('<%= options.themeOptions.locales[key][key2].path %>')['<%= options.themeOptions.locales[key][key2].component %>'])
      <% } %>
    <% } %>
      
  <% } %>

  locales.keys().forEach(key => {
    const local = /^.\/([a-zA-Z-]+)\//.exec(key)[1]
    if(_.isUndefined(messages[local])) {
      messages[local] = {}
    }

    let path = /^.\/[a-zA-Z-]+\/(.*).json/.exec(key)[1]
    const value = _.set({}, path.split('/'), locales(key))
    messages[local] = _.merge({}, messages[local], value)
  })

  return messages
}

export default async (ctx, inject) => {

  init(ctx, inject)

  const opts = {}

  if(process.client) {
    if(_.isUndefined(window.__NUXT__)) {
      opts.preserveState = false
    }
  }
  
  <% for (var key in options.themeOptions.store) { %>
  <% if (typeof options.themeOptions.store[key].module !== 'undefined') {%>
  <% if (options.themeOptions.store[key].module.type === 'full') { %>
  ctx.store.registerModule(<%= JSON.stringify(options.themeOptions.store[key].path) %>, {namespaced: true, ...require('<%= options.themeOptions.store[key].module.path %>')}, opts)
  <% } else { %>
  ctx.store.registerModule(<%= JSON.stringify(options.themeOptions.store[key].path) %>, {namespaced: true, ...require('<%= options.themeOptions.store[key].module.path %>')['<%= options.themeOptions.store[key].module.component %>']}, opts)
  <% } %>
  <% } else { %>
    ctx.store.registerModule(<%= JSON.stringify(options.themeOptions.store[key].path) %>, {namespaced: true}, opts)
  <% } %>
  <% } %>

  const extensions = {}

  <% for (var key in options.themeOptions.extensions) { %>
  <% if (options.themeOptions.extensions[key].type === 'full') { %>
  extensions.<%= key %> = () => import('<%= options.themeOptions.extensions[key].path %>');<% } else { %>
  extensions.<%= key %> = () => import('<%= options.themeOptions.extensions[key].path %>').then(m => m.<%= options.themeOptions.extensions[key].component %>);<% } %><% } %>

  const images = {}

  <% for (var key in options.images) { %>

  images.<%= key %> = {}<% if (typeof options.images[key].image !== 'undefined') { %>
  images.<%= key %>.image = <%= options.images[key].image  %>;
  <% } %><% if (typeof options.images[key].width !== 'undefined') { %>
  images.<%= key %>.width = <%= options.images[key].width  %>;
  images.<%= key %>.height = <%= options.images[key].height  %>;<% } %><% } %>

  inject('vuefront', {
    layouts: <%= JSON.stringify(options.themeOptions.layouts) %>,
    extensions,
    images,
    options: <%= JSON.stringify(options.themeOptions.options) %>,
    baseURL,
    get isAuth() {
      return ctx.store.getters['common/customer/auth']
    },
    async logout() {
      await ctx.store.dispatch('common/customer/logout')
      
      ctx.app.router.push("/account/login");
    },
    get isClient() {
      return process.client
    },
    get params() {
      let result = ctx.route.params
      if(!_.isEmpty(ctx.route.matched)) {
        result = {...result, ...ctx.route.matched[0].props.default}
      }

      return result
    },
    get isAMP() {
      return /^\/amp([\/].*)?$/gi.test(ctx.route.fullPath)
    }
  })

  if(process.server) {
    await ctx.store.dispatch('vuefront/nuxtServerInit', ctx)
  } else if(process.browser) {
    await ctx.store.dispatch('vuefront/nuxtClientInit', ctx)
  }

  ctx.app.i18n = new VueI18n({
    locale: ctx.store.getters['common/language/locale'],
    messages: loadLocaleMessages()
  })

}
