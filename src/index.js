const path = require('path');
export default function vuefrontModule() {
  const config = require(this.options.rootDir + '/vuefront.config').default;
  this.addPlugin({
    src: path.resolve(__dirname, './plugin.js'),
    options: {
      vuefrontConfig: config,
      debug: this.options.dev
    }
  })
}
