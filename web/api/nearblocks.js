// Server-side NearBlocks API for NEAR account intelligence.
// API keys must never be exposed to the browser.

const NETWORKS = {
  mainnet: 'https://api.nearblocks.io',
  testnet: 'https://api-testnet.nearblocks.io',
}

async function fetchNearBlocks(base, path, apiKey) {
  const response = await fetch(`${base}${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(15000),
  })

  const text = await response.text()
  let data

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { message: 'Invalid JSON response from NearBlocks' }
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const account = String(req.query.account || '').trim().toLowerCase()
  const network = String(req.query.network || 'mainnet').toLowerCase()

  if (!/^[a-z0-9._-]{2,64}$/.test(account)) {
    return res.status(400).json({ error: 'Invalid NEAR account ID' })
  }

  if (!NETWORKS[network]) {
    return res.status(400).json({ error: 'Network must be mainnet or testnet' })
  }

  const apiKey =
    process.env.Nearblock_Api_Key ||
    process.env.NEARBLOCKS_API_KEY ||
    process.env.NEARBLOCK_API_KEY

  if (!apiKey) {
    return res.status(500).json({
      error: 'NearBlocks API key is not configured on the server',
    })
  }

  const base = NETWORKS[network]
  const encodedAccount = encodeURIComponent(account)

  try {
    const [transactions, contract, deployments] = await Promise.all([
      fetchNearBlocks(
        base,
        `/v3/accounts/${encodedAccount}/txns?limit=10`,
        apiKey,
      ),
      fetchNearBlocks(
        base,
        `/v3/accounts/${encodedAccount}/contract`,
        apiKey,
      ),
      fetchNearBlocks(
        base,
        `/v3/accounts/${encodedAccount}/contract/deployments`,
        apiKey,
      ),
    ])

    return res.status(200).json({
      account,
      network,
      source: 'NearBlocks',
      transactions,
      contract,
      deployments,
      poweredBy: 'Nearblocks.io',
    })
  } catch {
    return res.status(502).json({
      error: 'Unable to reach NearBlocks API',
    })
  }
}
