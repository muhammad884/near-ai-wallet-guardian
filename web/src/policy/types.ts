export type Decision = 'APPROVED' | 'REQUIRES_APPROVAL' | 'BLOCKED'

export type Policy = {
  maxPerTx: number
  maxDaily: number
  maxPerAgentDaily: number
  approvalAbove: number
  allowedContracts: string[]
  allowedMethods: string[]
  restrictedMethods: string[]
}

export type TxRequest = {
  agentId: string
  receiver: string
  amount: number
  method?: string
}

export type Usage = {
  totalToday: number
  agentToday: number
}

export type Result = {
  decision: Decision
  reasons: string[]
}
