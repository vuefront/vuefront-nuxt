import Vue from 'vue'
import VueI18n from 'vue-i18n'
import ApolloClient from "apollo-boost";
import _ from 'lodash'
import 'isomorphic-fetch'
<%for (var key in options.vuefrontConfig.css) {%>
import '<%= options.vuefrontConfig.css[key] %>'<%}%>

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
      request: (operation) => {
        operation.setContext({
          fetchOptions: {
            credentials: 'include'
          }
        });
        operation.setContext({
          headers: {
            'Cookie': _.map(ctx.app.$cookies.getAll(), (value, index) => (index + '=' + value)).join(';')
          }
        });
      }
    });
    
  inject('vfapollo', client)
}

function loadLocaleMessages(options) {
  const locales = require.context(`~/locales`, true, /\.json$/)
  const messages = {}
 
  <% for (var key in options.vuefrontConfig.locales) { %>
  if(_.isUndefined(messages['<%=key%>'])) {
    messages['<%=key%>'] = {}
  }
  <% for (var key2 in options.vuefrontConfig.locales[key]) { %>
  messages['<%=key%>'] = _.merge({}, messages['<%=key%>'], require('<%=options.vuefrontConfig.locales[key][key2]%>'))
  <%}%>
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

<%for (var key in options.vuefrontConfig.plugins) {%>
import plugin<%= key %> from '<%= options.vuefrontConfig.plugins[key] %>'
<%}%>

export default async (ctx, inject) => {
  init(ctx, inject)
  const options = <%= JSON.stringify(options.vuefrontConfig) %>
  <%for (var key in options.vuefrontConfig.plugins) {%>
    await plugin<%= key %>(ctx)
  <%}%>
  const components = {
      element: {},
      template: {},
      position: {},
      module: {}
  }

  const opts = {}

  if(process.client) {
    if(_.isUndefined(window.__NUXT__)) {
      opts.preserveState = false
    }
  }

  <%for (var key in options.vuefrontConfig.store) {
     if (typeof options.vuefrontConfig.store[key].module !== 'undefined') { %>
  ctx.store.registerModule(<%= JSON.stringify(options.vuefrontConfig.store[key].path) %>, {namespaced: true, ...require('<%= options.vuefrontConfig.store[key].module %>')}, opts)<% } else {%>
  ctx.store.registerModule(<%= JSON.stringify(options.vuefrontConfig.store[key].path) %>, {namespaced: true}, opts)<% } }%>

  <%for (var key in options.vuefrontConfig.components) {%>
  components['vf<%= key %>'] = Vue.component('vf<%= key %>', require('<%= options.vuefrontConfig.components[key] %>').default)<%}%>

  <%for (var key in options.vuefrontConfig.templates) {%>
  components['vfTemplate<%= key %>'] = Vue.component('vfTemplate<%= key %>', require('<%= options.vuefrontConfig.templates[key] %>').default)<%}%>

  <%for (var key in options.vuefrontConfig.modules) {%>
  components['vfModule<%= key %>'] = Vue.component('vfModule<%= key %>', require('<%= options.vuefrontConfig.modules[key] %>').default)<%}%>

  <%for (var key in options.vuefrontConfig.loaders) {%>
    components['vfLoader<%= key %>'] = Vue.component('vfLoader<%= key %>', require('<%= options.vuefrontConfig.loaders[key] %>').default)<%}%>

  inject('vuefront', {
    options,
    components,
    baseURL,
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
    messages: loadLocaleMessages(options)
  })

}
