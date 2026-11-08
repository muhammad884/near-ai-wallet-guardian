import { useCallback, useEffect, useState } from 'react'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { actionCreators } from '@near-js/transactions'
import { KeyPair, PublicKey } from '@near-js/crypto'

const RPC = 'https://rpc.testnet.near.org'
// 0.25 NEAR gas allowance, in yoctoNEAR
const ALLOWANCE = BigInt('250000000000000000000000')

type FcKey = { publicKey: string; receiver: string; methods: string[] }

async function listFunctionCallKeys(accountId: string): Promise<FcKey[]> {
  const res = await fetch(RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'keys',
      method: 'query',
      params: {
        request_type: 'view_access_key_list',
        finality: 'final',
        account_id: accountId,
      },
    }),
  })
  const json = await res.json()
  const keys = json?.result?.keys
  if (!Array.isArray(keys)) throw new Error('Could not read keys from the RPC')
  const out: FcKey[] = []
  for (const k of keys) {
    const fc = k?.access_key?.permission?.FunctionCall
    if (fc) {
      out.push({
        publicKey: k.public_key,
        receiver: fc.receiver_id,
        methods: fc.method_names ?? [],
      })
    }
  }
  return out
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
  const [receiver, setReceiver] = useState('guest-book.testnet')
  const [methods, setMethods] = useState('add_message')
  const [keys, setKeys] = useState<FcKey[]>([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    if (!signedAccountId) return
    try {
      setKeys(await listFunctionCallKeys(signedAccountId))
    } catch (e) {
      setMsg('Could not load keys: ' + (e instanceof Error ? e.message : String(e)))
    }
  }, [signedAccountId])

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

  const settle = async () => {
    await new Promise((r) => setTimeout(r, 2500))
    await refresh()
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
    try {
      // The private half is created here and thrown away. Only the public key is used.
      const publicKey = KeyPair.fromRandom('ed25519').getPublicKey()
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
      setMsg('Done. The new function-call key is listed below. Its private half was discarded, so this demo key cannot sign anything.')
      await settle()
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
      setMsg('Revoked. The key is removed from the list below.')
      await settle()
    } catch (e) {
      setMsg('Not done: ' + (e instanceof Error ? e.message : String(e)))
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
          <button style={btn} disabled={busy} onClick={() => revoke(k.publicKey)}>
            Revoke this key
          </button>
        </div>
      ))}
      {msg && <p>{msg}</p>}
    </section>
  )
}
