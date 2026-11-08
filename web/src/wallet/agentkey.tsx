import { useEffect, useState } from 'react'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import {
  actionCreators,
  createTransaction,
  encodeTransaction,
  Signature,
  SignedTransaction,
} from '@near-js/transactions'
import type { Action } from '@near-js/transactions'
import { KeyPair, PublicKey } from '@near-js/crypto'
import { baseDecode } from '@near-js/utils'

const RPC = 'https://rpc.testnet.near.org'
const ALLOWANCE = BigInt('250000000000000000000000') // 0.25 NEAR for gas
const GAS = BigInt('30000000000000')
const ONE_NEAR = BigInt('10000000000000000000000')
const ZERO = BigInt(0)

type FcKey = { publicKey: string; receiver: string; methods: string[] }

type RpcOut = {
  result?: {
    nonce?: number | string
    block_hash?: string
    status?: unknown
    transaction?: { hash?: string }
  }
  error?: { data?: unknown; cause?: unknown; message?: string }
}

async function rpc(method: string, params: unknown): Promise<RpcOut> {
  const res = await fetch(RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 'g', method, params }),
  })
  return (await res.json()) as RpcOut
}

async function listFunctionCallKeys(accountId: string): Promise<FcKey[]> {
  const json = (await rpc('query', {
    request_type: 'view_access_key_list',
    finality: 'final',
    account_id: accountId,
  })) as { result?: { keys?: Array<{ public_key: string; access_key?: { permission?: unknown } }> } }
  const keys = json?.result?.keys
  if (!Array.isArray(keys)) throw new Error('Could not read keys from the RPC')
  const out: FcKey[] = []
  for (const k of keys) {
    const perm = k?.access_key?.permission as
      | { FunctionCall?: { receiver_id: string; method_names?: string[] } }
      | string
      | undefined
    if (perm && typeof perm === 'object' && perm.FunctionCall) {
      out.push({
        publicKey: k.public_key,
        receiver: perm.FunctionCall.receiver_id,
        methods: perm.FunctionCall.method_names ?? [],
      })
    }
  }
  return out
}

function toBase64(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

// The agent signs with its own key. Nothing here uses the wallet.
async function agentSend(
  accountId: string,
  kp: KeyPair,
  receiverId: string,
  actions: Action[],
): Promise<string> {
  const pk = kp.getPublicKey()
  const ak = await rpc('query', {
    request_type: 'view_access_key',
    finality: 'final',
    account_id: accountId,
    public_key: pk.toString(),
  })
  if (!ak.result || ak.result.nonce === undefined || !ak.result.block_hash) {
    return 'The key is not on the account yet. Wait a few seconds and try again.'
  }
  const tx = createTransaction(
    accountId,
    pk,
    receiverId,
    BigInt(ak.result.nonce) + BigInt(1),
    actions,
    baseDecode(ak.result.block_hash),
  )
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(encodeTransaction(tx))))
  const sig = kp.sign(hash)
  const signed = new SignedTransaction({
    transaction: tx,
    signature: new Signature({ keyType: pk.keyType, data: sig.signature }),
  })
  const out = await rpc('send_tx', {
    signed_tx_base64: toBase64(encodeTransaction(signed)),
    wait_until: 'EXECUTED_OPTIMISTIC',
  })
  if (out.error) {
    const why = JSON.stringify(out.error.data ?? out.error.cause ?? out.error.message ?? out.error)
    return 'REJECTED BY NEAR before running: ' + why.slice(0, 400)
  }
  const st = out.result?.status as Record<string, unknown> | undefined
  const h = out.result?.transaction?.hash ?? ''
  if (st && 'Failure' in st) {
    return (
      'NEAR accepted this key for the call (the key is allowed to do it), but the contract returned an error: ' +
      JSON.stringify(st.Failure).slice(0, 300)
    )
  }
  return 'ACCEPTED by NEAR. Transaction ' + h
}

const field = { display: 'block', marginTop: 10 } as const
const input = { display: 'block', width: '100%', padding: 8, marginTop: 4 } as const
const btn = {
  width: '100%',
  padding: 10,
  marginTop: 12,
  border: 'none',
  borderRadius: 8,
  background: '#12a06e',
  color: '#fff',
  fontWeight: 600,
} as const

export function AgentKeyCard() {
  const { signedAccountId, signAndSendTransactions } = useWalletSelector()
  const [receiver, setReceiver] = useState('hello.near-examples.testnet')
  const [methods, setMethods] = useState('set_greeting')
  const [keys, setKeys] = useState<FcKey[]>([])
  const [agents, setAgents] = useState<Record<string, KeyPair>>({})
  const [msg, setMsg] = useState('')
  const [proof, setProof] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!signedAccountId) return
    let alive = true
    listFunctionCallKeys(signedAccountId)
      .then((k) => {
        if (alive) setKeys(k)
      })
      .catch((e) => {
        if (alive) setMsg('Could not load keys: ' + (e instanceof Error ? e.message : String(e)))
      })
    return () => {
      alive = false
    }
  }, [signedAccountId])

  if (!signedAccountId) {
    return <p>Connect a testnet wallet to create an agent key.</p>
  }

  const reload = async () => {
    await new Promise((r) => setTimeout(r, 2500))
    try {
      setKeys(await listFunctionCallKeys(signedAccountId))
    } catch (e) {
      setMsg('Could not load keys: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const create = async () => {
    const names = methods.split(',').map((m) => m.trim()).filter(Boolean)
    if (!receiver.trim() || names.length === 0) {
      setMsg(
        'Guardian refused: a contract and at least one method name are required. An empty method list would allow every method.',
      )
      return
    }
    setBusy(true)
    setMsg('')
    setProof('')
    try {
      // The private half stays in this tab's memory only. It is lost on refresh.
      const kp = KeyPair.fromRandom('ed25519')
      const publicKey = kp.getPublicKey()
      await signAndSendTransactions({
        transactions: [
          {
            signerId: signedAccountId,
            receiverId: signedAccountId,
            actions: [
              actionCreators.addKey(
                publicKey,
                actionCreators.functionCallAccessKey(receiver.trim(), names, ALLOWANCE),
              ),
            ],
          },
        ],
      })
      setAgents((a) => ({ ...a, [publicKey.toString()]: kp }))
      setMsg('Done. Use the two test buttons under the new key. Its private half lives in this tab only and is lost on refresh.')
      await reload()
    } catch (e) {
      setMsg('Not done: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setBusy(false)
    }
  }

  const revoke = async (keyText: string) => {
    setBusy(true)
    setMsg('')
    try {
      await signAndSendTransactions({
        transactions: [
          {
            signerId: signedAccountId,
            receiverId: signedAccountId,
            actions: [actionCreators.deleteKey(PublicKey.from(keyText))],
          },
        ],
      })
      setAgents((a) => {
        const n = { ...a }
        delete n[keyText]
        return n
      })
      setMsg('Revoked. The key is removed from the list below.')
      await reload()
    } catch (e) {
      setMsg('Not done: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setBusy(false)
    }
  }

  const testCall = async (k: FcKey) => {
    const kp = agents[k.publicKey]
    if (!kp) return
    setBusy(true)
    setProof('Agent is calling ' + k.receiver + '...')
    try {
      const method = k.methods[0] ?? 'set_greeting'
      const args = new TextEncoder().encode(JSON.stringify(method === 'add_message' ? { text: 'hello from the agent key' } : { greeting: 'Hello from the agent key' }))
      setProof(
        'Agent calls ' + method + ': ' +
          (await agentSend(signedAccountId, kp, k.receiver, [
            actionCreators.functionCall(method, args, GAS, ZERO),
          ])),
      )
    } catch (e) {
      setProof('Error: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setBusy(false)
    }
  }

  const testSend = async (k: FcKey) => {
    const kp = agents[k.publicKey]
    if (!kp) return
    setBusy(true)
    setProof('Agent is trying to send 0.01 NEAR...')
    try {
      setProof(
        'Agent tries to send 0.01 NEAR: ' +
          (await agentSend(signedAccountId, kp, 'friend.testnet', [
            actionCreators.transfer(ONE_NEAR),
          ])),
      )
    } catch (e) {
      setProof('Error: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section style={{ marginTop: 16 }}>
      <h3>Agent key (testnet)</h3>
      <p>
        Gives an agent a function-call key limited to one contract and named
        methods, with a 0.25 NEAR gas allowance. The NEAR protocol enforces this
        limit. This app never creates a full-access key and never offers to
        remove one.
      </p>
      <label style={field}>
        Contract
        <input style={input} value={receiver} onChange={(e) => setReceiver(e.target.value)} />
      </label>
      <label style={field}>
        Methods (comma separated)
        <input style={input} value={methods} onChange={(e) => setMethods(e.target.value)} />
      </label>
      <button style={btn} disabled={busy} onClick={create}>
        Create agent key
      </button>
      <h4 style={{ marginTop: 20 }}>Function-call keys on this account</h4>
      {keys.length === 0 && <p>None.</p>}
      {keys.map((k) => (
        <div key={k.publicKey} style={{ marginTop: 10, wordBreak: 'break-all' }}>
          <code>{k.publicKey}</code>
          <div>
            Can only call {k.receiver} ({k.methods.length ? k.methods.join(', ') : 'any method'})
          </div>
          {agents[k.publicKey] ? (
            <>
              <button style={{ ...btn, background: '#2a5db0' }} disabled={busy} onClick={() => testCall(k)}>
                Agent: call {k.methods[0] ?? 'set_greeting'}
              </button>
              <button style={{ ...btn, background: '#b3402f' }} disabled={busy} onClick={() => testSend(k)}>
                Agent: try to send 0.01 NEAR
              </button>
            </>
          ) : (
            <p>The private half is not in this tab, so this key cannot be tested here. Create a new key to test.</p>
          )}
          <button style={btn} disabled={busy} onClick={() => revoke(k.publicKey)}>
            Revoke this key
          </button>
        </div>
      ))}
      {proof && <p style={{ wordBreak: 'break-word' }}>{proof}</p>}
      {msg && <p>{msg}</p>}
    </section>
  )
}
