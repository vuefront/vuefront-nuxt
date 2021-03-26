import setupRoutes from './setupRoutes'
import setupConfig from './setupConfig'
import setupBuild from './setupBuild'
import setupImages from './setupImages'
const glob = require('glob-all')
const path = require('path')
const ceil = require('lodash/ceil')
const slice = require('lodash/slice')
const replace = require('lodash/replace')
const isNull = require('lodash/isNull')
const isEmpty = require('lodash/isEmpty')
const ampify = require('./plugins/ampify')

module.exports = async function (_moduleOptions) {
  if (!this.options.apollo) {
    this.options.apollo = {}
  }
  if (!this.options.apollo.clientConfigs) {
    this.options.apollo.clientConfigs = {}
  }

  if (!this.options.tailwindcss) {
    this.options.tailwindcss = {}
  }

  const resolver = (this.nuxt.resolver || this.nuxt)

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

  this.options.tailwindcss.config = {
    purge: {
      content: [
        "./components/**/*.{vue,js}",
        "./layouts/**/*.vue",
        "./pages/**/*.vue",
        "./plugins/**/*.{js,ts}",
        "./nuxt.config.{js,ts}",
        "./node_modules/vuefront/**/*.{js,vue}"
      ],
      options: {}
    }
  }

  if(!this.options.css) {
    this.options.css = []
  }
  if(themeOptions.css) {
    for (const key in themeOptions.css) {
      this.options.css.push(themeOptions.css[key])

    }
  }

  const items = ['atoms', 'molecules', 'organisms', 'templates', 'extensions']

  for (const item of items) {
    for (var key in themeOptions[item]) { 
      if (themeOptions[item][key].css) {
        this.options.css.push(themeOptions[item][key].css)
      }
    } 
  }

  const filesToWatch = [
    'vuefront.config.js'
  ]

  this.options.watch.push(
    ...filesToWatch.map(file => path.resolve(this.options.rootDir, file))
  )

  const images = setupImages(themeOptions)

  let {routes, whiteList, exclude} = await setupRoutes(themeOptions)

  const pages = ceil(routes.length / 500)

  for (var i = 0; i < pages; i++) {
    this.addPlugin({
      fileName: `vuefront/routes${i + 1}.js`,
      src: path.resolve(__dirname, './routes.js'),
      options: {
        routes: slice(routes, i * 500, i * 500 + 500),
        theme,
        themeOptions
      }
    })
  }

  this.addPlugin({
    src: path.resolve(__dirname, 'apollo-config.js'),
    fileName: 'vuefront-apollo-config.js',
    options: {
      baseURL,
      browserBaseURL
    }
  })

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

  for (const key in themeOptions.plugins) {
    const pluginPath = replace(themeOptions.plugins[key], /^(~)/, this.options.rootDir)

    this.addPlugin({
      fileName: `vuefront-${key}.js`,
      src: require.resolve(pluginPath),
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
  }

  this.options.apollo.clientConfigs.vuefront = './vuefront-apollo-config.js' /*{
    httpEndpoint: baseURL,
  }*/
  this.options.apollo.includeNodeModules = true

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

  this.addPlugin({
    fileName: 'vuefrontSeo.js',
    src: path.resolve(__dirname, './seo.js'),
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
  this.options.generate.exclude = exclude

  this.nuxt.hook('generate:routeCreated', async ({route, path, errors}) => {
    if(errors.length) {
      for (const key in errors) {
        const regex = /^Error:\s+([^.]+)/gm;
        const m = regex.exec(errors[key].error)
        if(!isNull(m) &&  m.length) {
          console.error(m[1])
        } else {
          console.error(errors[key].error)
        }
      }
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
  this.nuxt.hook('render:route', (url, page, { req, res }) => {
    page.html = ampify(page.html, url)
  })

  this.nuxt.hook('build:before', () => {
    setupBuild.call(this, moduleOptions, themeOptions);
  })

  const extendWithSassResourcesLoader = matchRegex => resources => (config) => {
    // Yes, using sass-resources-loader is **intended here**
    // Despite it's name it can be used for less as well!
    const sassResourcesLoader = {
      loader: 'sass-resources-loader', options: { resources }
    }

    // Gather all loaders that test against scss or sass files
    const matchedLoaders = config.module.rules.filter(({ test = '' }) => {
      return test.toString().match(matchRegex)
    })

    // push sass-resources-loader to each of them
    matchedLoaders.forEach((loader) => {
      loader.oneOf.forEach(rule => rule.use.push(sassResourcesLoader))
    })
  }

  const retrieveStyleArrays = styleResourcesEntries =>
  styleResourcesEntries.reduce((normalizedObject, [key, value]) => {
    const wrappedValue = Array.isArray(value) ? value : [value]
    normalizedObject[key] = wrappedValue.reduce((acc, path) => {
      const possibleModulePath = resolver.resolveModule(path)

      if (possibleModulePath) {
        // Path is mapped to module
        return acc.concat(possibleModulePath)
      }
      // Try to resolve alias, if not possible join with srcDir
      path = resolver.resolveAlias(path)
      // Try to glob (if it's a glob
      path = glob.sync(path)
      // Flatten this (glob could produce an array)
      return acc.concat(path)
    }, [])
    return normalizedObject
  }, {})

  if (themeOptions.cssImport && !isEmpty(themeOptions.cssImport)) {

    const styleResourcesEntries = Object.entries({scss: Object.values(themeOptions.cssImport)})

    const {scss} = retrieveStyleArrays(styleResourcesEntries)

    const extendScss = extendWithSassResourcesLoader(/scss/)
    this.extendBuild(extendScss(scss))
  }

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
  await this.addModule('cookie-universal-nuxt')
  await this.addModule('@nuxtjs/tailwindcss')
  await this.addModule('@nuxtjs/apollo')
}
