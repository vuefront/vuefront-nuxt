const _ = require('lodash')
const getImport = (name) => {
  let comImport = false


  switch (type) {
    case 'A': 
    if(!config.atoms[name]) {
      return
    }
    if (config.atoms[name].type === 'full') {
      comImport = `const ${tag} = () => import('${config.atoms[name].path}');`
    } else {
      comImport = `const ${tag} = () => import('${config.atoms[name].path}').then(m => m.${config.atoms[name].component});`
    }
    break;
    case 'M': 
    if(!config.molecules[name]) {
      return
    }
    if (config.molecules[name].type === 'full') {
      comImport = `const ${tag} = () => import('${config.molecules[name].path}');`
    } else {
      comImport = `const ${tag} = () => import('${config.molecules[name].path}').then(m => m.${config.molecules[name].component});`
    }
    break;
    case 'O': 
    if(!config.organisms[name]) {
      return
    }
    if (config.organisms[name].type === 'full') {
      comImport = `const ${tag} = () => import('${config.organisms[name].path}');`
    } else {
      comImport = `const ${tag} = () => import('${config.organisms[name].path}').then(m => m.${config.organisms[name].component});`
    }
    break;
    case 'T': 
    if(!config.templates[name]) {
      return
    }
    if (config.templates[name].type === 'full') {
      comImport = `const ${tag} = () => import('${config.templates[name].path}');`
    } else {
      comImport = `const ${tag} = () => import('${config.templates[name].path}').then(m => m.${config.templates[name].component});`
    }
    break;
    case 'L': 
    if(!config.loaders[name]) {
      return
    }
    if (config.loaders[name].type === 'full') {
      comImport = `const ${tag} = () => import('${config.loaders[name].path}');`
    } else {
      comImport = `const ${tag} = () => import('${config.loaders[name].path}').then(m => m.${config.loaders[name].component});`
    }
    break;
    case 'E': 
    if(!config.extensions[name]) {
      return
    }
    if (config.extensions[name].type === 'full') {
      comImport = `const ${tag} = () => import('${config.extensions[name].path}');`
    } else {
      comImport = `const ${tag} = () => import('${config.extensions[name].path}').then(m => m.${config.extensions[name].component});`
    }
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

  let comImport = getImport(name)

  if(type === 'O' && name === 'virtual') {
    comImport = ''
  }
  

  return [tag, comImport]
}
