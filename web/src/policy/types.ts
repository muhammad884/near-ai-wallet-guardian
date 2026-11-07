export type Decision = 'APPROVED' | 'REQUIRES_APPROVAL' | 'BLOCKED'

export type Policy = {
  maxPerTx: number
  maxDaily: number
  maxPerAgentDaily: number
  approvalAbove: number
  maxPerTxExact?: string
  maxDailyExact?: string
  maxPerAgentDailyExact?: string
  approvalAboveExact?: string
  allowedContracts: string[]
  allowedMethods: string[]
  restrictedMethods: string[]
}

export type TxRequest = {
  agentId: string
  receiver: string
  amount: number
  amountText?: string
  method?: string
}

export type Usage = {
  totalToday: number
  agentToday: number
  totalTodayExact?: string
  agentTodayExact?: string
}

export type Result = {
  decision: Decision
  reasons: string[]
}
