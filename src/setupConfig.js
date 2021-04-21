const _ = require('lodash')

let rootPath = ''

const mergeConfig = (objValue, srcValue, index) => {
  if(index !== 'locales') {
    if (_.isArray(objValue)) {
      return objValue.concat(srcValue)
    } else if (_.isObject(objValue)) {
      return _.merge(objValue, srcValue)
    } else {
      return srcValue
    }
  } else if(_.includes(['atoms', 'layouts', 'molecules', 'organisms', 'extensions'], index)) {
    if (_.isArray(objValue)) {
      return objValue.concat(srcValue)
    } else if (_.isObject(objValue)) {
      return _.merge(objValue, srcValue)
    } else {
      return srcValue
    }
   } else {
    return _.mergeWith(objValue, srcValue, mergeConfig)
  }
}

const checkPath = (path) => {
  const newPath = _.replace(path, /^(~)/, rootPath)
  try {
    require.resolve(newPath)
    return true
  } catch (e) {
    
  }
  return false
}

const convertPath = (config) => {
  let result = {}
  const keys = ['atoms', 'molecules', 'organisms', 'templates', 'pages', 'loaders', 'extensions']
  for (const type in keys) {
    if(!config[keys[type]]) {
      continue
    }
    result[keys[type]] = {}
    const category = config[keys[type]]
    for(const key in category) {
      let component = typeof category[key] === 'object' ? category[key].component : category[key]
      let css = typeof category[key] === 'object' && typeof category[key].css !== 'undefined' ? category[key].css : undefined

      let compResult = {}

      if (!_.isUndefined(component)) {
        if(checkPath(component)) {
          compResult = {
            type: 'full',
            path: component
          }
        } else if(checkPath(config.root.components + '/' +component)) {
          compResult = {
            type: 'full',
            path: config.root.components + '/' +component,
          }
        } else {
          compResult = {
            type: 'inside',
            path: config.root.components,
            component,
          }
        }
      }
      if (!_.isUndefined(css)) {
        if(checkPath(css)) {
          compResult = {
            ...compResult,
            css
          }
        } else if(checkPath(config.root.components + '/' +css)) {
          compResult = {
            ...compResult,
            css: config.root.components + '/' +css,
          }
        }
      }
      result[keys[type]][key] = compResult
    }
  }

  if(config.store) {
    result.store = {}
    for (const key in config.store) {
      let storeResult = {}
      if(!config.store[key].module) {
        storeResult = config.store[key]
      } else {
        if(checkPath(config.store[key].module)) {
          storeResult = {
              ...config.store[key],
              module: {
                type: 'full',
                path: config.store[key].module
              }
            }
        } else if (checkPath(config.root.store + '/' + config.store[key].module)) {
          storeResult = {
              ...config.store[key],
              module: {
                type: 'full',
                path: config.root.store + '/' + config.store[key].module
              }
            }
        } else {
          storeResult = {
              ...config.store[key],
              module: {
                type: 'inside',
                path: config.root.store,
                component: config.store[key].module
              }
            }
        }
      }
      const storeKey = _.isArray(storeResult.path) ? storeResult.path.map(val => (_.capitalize(val))).join('') : storeResult.path
      result.store[storeKey] = storeResult
    }
  }

  if(config.locales) {
    result.locales = {}
    for (const key in config.locales) {
      result.locales[key] = []
      const locale = config.locales[key]
      for (const key2 in locale) {
        if(checkPath(locale[key2])) {
          result.locales[key].push({
            type: 'full',
            path: config.locales[key][key2]
          })
        } else if (checkPath(config.root.locales + '/' + config.locales[key][key2])) {
          result.locales[key].push({
            type: 'full',
            path: config.root.locales + '/' + config.locales[key][key2]
          })
        } else {
          result.locales[key].push({
            type: 'inside',
            path: config.root.locales,
            component: config.locales[key][key2]
          })
        }
      }
    }
  }
  
  return result
}

export default (rootDir) => {
  let themeOptions = require('vuefront').default

  rootPath = rootDir

  themeOptions = {...themeOptions, ...convertPath(themeOptions)}
  
  let config = require(rootDir + '/vuefront.config').default
  config = {...config, ...convertPath(config)}
  if (typeof config.app !== 'undefined') {
    for(const key in config.app) {
      let customAppOptions = require(config.app[key]).default
      customAppOptions = {...customAppOptions, ...convertPath(customAppOptions)}
      themeOptions = _.mergeWith(themeOptions, customAppOptions, mergeConfig)
    }
  }

  if (typeof config.theme !== 'undefined') {
    let customThemeOptions = require(config.theme).default
    customThemeOptions = {...customThemeOptions, ...convertPath(customThemeOptions)}
    themeOptions = _.mergeWith(themeOptions, customThemeOptions, mergeConfig)
  }
  themeOptions = _.mergeWith(themeOptions, config, mergeConfig)

  return themeOptions

}