import setupRoutes from './setupRoutes'
import setupConfig from './setupConfig'
import setupBuild from './setupBuild'
import setupImages from './setupImages'
const path = require('path')
const _ = require('lodash')
const ampify = require('./plugins/ampify')
var fs = require('fs');

export default async function vuefrontModule(_moduleOptions) {
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

  const themeOptions = setupConfig(this.options.rootDir)

  if(!this.options.css) {
    this.options.css = []
  }
  if(themeOptions.css) {
    for (const key in themeOptions.css) {
      this.options.css.push(themeOptions.css[key])
    }
  }

  const images = setupImages(themeOptions)

  const {routes, whiteList} = await setupRoutes(baseURL, themeOptions)

  const pages = _.ceil(routes.length / 500)

  for (var i = 0; i < pages; i++) {
    this.addPlugin({
      fileName: `vuefront/routes${i + 1}.js`,
      src: path.resolve(__dirname, './routes.js'),
      options: {
        routes: _.slice(routes, i * 500, i * 500 + 500),
        theme,
        themeOptions
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
      images,
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

  this.nuxt.hook('build:before', () => {
    setupBuild.call(this, moduleOptions);
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
  })
}
