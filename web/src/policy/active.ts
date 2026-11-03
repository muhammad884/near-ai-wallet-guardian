import type { Policy } from './types'

export const defaultPolicy: Policy = {
  maxPerTx: 10,
  maxDaily: 50,
  maxPerAgentDaily: 20,
  approvalAbove: 5,
  allowedContracts: ['wrap.near'],
  allowedMethods: ['ft_transfer'],
  restrictedMethods: ['add_key', 'add_full_access_key', 'delete_key', 'delete_account'],
}

let active: Policy = defaultPolicy

export function setActivePolicy(p: Policy) {
  active = p
}

export function getActivePolicy(): Policy {
  return active
}
