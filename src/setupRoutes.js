const ApolloClient = require('apollo-boost').default
const _ = require('lodash')
require('isomorphic-fetch')
const convertComponent = (component, config) => {
  if (config.pages[component].type === 'full') {
    return `import('${config.pages[component].path}').then((m) => {
      const component = m || m.default
      breadcrumbsLoad(component)
      return component
    })`
  } else {
    return `import('${config.pages[component].path}').then((m) => {
      let component = m.${config.pages[component].component}
      component = component || component.default
      breadcrumbsLoad(component)
      return component
    })`
  }
}
export default async (baseURL, config) => {
  const client = new ApolloClient({
    uri: baseURL
  })
  let whiteList = []
  let routes = []
  for (const url in config.seo) {
    const pageComponent = config.seo[url]
    if (_.isObject(pageComponent)) {
      if (!_.isUndefined(pageComponent.generate) && pageComponent.generate) {
        whiteList = [...whiteList, url, '/amp' + url]
      } else if (_.isUndefined(pageComponent.generate) && !url.includes(':')) {
        whiteList = [...whiteList, url, '/amp' + url]
      }
      let result = []
      if (!_.isUndefined(pageComponent.seo)) {
        let seoResolver = pageComponent.seo

        result = await seoResolver({ client })
      }
      routes.push({
        name: url.replace('/', '_').replace(':', '_'),
        path: url,
        component: convertComponent(pageComponent.component, config)
      })
      routes.push({
        name: 'amp_' + url.replace('/', '_').replace(':', '_'),
        path: '/amp' + url,
        component: convertComponent(pageComponent.component, config)
      })
      if (!_.isUndefined(pageComponent.seo) && !_.isEmpty(result)) {
        for (const urlKey in result) {
          if (result[urlKey].keyword !== '') {
            if (
              !_.isUndefined(pageComponent.generate) &&
              pageComponent.generate
            ) {
              whiteList = [
                ...whiteList,
                '/' + result[urlKey].keyword,
                '/amp/' + result[urlKey].keyword
              ]
            } else if (_.isUndefined(pageComponent.generate)) {
              whiteList = [
                ...whiteList,
                '/' + result[urlKey].keyword,
                '/amp/' + result[urlKey].keyword
              ]
            }
            routes.push({
              name: result[urlKey].keyword,
              path: '/' + result[urlKey].keyword,
              component: convertComponent(pageComponent.component, config),
              props: { ...result[urlKey], url }
            })
            routes.push({
              name: 'amp_' + result[urlKey].keyword,
              path: '/amp/' + result[urlKey].keyword,
              component: convertComponent(pageComponent.component, config),
              props: { ...result[urlKey], url }
            })
          }
        }
      }
    } else {
      whiteList = [...whiteList, url, '/amp' + url]
      routes.push({
        name: url.replace('/', '_').replace(':', '_'),
        path: url,
        component: convertComponent(pageComponent.component, config)
      })
      routes.push({
        name: 'amp_' + url.replace('/', '_').replace(':', '_'),
        path: '/amp' + url,
        component: convertComponent(pageComponent.component, config)
      })
    }
  }

  return {
    routes,
    whiteList
  }
}