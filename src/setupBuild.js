export default function setupBuild(options, themeOptions) {
  const VuefrontLoaderPlugin = this.nuxt.resolver.requireModule('vuefront-nuxt/src/webpack/plugin');
  this.options.build.transpile.push('vuefront/lib');
  this.extendBuild((config) => {
    config.plugins.push(new VuefrontLoaderPlugin({config:themeOptions}))
  });
}