import { useState } from 'react'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { actionCreators } from '@near-js/transactions'
import { KeyPair, PublicKey } from '@near-js/crypto'

// 0.25 NEAR gas allowance, in yoctoNEAR
const ALLOWANCE = BigInt('250000000000000000000000')

export function AgentKeyCard() {
  const { signedAccountId, signAndSendTransactions } = useWalletSelector()
  const [receiver, setReceiver] = useState('guest-book.testnet')
  const [methods, setMethods] = useState('add_message')
  const [keys, setKeys] = useState<string[]>([])
  const [revokeText, setRevokeText] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  if (!signedAccountId) {
    return <p>Connect a testnet wallet to create an agent key.</p>
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
      setKeys((k) => [...k, publicKey.toString()])
      setMsg(
        'Wallet request sent. Refresh the access key list above to see the new function-call key. The private half was discarded, so this demo key cannot sign anything.',
      )
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
            actions: [actionCreators.deleteKey(PublicKey.from(keyText.trim()))],
          },
        ],
      })
      setKeys((k) => k.filter((x) => x !== keyText))
      setMsg('Revoke request sent. Refresh the access key list above to confirm it is gone.')
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
        limit. This app never creates a full-access key.
      </p>
      <label>
        Contract
        <input value={receiver} onChange={(e) => setReceiver(e.target.value)} />
      </label>
      <label>
        Methods (comma separated)
        <input value={methods} onChange={(e) => setMethods(e.target.value)} />
      </label>
      <button disabled={busy} onClick={create}>
        Create agent key
      </button>
      {keys.map((k) => (
        <div key={k} style={{ marginTop: 8, wordBreak: 'break-all' }}>
          <code>{k}</code>{' '}
          <button disabled={busy} onClick={() => revoke(k)}>
            Revoke
          </button>
        </div>
      ))}
      <label>
        Revoke by public key (ed25519:...)
        <input value={revokeText} onChange={(e) => setRevokeText(e.target.value)} />
      </label>
      <button disabled={busy || !revokeText.trim()} onClick={() => revoke(revokeText)}>
        Revoke this key
      </button>
      {msg && <p>{msg}</p>}
    </section>
  )
}
