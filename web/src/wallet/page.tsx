import './polyfill'
import '@near-wallet-selector/modal-ui/styles.css'
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet'
import {
  WalletSelectorProvider,
  useWalletSelector,
} from '@near-wallet-selector/react-hook'
import { KeyAuditCard } from './audit'
import { SendCard } from '../send/card'
import { useEffect, useRef } from 'react'
import { setWalletAccount } from './state'

const config = {
  network: 'testnet' as const,
  modules: [setupMeteorWallet()],
}

function Inner() {
  const { signedAccountId, signIn, signOut, walletSelector } = useWalletSelector()
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
        void connectMeteor()
      } catch {
        // the Connect wallet button below still works
      }
    }, 1200)
    return () => clearTimeout(timer)
  }, [signIn])
  async function connectMeteor() {
    try {
      const selector = await walletSelector
      if (!selector) return signIn()
      const wallet = await selector.wallet('meteor-wallet')
      await wallet.signIn({} as never)
    } catch (err) {
      console.error('Meteor sign-in failed', err)
    }
  }
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
          <button className="btn" onClick={connectMeteor}>Connect Meteor Wallet</button>
        )}
      </div>
      {signedAccountId && <KeyAuditCard account={signedAccountId} />}
      {signedAccountId && <SendCard account={signedAccountId} />}
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
