import Vue from 'vue'

<%for (var key in options.vuefrontConfig.plugins) {%>
  require('<%= options.vuefrontConfig.plugins[key] %>')
<%}%>
<%for (var key in options.vuefrontConfig.css) {%>
    require('<%= options.vuefrontConfig.css[key] %>')
<%}%>

export default async (ctx, inject) => {
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
  } else {
    await ctx.store.dispatch('vuefront/nuxtClientInit', ctx)
  }
  <%for (var key in options.vuefrontConfig.components) {%>
    components['vf<%= key %>'] = Vue.component('vf<%= key %>', require('<%= options.vuefrontConfig.components[key] %>').default)
  <%}%>

  <%for (var key in options.vuefrontConfig.templates) {%>
    components['vfTemplate<%= key %>'] = Vue.component('vfTemplate<%= key %>', require('<%= options.vuefrontConfig.templates[key] %>').default)
  <%}%>

  <%for (var key in options.vuefrontConfig.positions) {%>
    components['vfPosition<%= key %>'] = Vue.component('vfPosition<%= key %>', require('<%= options.vuefrontConfig.positions[key] %>').default)
  <%}%>

  <%for (var key in options.vuefrontConfig.modules) {%>
    components['vfModule<%= key %>'] = Vue.component('vfModule<%= key %>', require('<%= options.vuefrontConfig.modules[key] %>').default)
  <%}%>

  inject('vuefront', {options: <%= JSON.stringify(options.vuefrontConfig.layouts) %>, components})
}
