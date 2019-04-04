import Vue from 'vue'
<%for (var key in options.vuefrontConfig.plugins) {%>
  require('<%= options.vuefrontConfig.plugins[key] %>')
<%}%>
<%for (var key in options.vuefrontConfig.css) {%>
    require('<%= options.vuefrontConfig.css[key] %>')
<%}%>
export default (ctx, inject) => {
  <%for (var key in options.vuefrontConfig.components) {%>
    Vue.component('vf<%= key %>', require('<%= options.vuefrontConfig.components[key] %>').default)
  <%}%>
    <%for (var key in options.vuefrontConfig.partials) {%>
    Vue.component('vfPartial<%= key %>', require('<%= options.vuefrontConfig.partials[key] %>').default)
  <%}%>

  <%for (var key in options.vuefrontConfig.modules) {%>
    Vue.component('vfModule<%= key %>', require('<%= options.vuefrontConfig.modules[key] %>').default)
  <%}%>

  inject('vuefront', {options: <%= JSON.stringify(options.vuefrontConfig.layouts) %>})
}
