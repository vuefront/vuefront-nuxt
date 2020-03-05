const _ = require('lodash')

const mergeConfig = (objValue, srcValue) => {
  if (_.isArray(objValue)) {
    return objValue.concat(srcValue)
  } else if (_.isObject(objValue)) {
    return _.merge(objValue, srcValue)
  } else {
    return srcValue
  }
}

const convertPath = (config) => {
  let result = {}
  const keys = ['atoms', 'molecules', 'organisms', 'templates', 'pages', 'loaders', 'extensions']
  for (const type in keys) {
    if(!config[keys[type]]) {
      continue
    }
    result[keys[type]] = {}
    for(const key in config[keys[type]]) {
      try {
        require.resolve(config[keys[type]][key])
        result[keys[type]][key] = {
          type: 'full',
          path: config[keys[type]][key]
        }
      } catch(e) {
        try {
          require.resolve(config.root.components + '/' +config[keys[type]][key])
          result[keys[type]][key] = {
            type: 'full',
            path: config.root.components + '/' +config[keys[type]][key]
          }
        } catch(e) {
          result[keys[type]][key] = {
            type: 'inside',
            path: config.root.components,
            component: config[keys[type]][key]
          }
        }
      }
    }
  }

  if(config.store) {
    result.store = []
    for (const key in config.store) {
      if(!config.store[key].module) {
        result.store[key] = {
          ...config.store[key]
        }
        continue
      }
      try {
        require.resolve(config.store[key].module)
        result.store[key] = {
          ...config.store[key],
          module: {
            type: 'full',
            path: config.store[key].module
          }
        }
      } catch(e) {
        try {
          require.resolve(config.root.store + '/' + config.store[key].module)
          result.store[key] = {
            ...config.store[key],
            module: {
              type: 'full',
              path: config.root.store + '/' + config.store[key].module
            }
          }
        } catch(e) {
          result.store[key] = {
            ...config.store[key],
            module: {
              type: 'inside',
              path: config.root.store,
              component: config.store[key].module
            }
          }
        }
      }
    }
  }

  if(config.locales) {
    result.locales = {}
    for (const key in config.locales) {
      result.locales[key] = []
      for (const key2 in config.locales[key]) {
        try {
          require.resolve(config.locales[key][key2])
          result.locales[key][key2] = {
            type: 'full',
            path: config.locales[key][key2]
          }
        } catch(e) {
          try {
            require.resolve(config.root.locales + '/' + config.locales[key][key2])
            result.locales[key][key2] = {
              type: 'full',
              path: config.root.locales + '/' + config.locales[key][key2]
            }
          } catch(e) {
            result.locales[key][key2] = {
              type: 'inside',
              path: config.root.locales,
              component: config.locales[key][key2]
            }
          }
        }
      }
    }
  }
  
  return result
}

export default (rootDir) => {
  let themeOptions = require('vuefront').default

  themeOptions = {...themeOptions, ...convertPath(themeOptions)}
  let config = require(rootDir + '/vuefront.config').default
  config = {...config, ...convertPath(config)}
  if (typeof config.theme !== 'undefined') {
    let customThemeOptions = require(config.theme).default
    customThemeOptions = {...customThemeOptions, ...convertPath(customThemeOptions)}
    themeOptions = _.mergeWith(themeOptions, customThemeOptions, mergeConfig)
  }
  themeOptions = _.mergeWith(themeOptions, config, mergeConfig)

  return themeOptions

}