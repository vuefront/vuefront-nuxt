const path = require('path')
let themeOptions = require('vuefront').default
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

export default function vuefrontModule(_moduleOptions) {
  const isNuxtVersion2 = this.options.build.transpile
  const moduleOptions = { ...this.options.vuefront, ..._moduleOptions }
  const defaultPort =
    process.env.API_PORT ||
    process.env.PORT ||
    process.env.npm_package_config_nuxt_port ||
    3000

  // Default host
  let defaultHost =
    process.env.API_HOST ||
    process.env.HOST ||
    process.env.npm_package_config_nuxt_host ||
    'localhost'

  /* istanbul ignore if */
  if (defaultHost === '0.0.0.0') {
    defaultHost = 'localhost'
  }

  const prefix = process.env.API_PREFIX || moduleOptions.prefix || moduleOptions.targetUrl
  let browserBaseURL = null
  let baseURL = `http://${defaultHost}:${defaultPort}${prefix}`

  if (process.env.API_URL) {
    baseURL = process.env.API_URL
  }

  if (process.env.API_URL_BROWSER) {
    browserBaseURL = process.env.API_URL_BROWSER
  }

  if (!browserBaseURL) {
    browserBaseURL = moduleOptions.proxy ? prefix : baseURL
  }

  const config = require(this.options.rootDir + '/vuefront.config').default
  if (typeof config.theme !== 'undefined') {
    const customThemeOptions = require(config.theme).default
    themeOptions = _.mergeWith(themeOptions, customThemeOptions, mergeConfig)
  }
  themeOptions = _.mergeWith(themeOptions, config, mergeConfig)
  this.addPlugin({
    src: path.resolve(__dirname, './plugin.js'),
    options: {
      vuefrontConfig: themeOptions,
      debug: this.options.dev,
      browserBaseURL,
      baseURL
    }
  })

  this.extendRoutes((routes, resolve) => {
    for (const url in themeOptions.pages) {
      const pageComponent = themeOptions.pages[url]
      routes.push({
        name: url.replace('/', '_').replace(':', '_'),
        path: url,
        component: resolve('', 'node_modules/' + pageComponent)
      })
    }
  })

  this.extendBuild((config, { isServer }) => {
    const vuefrontRe = 'vuefront/lib'
    if (isNuxtVersion2) {
      this.options.build.transpile.push(vuefrontRe)
    } else {
      config.externals = [
        nodeExternals({
          whitelist: [vuefrontRe]
        })
      ]
    }
  })
}
