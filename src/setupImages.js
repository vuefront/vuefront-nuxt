const _ = require('lodash')
export default (config) => {
  let result = {}

  for (const key in config.image) {
    const image = config.image[key]
    result[key] = {}
    if(_.isString(image)) {
      result[key].image = `require('${image}')`
    } else if (_.isObject(image)) {
      if(image.path) {
        result[key].image = `require('${image.path}')`
      }
      if(image.width && image.height) {
        result[key].width = image.width
        result[key].height = image.height
      }
    }
  }

  return result
}