import Vue from 'vue'
import VueI18n from 'vue-i18n'

import isUndefined from 'lodash/isUndefined'
import isEmpty from 'lodash/isEmpty'
import set from 'lodash/set'
import merge from 'lodash/merge'

Vue.use(VueI18n)

const baseURL = process.browser
? '<%= options.browserBaseURL %>'
: '<%= options.baseURL %>'

function loadLocaleMessages(options) {
  const locales = require.context(`~/locales`, true, /\.json$/)
  const messages = {}

  <% for (var key in options.themeOptions.locales) { %>
    if(isUndefined(messages['<%= key %>'])) {
      messages['<%= key %>'] = {}
    }

    <% for (var key2 in options.themeOptions.locales[key]) { %>
      <% if (options.themeOptions.locales[key][key2].type === 'full') { %>
    messages['<%= key %>'] = merge({}, messages['<%= key %>'], require('<%= options.themeOptions.locales[key][key2].path %>'))
    <% } else { %>
    messages['<%= key %>'] = merge({}, messages['<%= key %>'], require('<%= options.themeOptions.locales[key][key2].path %>')['<%= options.themeOptions.locales[key][key2].component %>'])
      <% } %>
    <% } %>
      
  <% } %>

  locales.keys().forEach(key => {
    const local = /^.\/([a-zA-Z-]+)\//.exec(key)[1]
    if(isUndefined(messages[local])) {
      messages[local] = {}
    }

    let path = /^.\/[a-zA-Z-]+\/(.*).json/.exec(key)[1]
    const value = set({}, path.split('/'), locales(key))
    messages[local] = merge({}, messages[local], value)
  })

  return messages
}

export default async (ctx, inject) => {

  inject('vfapollo', ctx.app.apolloProvider.clients.vuefront)

  const opts = {}

  if(process.client) {
    if(isUndefined(window.__NUXT__)) {
      opts.preserveState = false
    } else if(!isUndefined(window.__NUXT__) && isUndefined(window.__NUXT__.serverRendered)) {
      opts.preserveState = false
    }
  }
  
  <% for (var key in options.themeOptions.store) { %>
  <% if (typeof options.themeOptions.store[key].module !== 'undefined') {%>
  <% if (options.themeOptions.store[key].module.type === 'full') { %>
  ctx.store.registerModule(<%= JSON.stringify(options.themeOptions.store[key].path) %>, {namespaced: true, ...require('<%= options.themeOptions.store[key].module.path %>')}, opts)
  <% } else { %>
  ctx.store.registerModule(<%= JSON.stringify(options.themeOptions.store[key].path) %>, {namespaced: true, ...require('<%= options.themeOptions.store[key].module.path %>')['<%= options.themeOptions.store[key].module.component %>']}, opts)
  <% } %>
  <% } else { %>
    ctx.store.registerModule(<%= JSON.stringify(options.themeOptions.store[key].path) %>, {namespaced: true}, opts)
  <% } %>
  <% } %>

  const extensions = {}

  <% for (var key in options.themeOptions.extensions) { %>
  <% if (options.themeOptions.extensions[key].type === 'full') { %>
  extensions.<%= key %> = () => { 
    return import('<%= options.themeOptions.extensions[key].path %>')
  };<% } else { %>
  extensions.<%= key %> = () => {
    return import('<%= options.themeOptions.extensions[key].path %>').then(m => m.<%= options.themeOptions.extensions[key].component %>)
}<% } %><% } %>

  const images = {}

  <% for (var key in options.images) { %>

  images.<%= key %> = {}<% if (typeof options.images[key].image !== 'undefined') { %>
  images.<%= key %>.image = <%= options.images[key].image  %>;
  <% } %><% if (typeof options.images[key].width !== 'undefined') { %>
  images.<%= key %>.width = <%= options.images[key].width  %>;
  images.<%= key %>.height = <%= options.images[key].height  %>;<% } %><% } %>

  inject('vuefront', {
    layouts: <%= JSON.stringify(options.themeOptions.layouts) %>,
    extensions,
    images,
    options: <%= JSON.stringify(options.themeOptions.options) %>,
    baseURL,
    get isAuth() {
      return ctx.store.getters['common/customer/auth']
    },
    async logout() {
      await ctx.store.dispatch('common/customer/logout')
      
      ctx.app.router.push("/account/login");
    },
    get isClient() {
      return process.client
    },
    get params() {
      let result = ctx.route.params
      if(!isEmpty(ctx.route.matched)) {
        result = {...result, ...ctx.route.matched[0].props.default}
      }

      return result
    },
    get isMobile() {

      var isMobile = false;
      if (process.client) {
        isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;
      } else if(!isUndefined(ctx.req) && !isUndefined(ctx.req.headers)) {
        if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(ctx.req.headers['user-agent']) 
          || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ctx.req.headers['user-agent'].substr(0,4))) { 
          isMobile = true;
        }
      }
      return isMobile
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
    messages: loadLocaleMessages()
  })

}
