import { NodeConfig } from './types'

const name = 'evan'

var nodes = require(`./configs/${name}.json`)

const configs: NodeConfig[] = []

for (const n of nodes) {
  configs.push(n)
}

export default configs
