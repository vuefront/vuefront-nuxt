const path = require('path');
export default function storefrontModule() {
  const config = require(this.options.rootDir + '/storefront.config').default;
  this.addPlugin({
    src: path.resolve(__dirname, './plugin.js'),
    options: {
      storefrontConfig: config,
      debug: this.options.dev
    }
  })
}
