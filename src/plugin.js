import Vue from 'vue'
export default () => {
  <%for (var key in options.storefrontConfig.components) {%>
    Vue.component('sf<%= key %>', require('<%= options.storefrontConfig.components[key] %>').default)
  <%}%>
}
