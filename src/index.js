const path = require('path')
let themeOptions = require('vuefront').default
const _ = require('lodash')
import Vue from 'vue'

const mergeConfig = (objValue, srcValue) => {
    if (_.isArray(objValue)) {
        return objValue.concat(srcValue)
    } else if (_.isObject(objValue)) {
        return _.merge(objValue, srcValue)
    } else {
        return srcValue
    }
}

export default function vuefrontModule() {
    const config = require(this.options.rootDir + '/vuefront.config').default
    if (typeof config.theme !== 'undefined') {
        const customThemeOptions = require(config.theme).default
        themeOptions = _.mergeWith(
            themeOptions,
            customThemeOptions,
            mergeConfig
        )
    }
    themeOptions = _.mergeWith(themeOptions, config, mergeConfig)
    this.addPlugin({
        src: path.resolve(__dirname, './plugin.js'),
        options: {
            vuefrontConfig: themeOptions,
            debug: this.options.dev
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
}
