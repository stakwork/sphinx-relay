import * as fs from 'fs'
import * as http from 'http'
import * as https from 'https'
import * as path from 'path'

interface TestNode {
  alias?: string
  external_ip?: string
  authToken?: string
}

const nodesPath = path.join(process.cwd(), 'src/tests/configs/nodes.json')
const timeoutMs = Number(process.env.SPHINX_TEST_ENV_TIMEOUT_MS || 5000)

function readNodes(): TestNode[] {
  if (!fs.existsSync(nodesPath)) {
    throw new Error(
      `Missing ${nodesPath}. Start the sphinx-stack test environment and copy relay/NODES.json into src/tests/configs/nodes.json before running integration tests.`
    )
  }

  const nodes = JSON.parse(fs.readFileSync(nodesPath, 'utf8'))
  if (!Array.isArray(nodes) || nodes.length === 0) {
    throw new Error(`${nodesPath} must contain at least one relay node config.`)
  }

  return nodes
}

function checkNode(node: TestNode): Promise<void> {
  if (!node.external_ip) {
    return Promise.reject(new Error('missing external_ip'))
  }

  const url = new URL('/contacts', node.external_ip)
  const client = url.protocol === 'https:' ? https : http

  return new Promise((resolve, reject) => {
    const req = client.request(
      url,
      {
        method: 'GET',
        headers: {
          'x-user-token': node.authToken || '',
        },
        timeout: timeoutMs,
      },
      (res) => {
        res.resume()
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve()
          } else {
            reject(new Error(`HTTP ${res.statusCode}`))
          }
        })
      }
    )

    req.on('timeout', () => {
      req.destroy(new Error(`timed out after ${timeoutMs}ms`))
    })
    req.on('error', reject)
    req.end()
  })
}

function formatError(error: unknown): string {
  if (error && typeof error === 'object') {
    const err = error as {
      address?: string
      code?: string
      message?: string
      port?: number
    }
    const details = [err.code, err.message, err.address, err.port]
      .filter((detail) => detail !== undefined && detail !== '')
      .join(' ')

    if (details) return details
  }

  return error instanceof Error ? error.message : String(error)
}

async function main() {
  const nodes = readNodes()
  const failures: string[] = []

  await Promise.all(
    nodes.map(async (node, index) => {
      const label = node.alias || `node ${index + 1}`
      try {
        await checkNode(node)
      } catch (error) {
        const message = formatError(error)
        failures.push(
          `${label} (${node.external_ip || 'missing external_ip'}): ${message}`
        )
      }
    })
  )

  if (failures.length > 0) {
    throw new Error(
      [
        'Sphinx integration test environment is not ready.',
        ...failures.map((failure) => `- ${failure}`),
        'Start sphinx-stack/relay test services or refresh src/tests/configs/nodes.json, then rerun npm test.',
      ].join('\n')
    )
  }

  console.log(
    `Sphinx integration test environment ready: ${nodes.length} relay node(s) responded within ${timeoutMs}ms.`
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
