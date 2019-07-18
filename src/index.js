const path = require('path')
let themeOptions = require('vuefront').default
const _ = require('lodash')
const ApolloClient = require('apollo-boost').default
require('isomorphic-fetch')
const ampify = require('./plugins/ampify')

const routePath = options => {
  if (typeof options['component'] !== 'undefined') {
    return `import('${options.component}').then((m) => {
            return m.default || m
          })`
  } else if (typeof options === 'string') {
    return `import('${options}').then((m) => {
            return m.default || m
          })`
  } else {
    return `import('${options.package}').then((m) => {
            return m['${options.el}'].default || m['${options.el}']
        })`
  }
}

const mergeConfig = (objValue, srcValue) => {
  if (_.isArray(objValue)) {
    return objValue.concat(srcValue)
  } else if (_.isObject(objValue)) {
    return _.merge(objValue, srcValue)
  } else {
    return srcValue
  }
}

export default async function vuefrontModule(_moduleOptions) {
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

  const prefix =
    process.env.API_PREFIX || moduleOptions.prefix || moduleOptions.targetUrl
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

  const client = new ApolloClient({
    uri: baseURL
  })

  let whiteList = []
  let routes = []

  for (const url in themeOptions.pages) {
    const pageComponent = themeOptions.pages[url]
    if (_.isObject(pageComponent)) {
      if (!_.isUndefined(pageComponent.generate) && pageComponent.generate) {
        whiteList = [...whiteList, url, '/amp' + url]
      }
      let result = []
      if (!_.isUndefined(pageComponent.seo)) {
        let seoResolver = ''
        if (typeof pageComponent.seo === 'string') {
          seoResolver = require(pageComponent.seo).default
        } else {
          seoResolver = require(pageComponent.seo.package)
          if (typeof pageComponent.seo.path === 'string') {
            seoResolver = seoResolver[pageComponent.seo.path]
          } else {
            for (const key in pageComponent.seo.path) {
              seoResolver = seoResolver[pageComponent.seo.path[key]]
            }
          }
        }

        result = await seoResolver({ client })
      }
      routes.push({
        name: url.replace('/', '_').replace(':', '_'),
        path: url,
        component: routePath(pageComponent)
      })
      routes.push({
        name: 'amp_' + url.replace('/', '_').replace(':', '_'),
        path: '/amp' + url,
        component: routePath(pageComponent)
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
              component: routePath(pageComponent),
              props: { ...result[urlKey], url }
            })
            routes.push({
              name: 'amp_' + result[urlKey].keyword,
              path: '/amp/' + result[urlKey].keyword,
              component: routePath(pageComponent),
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
        component: routePath(pageComponent)
      })
      routes.push({
        name: 'amp_' + url.replace('/', '_').replace(':', '_'),
        path: '/amp' + url,
        component: routePath(pageComponent)
      })
    }
  }

  const pages = _.ceil(routes.length / 500)

  for (var i = 0; i < pages; i++) {
    this.addPlugin({
      fileName: `vuefront/routes${i + 1}.js`,
      src: path.resolve(__dirname, './routes.js'),
      options: {
        routes: _.slice(routes, i * 500, i * 500 + 500)
      }
    })
  }

  this.addPlugin({
    src: path.resolve(__dirname, 'router.js'),
    fileName: 'router.js',
    options: {
      pages
    }
  })

  let defaultRouter

  try {
    defaultRouter = require.resolve('@nuxt/vue-app/template/router')
  } catch (err) {
    defaultRouter = require.resolve('nuxt/lib/app/router')
  }

  this.addTemplate({
    fileName: 'defaultRouter.js',
    src: defaultRouter
  })

  this.addPlugin({
    fileName: 'vuefront.js',
    src: path.resolve(__dirname, './plugin.js'),
    options: {
      vuefrontConfig: themeOptions,
      debug: this.options.dev,
      browserBaseURL,
      baseURL,
      pages
    }
  })

  this.nuxt.hook('generate:extendRoutes', async routes => {
    const routesToGenerate = routes.filter(page =>
      whiteList.includes(page.route)
    )
    routes.splice(0, routes.length, ...routesToGenerate)
  })

  this.nuxt.hook('generate:page', page => {
    page.html = ampify(page.html, page.route)
  })

  // This hook is called before serving the html to the browser
  this.nuxt.hook('render:route', (url, page, { req, res }) => {
    page.html = ampify(page.html, url)
  })

  this.extendBuild((config, { isServer }) => {
    const { rules } = config.module

    const hasGqlLoader = rules.some(rule => rule.use === 'graphql-tag/loader')

    if (!hasGqlLoader) {
      const gqlRules = {
        test: /\.(graphql|gql)$/,
        use: 'graphql-tag/loader'
      }

      rules.push(gqlRules)
    }

    const hasBlockLoader = rules.some(
      rule => rule.resourceQuery === /blockType=graphql/
    )
    if (!hasBlockLoader) {
      const blockRules = {
        resourceQuery: /blockType=graphql/,
        use: [
          {
            loader: require.resolve('vue-graphql-loader')
          }
        ]
      }
      rules.push(blockRules)
    }

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
