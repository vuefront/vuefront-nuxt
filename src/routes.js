import Vue from 'vue'
export const getRoutes = () => {
  return [<% for (var i=0; i < options.routes.length; i++){%>
    {
      name: '<%= options.routes[i].name %>',
      path: '<%= options.routes[i].path %>',<% if(typeof options.routes[i].props !== 'undefined') {%>
      props: <%= JSON.stringify(options.routes[i].props) %>,<% } %>
      component: () =>
        <%= options.routes[i].component %>
    },<% } %>
  ]
}