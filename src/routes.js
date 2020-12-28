const breadcrumbsLoad = (component) => {
  component.serverPrefetch = function() {
    return new Promise(async (resolve) => {
      this.$store.dispatch('common/breadcrumbs/init');
      if(this.handleLoadData) {
        await this.handleLoadData(this)
      }
      await this.$store.dispatch('common/breadcrumbs/load');
      resolve()
    })
  }
  component.created = function() {
    if (typeof this.loaded !== 'undefined') {
      if(!this.loaded) {
        this.$store.dispatch('common/breadcrumbs/init');
        this.$watch('loaded', () => {
            this.$store.dispatch('common/breadcrumbs/load');
        })
      }
    } else {
        this.$store.dispatch('common/breadcrumbs/load');
    }
  }
}

export const getRoutes = () => {
    return [<% for (var i=0; i < options.routes.length; i++){%> {
        name: '<%= options.routes[i].name %>',
        path: '<%= options.routes[i].path %>',
        <% if(typeof options.routes[i].props !== 'undefined') {%>
        props: <%= JSON.stringify(options.routes[i].props) %>,
        <% } %>
        component: () => {
          return <%= options.routes[i].component %>
        }

    }, <% } %>]
}
