import { readFileSync } from 'fs'

const path = require('path')
let seoConfig = require('vuefront/seo').default
const _ = require('lodash')
const ApolloClient = require('apollo-boost').default
require('isomorphic-fetch')
const ampify = require('./plugins/ampify')
var fs = require('fs');

const readConfigFile = (path) => {
  const result = {}
  try {
      var filename = require.resolve(path);
      const configContent = fs.readFileSync(filename, 'utf8');
      let matched = /css.*:[\s\n\r]+\{([^{]+)\}/.exec(configContent)
      if(!_.isEmpty(matched)) {
        const cssConfig = 
        matched[1]
          .replace(/\s\n/, '')
          .split(',')
          .map((str) => 
            str
            .split(':')
            .map(strV => 
              strV
              .trim()
              .replace(/\'/g, '')
              )
            ).reduce((accumulator, currentValue) => {
              accumulator[currentValue[0]] = currentValue[1]
              return accumulator
            }, {})

            result.css = cssConfig
      }
      matched = /theme: \'(.*)\'/.exec(configContent)
      if(!_.isEmpty(matched)) {
        result.theme = matched[1]
      }
  } catch (e) {
  }

  return result
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

  const theme = process.env.VUEFRONT_THEME || 'default'

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

  const client = new ApolloClient({
    uri: baseURL
  })

  let whiteList = []
  let routes = []
  for (const url in seoConfig) {
    const pageComponent = seoConfig[url]
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
        component: pageComponent.component
      })
      routes.push({
        name: 'amp_' + url.replace('/', '_').replace(':', '_'),
        path: '/amp' + url,
        component: pageComponent.component
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
              component: pageComponent.component,
              props: { ...result[urlKey], url }
            })
            routes.push({
              name: 'amp_' + result[urlKey].keyword,
              path: '/amp/' + result[urlKey].keyword,
              component: pageComponent.component,
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
        component: pageComponent.component
      })
      routes.push({
        name: 'amp_' + url.replace('/', '_').replace(':', '_'),
        path: '/amp' + url,
        component: pageComponent.component
      })
    }
  }

  const pages = _.ceil(routes.length / 500)

  for (var i = 0; i < pages; i++) {
    this.addPlugin({
      fileName: `vuefront/routes${i + 1}.js`,
      src: path.resolve(__dirname, './routes.js'),
      options: {
        routes: _.slice(routes, i * 500, i * 500 + 500),
        theme
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

  let themeOptions = readConfigFile('vuefront')

  const config = readConfigFile(this.options.rootDir + '/vuefront.config.js')

  if (typeof config.theme !== 'undefined') {
    const customThemeOptions = readConfigFile(config.theme)
    themeOptions = _.mergeWith(themeOptions, customThemeOptions, mergeConfig)
  }

  themeOptions = _.mergeWith(themeOptions, config, mergeConfig)

  this.addPlugin({
    fileName: 'vuefront.js',
    src: path.resolve(__dirname, './plugin.js'),
    options: {
      theme,
      debug: this.options.dev,
      browserBaseURL,
      baseURL,
      pages,
      themeOptions
    }
  })

  this.options.generate.routes = whiteList

  this.nuxt.hook('generate:extendRoutes', async routes => {
    const routesToGenerate = routes.filter(page =>
      whiteList.includes(page.route)
    )
    routes.splice(0, routes.length, ...routesToGenerate)
  })

  this.nuxt.hook('generate:page', page => {
    page.html = ampify(page.html, page.route)
  })

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

    const vuefrontRe = 'vuefront'
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
