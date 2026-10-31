import '@near-wallet-selector/modal-ui/styles.css'
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet'
import {
  WalletSelectorProvider,
  useWalletSelector,
} from '@near-wallet-selector/react-hook'

const config = {
  network: 'testnet' as const,
  modules: [setupMeteorWallet()],
}

function Inner() {
  const { signedAccountId, signIn, signOut } = useWalletSelector()
  return (
    <div>
      <h1>Wallet Security</h1>
      <p className="muted">
        Connects a NEAR wallet on TESTNET only. This app never asks for
        your seed phrase or private key.
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
          <button className="btn" onClick={() => signOut()}>Disconnect</button>
        ) : (
          <button className="btn" onClick={() => signIn()}>Connect wallet</button>
        )}
      </div>
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
