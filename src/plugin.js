import Vue from 'vue'
import VueI18n from 'vue-i18n'
import ApolloClient from 'apollo-boost';
import _ from 'lodash'
import 'isomorphic-fetch'

Vue.use(VueI18n)

export const init = (ctx, inject) => {
  const baseURL = process.browser
      ? '<%= options.browserBaseURL %>'
      : '<%= options.baseURL %>'

  const client = new ApolloClient({
      uri: baseURL,
      request: (operation) => {
        operation.setContext({
          headers: {
            'Cookie': _.map(ctx.app.$cookies.getAll(), (value, index) => (index + '=' + value)).join(';')
          }
        });
      }
    });
    
  inject('vfapollo', client)
}

<%for (var key in options.vuefrontConfig.plugins) {%>
  require('<%= options.vuefrontConfig.plugins[key] %>')
<%}%>
<%for (var key in options.vuefrontConfig.css) {%>
    require('<%= options.vuefrontConfig.css[key] %>')
<%}%>

function loadLocaleMessages() {
  const locales = require.context(`~/locales`, true, /\.json$/)
  const messages = {}
  locales.keys().forEach(key => {
    const local = /^.\/([a-zA-Z-]+)\//.exec(key)[1]
    if(_.isUndefined(messages[local])) {
      messages[local] = {}
    }
    let path = /^.\/[a-zA-Z-]+\/(.*).json/.exec(key)[1]
    path = '['+path.split('/').join('][')+']'
    _.set(messages, local+path, locales(key))
  })
  return messages
}

export default async (ctx, inject) => {
    init(ctx, inject)
  const components = {
      element: {},
      template: {},
      position: {},
      module: {}
  }

  <%for (var key in options.vuefrontConfig.store) {%>
    <% if (typeof options.vuefrontConfig.store[key].module !== 'undefined') { %>
        ctx.store.registerModule(<%= JSON.stringify(options.vuefrontConfig.store[key].path) %>, {namespaced: true, ...require('<%= options.vuefrontConfig.store[key].module %>')})
    <% } else {%>
        ctx.store.registerModule(<%= JSON.stringify(options.vuefrontConfig.store[key].path) %>, {namespaced: true})
    <% } %>

  <%}%>
  if(process.server) {
    await ctx.store.dispatch('vuefront/nuxtServerInit', ctx)
  }
  <%for (var key in options.vuefrontConfig.components) {%>
    components['vf<%= key %>'] = Vue.component('vf<%= key %>', require('<%= options.vuefrontConfig.components[key] %>').default)
  <%}%>

  <%for (var key in options.vuefrontConfig.templates) {%>
    components['vfTemplate<%= key %>'] = Vue.component('vfTemplate<%= key %>', require('<%= options.vuefrontConfig.templates[key] %>').default)
  <%}%>

  <%for (var key in options.vuefrontConfig.modules) {%>
    components['vfModule<%= key %>'] = Vue.component('vfModule<%= key %>', require('<%= options.vuefrontConfig.modules[key] %>').default)
  <%}%>

  inject('vuefront', {options: <%= JSON.stringify(options.vuefrontConfig.layouts) %>, components})

  ctx.app.i18n = new VueI18n({
    locale: ctx.store.getters['common/language/locale'],
    messages: loadLocaleMessages()
  })


}
