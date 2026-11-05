import { useRef, useState } from 'react'
import { analyze } from './rules'
import type { ScamReport } from './rules'
import { addEvent } from '../log/store'
import { askGemini } from '../ai/client'
import type { AiOutcome } from '../ai/client'
import { AiPanel } from '../ai/panel'

export function ScamDetector() {
  const [account, setAccount] = useState('')
  const [report, setReport] = useState<ScamReport | null>(null)
  const [ai, setAi] = useState<AiOutcome | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const latest = useRef('')

  function run() {
    if (account.trim() === '') return
    const r = analyze(account)
    latest.current = r.account
    setReport(r)
    setAi(null)
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

      {report && report.level !== 'INVALID' && (
        <AiPanel outcome={ai} loading={aiLoading} onAsk={askAi} policyVerdict={null} />
      )}
    </div>
  )
}
