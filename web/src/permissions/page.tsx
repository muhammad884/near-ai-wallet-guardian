export function Permissions() {
  return (
    <div>
      <h1>Permissions</h1>
      <p className="muted">
        What an AI agent can be stopped from doing, and who stops it. This
        page only explains the model. It does not create or change any key.
      </p>

      <h2>Enforced by the NEAR protocol</h2>
      <div className="card">
        <span className="tag-demo">NEEDS A FUNCTION-CALL KEY</span>
        <div className="row"><span>Call one contract only</span><strong className="ok">NEAR</strong></div>
        <div className="row"><span>Call listed methods only</span><strong className="ok">NEAR</strong></div>
        <div className="row"><span>Attach NEAR to a call</span><strong className="ok">Not allowed</strong></div>
        <p className="muted">
          This holds only if the agent is given a function-call key. This
          app creates and revokes only function-call keys (Agent key section on Wallet Security).
        </p>
      </div>

      <h2>Shown by this app only</h2>
      <div className="card">
        <span className="tag-demo">NOT ENFORCED ON CHAIN</span>
        <div className="row"><span>Per-transaction NEAR limit</span><strong className="mid">App</strong></div>
        <div className="row"><span>Daily NEAR limit</span><strong className="mid">App</strong></div>
        <div className="row"><span>Ask me to approve</span><strong className="mid">App</strong></div>
        <div className="row"><span>Risk score and scam signals</span><strong className="mid">App</strong></div>
      </div>

      <h2>Never give an agent</h2>
      <div className="card">
        <div className="row"><span>A full-access key</span><strong className="bad">Total control</strong></div>
        <div className="row"><span>Your seed phrase</span><strong className="bad">Total control</strong></div>
      </div>
    </div>
  )
}
