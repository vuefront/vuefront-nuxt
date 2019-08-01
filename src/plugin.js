import Vue from 'vue'
import VueI18n from 'vue-i18n'
import ApolloClient from "apollo-boost";
import _ from 'lodash'
import 'isomorphic-fetch'
import mainConfig from 'vuefront'
import userConfig from '~/vuefront.config'
<% if (options.theme !== 'default' ) { %>
import themeConfig from '<%= options.theme %>'
<% } %>

const mergeConfig = (objValue, srcValue) => {
  if (_.isArray(objValue)) {
    return objValue.concat(srcValue)
  } else if (_.isObject(objValue)) {
    return _.merge(objValue, srcValue)
  } else {
    return srcValue
  }
}

let themeOptions = mainConfig

if (typeof themeConfig !== 'undefined') {
  themeOptions = _.mergeWith(themeOptions, themeConfig, mergeConfig)
}
themeOptions = _.mergeWith(themeOptions, userConfig, mergeConfig)

for (var key in themeOptions.css) {
    themeOptions.css[key]()
}

Vue.use(VueI18n)

const baseURL = process.browser
? '<%= options.browserBaseURL %>'
: '<%= options.baseURL %>'

export const init = (ctx, inject) => {
  const client = new ApolloClient({
      uri: baseURL,
      headers: {
        accept: 'application/json; charset=UTF-8',
        'content-type': 'application/json; charset=UTF-8'
      },
      request: (operation) => {
        operation.setContext({
          fetchOptions: {
            credentials: 'include'
          }
        });
        operation.setContext({
          headers: {
            'Cookie': _.map(ctx.app.$cookies.getAll(), (value, index) => (index + '=' + value)).join(';')
          }
        });
      }
    });
    
  inject('vfapollo', client)
}

function loadLocaleMessages(options) {
  const locales = require.context(`~/locales`, true, /\.json$/)
  const messages = {}

  for (var key in options.locales) {
    if(_.isUndefined(messages[key])) {
      messages[key] = {}
    }
    for (var key2 in options.locales[key]) {
      messages[key] = _.merge({}, messages[key], options.locales[key][key2])
    }
  }
  locales.keys().forEach(key => {
    const local = /^.\/([a-zA-Z-]+)\//.exec(key)[1]
    if(_.isUndefined(messages[local])) {
      messages[local] = {}
    }

    let path = /^.\/[a-zA-Z-]+\/(.*).json/.exec(key)[1]
    const value = _.set({}, path.split('/'), locales(key))
    messages[local] = _.merge({}, messages[local], value)
  })

  return messages
}

export default async (ctx, inject) => {

  init(ctx, inject)

  const components = {
      element: {},
      template: {},
      position: {},
      module: {}
  }

  const opts = {}

  if(process.client) {
    if(_.isUndefined(window.__NUXT__)) {
      opts.preserveState = false
    }
  }

    for (var key in themeOptions.store) {
     if (typeof themeOptions.store[key].module !== 'undefined') {
      ctx.store.registerModule(themeOptions.store[key].path, {namespaced: true, ...themeOptions.store[key].module}, opts)
      } else {
      ctx.store.registerModule(themeOptions.store[key].path, {namespaced: true}, opts)
      } 
    }

  for (var key in themeOptions.atoms) {
    components[`vfA${key}`] = Vue.component(`vfA${key}`, themeOptions.atoms[key])
  }

  for (var key in themeOptions.molecules) {
    components[`vfM${key}`] = Vue.component(`vfM${key}`, themeOptions.molecules[key])
  }

  for (var key in themeOptions.organisms) {
    components[`vfO${key}`] = Vue.component(`vfO${key}`, themeOptions.organisms[key])
  }

  for (var key in themeOptions.templates) {
    components[`vfT${key}`] = Vue.component(`vfT${key}`, themeOptions.templates[key])
  }
  for (var key in themeOptions.components) {
    components[`vf${key}`] = Vue.component(`vf${key}`, themeOptions.components[key])
  }
  for (var key in themeOptions.extensions) {
    components[`vfE${key}`] = Vue.component(`vfE${key}`, themeOptions.extensions[key])
  }
  for (var key in themeOptions.loaders) {
    components[`vfL${key}`] = Vue.component(`vfL${key}`, themeOptions.loaders[key])
  }

  inject('vuefront', {
    options: themeOptions,
    components,
    baseURL,
    get isAuth() {
      return ctx.store.getters['common/customer/auth']
    },
    logout() {
      ctx.store.dispatch('common/customer/logout')
      ctx.router.push("/account/login");
    },
    get isClient() {
      return process.client
    },
    get params() {
      let result = ctx.route.params
      if(!_.isEmpty(ctx.route.matched)) {
        result = {...result, ...ctx.route.matched[0].props.default}
      }

      return result
    },
    get isAMP() {
      return /^\/amp([\/].*)?$/gi.test(ctx.route.fullPath)
    }
  })

  if(process.server) {
    await ctx.store.dispatch('vuefront/nuxtServerInit', ctx)
  } else if(process.browser) {
    await ctx.store.dispatch('vuefront/nuxtClientInit', ctx)
  }

  ctx.app.i18n = new VueI18n({
    locale: ctx.store.getters['common/language/locale'],
    messages: loadLocaleMessages(themeOptions)
  })

}
