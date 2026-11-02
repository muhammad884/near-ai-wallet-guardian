import './polyfill'
import '@near-wallet-selector/modal-ui/styles.css'
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet'
import {
  WalletSelectorProvider,
  useWalletSelector,
} from '@near-wallet-selector/react-hook'
import { KeyAuditCard } from './audit'
import { useEffect, useRef } from 'react'
import { setWalletAccount } from './state'

const config = {
  network: 'testnet' as const,
  modules: [setupMeteorWallet()],
}

function Inner() {
  const { signedAccountId, signIn, signOut } = useWalletSelector()
  useEffect(() => {
    if (signedAccountId) setWalletAccount(signedAccountId)
  }, [signedAccountId])

  const accountRef = useRef(signedAccountId)
  accountRef.current = signedAccountId
  useEffect(() => {
    if (window.location.hash !== '#connect') return
    const timer = setTimeout(() => {
      window.history.replaceState(null, '', '/wallet')
      if (accountRef.current) return
      try {
        Promise.resolve(signIn()).catch(() => undefined)
      } catch {
        // the Connect wallet button below still works
      }
    }, 1200)
    return () => clearTimeout(timer)
  }, [signIn])
  return (
    <div>
      <h1>Wallet Security</h1>
      <p className="muted">
        Connects a NEAR wallet on TESTNET only. This app never asks for
        your seed phrase or private key. If the wallet list is hidden on
        your phone, switch the browser to Desktop site.
      </p>
      <div className="card" style={{ marginTop: 16 }}>
        <span className="tag-demo">TESTNET</span>
        <div className="row">
          <span>Status</span>
          <strong className={signedAccountId ? 'ok' : 'mid'}>
            {signedAccountId ? 'Connected' : 'Not connected'}
          </strong>
        </div>
        <div className="row">
          <span>Account</span>
          <strong>{signedAccountId ?? 'none'}</strong>
        </div>
        {signedAccountId ? (
          <button className="btn" onClick={() => {
            signOut()
            setWalletAccount(null)
          }}>Disconnect</button>
        ) : (
          <button className="btn" onClick={() => signIn()}>Connect wallet</button>
        )}
      </div>
      {signedAccountId && <KeyAuditCard account={signedAccountId} />}
    </div>
  )
}

export default function WalletPage() {
  return (
    <WalletSelectorProvider config={config}>
      <Inner />
    </WalletSelectorProvider>
  )
}
