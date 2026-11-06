import type { AccountOutcome } from './account'

export function ChainPanel({ outcome }: { outcome: AccountOutcome | null }) {
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h2>On-chain check (NEAR testnet)</h2>
      {outcome === null && <div className="muted">Asking the NEAR testnet RPC...</div>}
      {outcome?.state === 'FOUND' && (
        <>
          <div className="row">
            <span>Account exists on testnet</span>
            <strong>YES</strong>
          </div>
          <div className="row">
            <span>Balance</span>
            <strong>{outcome.balanceNear} NEAR</strong>
          </div>
          <div className="row">
            <span>Has a smart contract deployed</span>
            <strong>{outcome.hasContract ? 'YES' : 'NO'}</strong>
          </div>
        </>
      )}
      {outcome?.state === 'NOT_FOUND' && (
        <div className="muted">
          No account with this name was found on testnet. It may exist on mainnet; this app reads
          testnet only.
        </div>
      )}
      {outcome?.state === 'UNAVAILABLE' && (
        <div className="muted">{outcome.message} Nothing was concluded about this account.</div>
      )}
      <div className="muted" style={{ marginTop: 10 }}>
        Source: NEAR testnet RPC (view_account). These are facts only. They do not change the rule
        score above and do not prove an account is safe.
      </div>
    </div>
  )
}


export function DualChainPanel({
  outcomes,
}: {
  outcomes: { mainnet: AccountOutcome; testnet: AccountOutcome } | null
}) {
  function showNetwork(name: string, outcome: AccountOutcome | null) {
    return (
      <div style={{ marginTop: 12 }}>
        <h3>{name}</h3>
        {!outcome && <div className="muted">Checking...</div>}
        {outcome?.state === 'FOUND' && (
          <>
            <div className="row"><span>Account exists</span><strong>YES</strong></div>
            <div className="row"><span>Balance</span><strong>{outcome.balanceNear} NEAR</strong></div>
            <div className="row"><span>Smart contract deployed</span><strong>{outcome.hasContract ? 'YES' : 'NO'}</strong></div>
            <div className="row"><span>Block height</span><strong>{outcome.blockHeight ?? 'Unavailable'}</strong></div>
          </>
        )}
        {outcome?.state === 'NOT_FOUND' && (
          <div className="muted">Account not found on this network.</div>
        )}
        {outcome?.state === 'INVALID' && (
          <div className="muted">{outcome.message}</div>
        )}
        {outcome?.state === 'UNAVAILABLE' && (
          <div className="muted">RPC unavailable: {outcome.message}. No conclusion can be made.</div>
        )}
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h2>NEAR blockchain checks</h2>
      {!outcomes && <div className="muted">Checking Mainnet and Testnet...</div>}
      {showNetwork('NEAR Mainnet', outcomes?.mainnet ?? null)}
      {showNetwork('NEAR Testnet', outcomes?.testnet ?? null)}
      <div className="muted" style={{ marginTop: 12 }}>
        Source: NEAR RPC view_account. These checks confirm account data only.
        They do not prove that an account is safe or malicious.
      </div>
    </div>
  );
}
