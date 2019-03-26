import Vue from 'vue'
export default () => {
  <%for (var key in options.vuefrontConfig.components) {%>
    Vue.component('vf<%= key %>', require('<%= options.vuefrontConfig.components[key] %>').default)
  <%}%>
}
