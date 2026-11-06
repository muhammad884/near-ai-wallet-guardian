import { useRef, useState } from 'react'
import { analyze } from './rules'
import type { ScamReport } from './rules'
import { addEvent } from '../log/store'
import { askGemini } from '../ai/client'
import type { AiOutcome } from '../ai/client'
import { AiPanel } from '../ai/panel'
import { lookupBothNetworks } from '../chain/account'
import type { AccountOutcome } from '../chain/account'
import { DualChainPanel } from '../chain/panel'
import { getNearBlocksAccount } from './nearblocks'
import type { NearBlocksAccountData } from './nearblocks'

type NearBlocksRow = Record<string, unknown>

function getNearBlocksRows(value: unknown): NearBlocksRow[] {
  if (!value || typeof value !== 'object') return []
  const root = value as NearBlocksRow
  const data = root.data

  if (Array.isArray(data)) {
    return data.filter(
      (item): item is NearBlocksRow =>
        !!item && typeof item === 'object',
    )
  }

  if (data && typeof data === 'object') {
    return [data as NearBlocksRow]
  }

  return []
}

function readNearBlocksText(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : ''
}

export function ScamDetector() {
  const [account, setAccount] = useState('')
  const [report, setReport] = useState<ScamReport | null>(null)
  const [ai, setAi] = useState<AiOutcome | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const latest = useRef('')
  const [chain, setChain] = useState<{ mainnet: AccountOutcome; testnet: AccountOutcome } | null>(null)

  const [indexed, setIndexed] = useState<NearBlocksAccountData[] | null>(null)
  const [indexedLoading, setIndexedLoading] = useState(false)
  const [indexedError, setIndexedError] = useState('')

  function run() {
    if (account.trim() === '') return

    const r = analyze(account)
    latest.current = r.account
    setReport(r)
    setAi(null)
    setChain(null)
    setIndexed(null)
    setIndexedError('')

    if (r.level !== 'INVALID') {
      const target = r.account
      setIndexedLoading(true)

      Promise.all([
        getNearBlocksAccount(target, 'mainnet'),
        getNearBlocksAccount(target, 'testnet'),
      ])
        .then((data) => {
          if (latest.current === target) setIndexed(data)
        })
        .catch((error: unknown) => {
          if (latest.current === target) {
            setIndexedError(
              error instanceof Error ? error.message : 'NearBlocks request failed',
            )
          }
        })
        .finally(() => {
          if (latest.current === target) setIndexedLoading(false)
        })

      lookupBothNetworks(target).then((checks) => {
        if (latest.current === target) setChain(checks)
      })
    } else {
      setIndexedLoading(false)
    }

    addEvent({
      source: 'Scam Detector',
      summary: r.account,
      outcome: r.level,
      tone: r.level === 'NO SIGNS FOUND' ? 'neutral' : r.level === 'HIGH' ? 'bad' : 'mid',
    })
  }

  async function askAi() {
    if (!report || report.level === 'INVALID' || aiLoading) return
    const target = report.account
    setAiLoading(true)
    setAi(null)
    const out = await askGemini({ kind: 'account', account: target })
    if (latest.current === target) setAi(out)
    setAiLoading(false)
  }

  const cls =
    report === null ? ''
    : report.level === 'NO SIGNS FOUND' ? 'neutral'
    : report.level === 'HIGH' ? 'bad'
    : 'mid'

  return (
    <div>
      <h1>Scam Detector</h1>
      <p className="muted">
        Checks the spelling of a NEAR account name against fixed rules. The rules are
        plain code, not an AI model. They do not read the blockchain and never prove
        that an account is a scam, and an unfamiliar account is not automatically a
        scammer. You can also ask Gemini for a separate, optional second opinion.
      </p>
      <div className="card" style={{ marginTop: 16 }}>
        <label className="muted">NEAR account ID</label>
        <input className="field" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="wrap.near" />
        <button className="btn" onClick={run}>Check account</button>
      </div>

      {report && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className={'big ' + (report.level === 'NO SIGNS FOUND' ? '' : cls)}>
            {report.level}
          </div>
          <div className="muted" style={{ margin: '6px 0 10px' }}>
            Account: {report.account} · Score {report.score}/100
            <br />
            Confidence: {report.confidence}
          </div>
          {report.signals.map((s) => (
            <div className="row" key={s.text}>
              <span>
                {s.text}
                <br />
                <span className="muted">Evidence: {s.evidence}</span>
              </span>
              <strong>+{s.points}</strong>
            </div>
          ))}
          <div className="row"><strong>{report.advice}</strong></div>
          <h2>Not checked</h2>
          {report.notChecked.map((n) => (
            <div className="muted" key={n}>- {n}</div>
          ))}
          <div className="muted" style={{ marginTop: 10 }}>
            Source: {report.source}
          </div>
        </div>
      )}

      {report && report.level !== 'INVALID' && <DualChainPanel outcomes={chain} />}

      {report && report.level !== 'INVALID' && (
        <div className="card" style={{ marginTop: 12 }}>
          <h2>NEAR Blockchain Intelligence</h2>
          <p className="muted">
            Transaction and contract information from NearBlocks.
            These records are evidence for review, not proof of a scam.
          </p>

          {indexedLoading && <p className="muted">Loading Mainnet and Testnet data...</p>}

          {indexedError && (
            <p className="muted">NearBlocks error: {indexedError}</p>
          )}

          {indexed?.map((item) => {
            const transactions = getNearBlocksRows(item.transactions.data)
            const contracts = getNearBlocksRows(item.contract.data)
            const deployments = getNearBlocksRows(item.deployments.data)

            const successful = transactions.filter((tx) => {
              const outcomes = tx.outcomes
              return !!outcomes && typeof outcomes === 'object' &&
                (outcomes as NearBlocksRow).status === true
            }).length

            const failed = transactions.filter((tx) => {
              const outcomes = tx.outcomes
              return !!outcomes && typeof outcomes === 'object' &&
                (outcomes as NearBlocksRow).status === false
            }).length

            return (
              <div key={item.network} style={{ marginTop: 16 }}>
                <h3>{item.network.toUpperCase()}</h3>

                <h4>Recent transactions</h4>
                <div className="row">
                  <span>Transactions returned</span>
                  <strong>{transactions.length}</strong>
                </div>
                <div className="row">
                  <span>Successful transactions</span>
                  <strong>{successful}</strong>
                </div>
                <div className="row">
                  <span>Failed transactions</span>
                  <strong>{failed}</strong>
                </div>
                <p className="muted">HTTP status: {item.transactions.status}</p>

                {transactions.slice(0, 5).map((tx, index) => {
                  const outcomes = tx.outcomes && typeof tx.outcomes === 'object'
                    ? tx.outcomes as NearBlocksRow
                    : {}
                  const actions = Array.isArray(tx.actions) ? tx.actions : []
                  const methods = actions.map((action) => {
                    if (!action || typeof action !== 'object') return ''
                    return readNearBlocksText(
                      (action as NearBlocksRow).method ||
                      (action as NearBlocksRow).action,
                    )
                  }).filter(Boolean).join(', ')

                  const hash = readNearBlocksText(tx.transaction_hash)

                  return (
                    <div className="row" key={hash || index}>
                      <span>
                        <strong>{readNearBlocksText(tx.signer_account_id) || 'Unknown signer'}</strong>
                        {' → '}
                        {readNearBlocksText(tx.receiver_account_id) || 'Unknown receiver'}
                        <br />
                        <span className="muted">
                          {methods || 'Transaction'} · {
                            outcomes.status === true ? 'Success' :
                            outcomes.status === false ? 'Failed' : 'Status unavailable'
                          }
                        </span>
                      </span>
                      <span className="muted">
                        {hash ? hash.slice(0, 12) + '…' : ''}
                      </span>
                    </div>
                  )
                })}

                {transactions.length === 0 && (
                  <p className="muted">No transaction records returned.</p>
                )}

                <details>
                  <summary>View raw transaction data</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {JSON.stringify(item.transactions.data, null, 2)}
                  </pre>
                </details>

                <h4>Contract information</h4>
                <div className="row">
                  <span>Contract records returned</span>
                  <strong>{contracts.length}</strong>
                </div>
                <p className="muted">HTTP status: {item.contract.status}</p>
                <details>
                  <summary>View contract details</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {JSON.stringify(item.contract.data, null, 2)}
                  </pre>
                </details>

                <h4>Contract deployments</h4>
                <div className="row">
                  <span>Deployment records returned</span>
                  <strong>{deployments.length}</strong>
                </div>
                <p className="muted">HTTP status: {item.deployments.status}</p>
                <details>
                  <summary>View deployment details</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {JSON.stringify(item.deployments.data, null, 2)}
                  </pre>
                </details>
              </div>
            )
          })}
        </div>
      )}

      {report && report.level !== 'INVALID' && (
        <AiPanel outcome={ai} loading={aiLoading} onAsk={askAi} policyVerdict={null} />
      )}
    </div>
  )
}
