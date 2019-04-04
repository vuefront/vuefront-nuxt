const path = require('path');

export default function vuefrontModule() {
    const config = require(this.options.rootDir + '/vuefront.config').default
    if (typeof config['plugins'] !== 'undefined') {
        for (const key in config['plugins']) {
            this.addPlugin({
                src: config.plugins[key]
            })
        }
    }
    this.addPlugin({
        src: path.resolve(__dirname, './plugin.js'),
        options: {
            vuefrontConfig: config,
            debug: this.options.dev
        }
    })
}
