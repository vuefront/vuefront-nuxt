import Vue from 'vue'

import Router from 'vue-router'
import { createRouter as createDefaultRouter } from './defaultRouter'
<% for(var i=0; i < options.pages; i++) {%>
const routes<%= i+1 %> = require('./vuefront/routes<%= i+1 %>.js').getRoutes()
<% } %>
// Vue.use(Router)

export function createRouter(ssrContext, config) {
  const defaultRouter = createDefaultRouter(ssrContext, config)
  return new Router({
    ...defaultRouter.options,
    routes: [
      <% for(var i=0; i < options.pages; i++) {%>
        ...routes<%= i+1%>,<% } %>
    ...defaultRouter.options.routes
    ]
  })

}
