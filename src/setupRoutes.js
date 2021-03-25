const isObject = require('lodash/isObject')
const isEmpty = require('lodash/isEmpty')
const isUndefined = require('lodash/isUndefined')
const convertComponent = (component, config) => {
  if (config.pages[component].type === 'full') {
    return `import('${config.pages[component].path}').then((m) => {
      const component = m.default || m
      breadcrumbsLoad(component)
      return component
    })`
  } else {
    return `import('${config.pages[component].path}').then((m) => {
      let component = m.${config.pages[component].component}
      component = component.default || component
      breadcrumbsLoad(component)
      return component
    })`
  }
}
export default async (config) => {
  let whiteList = []
  let exclude = []
  let routes = []
  for (const url in config.seo) {
    const pageComponent = config.seo[url]
    if (isObject(pageComponent)) {
      if (!isUndefined(pageComponent.generate) && pageComponent.generate) {
        whiteList = [...whiteList, url]
      } else if (isUndefined(pageComponent.generate) && !url.includes(':')) {
        whiteList = [...whiteList, url]
      } else {
        exclude = [...exclude, url]
      }
      let result = []
        routes.push({
          name: url.replace('/', '_').replace(':', '_'),
          path: url,
          component: convertComponent(pageComponent.component, config)
        })
      if (!isUndefined(pageComponent.seo) && !isEmpty(result)) {
        for (const urlKey in result) {
          if (result[urlKey].url !== '') {
            if (
              !isUndefined(pageComponent.generate) &&
              pageComponent.generate
            ) {
              whiteList = [
                ...whiteList,
                result[urlKey].url,
              ]
            } else if (isUndefined(pageComponent.generate)) {
              whiteList = [
                ...whiteList,
                result[urlKey].url,
              ]
            } else {
              exclude = [...exclude, result[urlKey].url]
            }
          }
        }
      }
    } else {
      whiteList = [...whiteList, url]
      routes.push({
        name: url.replace('/', '_').replace(':', '_'),
        path: url,
        component: convertComponent(pageComponent.component, config)
      })
    }
  }

  return {
    routes,
    whiteList,
    exclude
  }
}