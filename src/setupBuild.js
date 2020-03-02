export default function setupBuild(options) {
  // const VuefrontLoaderPlugin = require('./webpack/plugin.js')
  const VuefrontLoaderPlugin = this.nuxt.resolver.requireModule('vuefront-nuxt/src/webpack/plugin');
  this.options.build.transpile.push('vuefront/lib');
  this.extendBuild((config) => {
    config.plugins.push(new VuefrontLoaderPlugin({rootDir: this.options.rootDir}))
  });
}