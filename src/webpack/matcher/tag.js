const _ = require('lodash')
const renderImport = (component, tag) => {
  let result = ''

  if (component.type === 'full') {
    result = `() =>  import('${component.path}')`
  } else {
    result = `() => import('${component.path}').then(m => (m.${component.component}))`
  }

  return result
}
const renderImportCss = (component, tag) => {
  let result = ''

  if (component.css) {
    result += `import "${component.css}"`
  }

  return result
}
const getImport = (name, type, config, tag, renderImport) => {
  let comImport = false

  switch (type) {
    case 'A':
    if(!config.atoms[name]) {
      return
    }
    comImport = renderImport(config.atoms[name], tag)
    break;
    case 'M':
    if(!config.molecules[name]) {
      return
    }
    comImport = renderImport(config.molecules[name], tag)
    break;
    case 'O':
    if(!config.organisms[name]) {
      return
    }
    comImport = renderImport(config.organisms[name], tag)
    break;
    case 'T':
    if(!config.templates[name]) {
      return
    }
    comImport = renderImport(config.templates[name], tag)
    break;
    case 'L':
    if(!config.loaders[name]) {
      return
    }
    comImport = renderImport(config.loaders[name], tag)
    break;
    case 'E':
    if(!config.extensions[name]) {
      return
    }
    comImport = renderImport(config.extensions[name], tag)
    break;
  }
  return comImport
}
module.exports = function match (_, config, { kebabTag, camelTag: tag }) {
  if (!kebabTag.startsWith('vf-')) return

  const regex = /^Vf(.)(.*)$/gm

  const m = regex.exec(tag)

  const type = m[1]
  const name = m[2]

  let comImport = getImport(name, type, config, tag, renderImport)
  let comImportCss = getImport(name, type, config, tag, renderImportCss)
  return [tag, comImport, comImportCss]
}
