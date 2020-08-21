import gql from 'graphql-tag'
export default (ctx) => {
  ctx.app.router.beforeEach(async (to, from, next) => {

    const matched = ctx.app.router.getMatchedComponents(to)
    if (matched.length === 0) {
      try {
        const { data } = await ctx.$axios.post(process.env.API_URL,{
          query: `query($url: String) {
            searchUrl(url: $url) {
              url
              type
              id
            }
          }`,
          variables: {
            url: to.path
          }
        })
        const { type, id } = data.data.searchUrl
        if (type && id) {
          if (type === 'page') {
            ctx.app.router.addRoutes([{
              name: to.path,
              alias: to.path,
              path: `/page/${id}`
            }])
          } else if (type === 'category') {
            ctx.app.router.addRoutes([{
              name: to.path,
              alias: to.path,
              path: `/store/category/${id}`
            }])
          } else if (type === 'product') {
            ctx.app.router.addRoutes([{
              name: to.path,
              alias: to.path,
              path: `/store/product/${id}`
            }])
          } else if (type === 'store') {
            ctx.app.router.addRoutes([{
              name: to.path,
              alias: to.path,
              path: `/mystore/${id}`
            }])
          } else if (type === 'blog-category') {
            ctx.app.router.addRoutes([{
              name: to.path,
              alias: to.path,
              path: `/blog/category/${id}`
            }])
          } else if (type === 'blog-post') {
            ctx.app.router.addRoutes([{
              name: to.path,
              alias: to.path,
              path: `/blog/post/${id}`
            }])
          } else {
            next()
          }
          next({ ...to, replace: true })
        } else {
          next()
        }
      } catch (e) {
        console.log(e);
        ctx.store.commit('vuefront/setResponseError', e)
        next()
      }
    } else {
      next()
    }
  })
}
