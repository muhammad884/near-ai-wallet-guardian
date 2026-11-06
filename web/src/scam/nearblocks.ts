export type NearBlocksNetwork = 'mainnet' | 'testnet'

export type NearBlocksEndpoint = {
  ok: boolean
  status: number
  data: unknown
}

export type NearBlocksAccountData = {
  account: string
  network: NearBlocksNetwork
  source: string
  transactions: NearBlocksEndpoint
  contract: NearBlocksEndpoint
  deployments: NearBlocksEndpoint
  poweredBy: string
}

export async function getNearBlocksAccount(
  account: string,
  network: NearBlocksNetwork,
): Promise<NearBlocksAccountData> {
  const params = new URLSearchParams({ account, network })

  const response = await fetch(`/api/nearblocks?${params.toString()}`)
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'NearBlocks request failed')
  }

  return result as NearBlocksAccountData
}
