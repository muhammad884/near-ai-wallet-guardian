import type { Decision } from '../policy/types'
import type { AiOutcome } from './client'
import { aiCaution } from './final'

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <h2 style={{ fontSize: 15, margin: '14px 0 6px' }}>{title}</h2>
      {items.map((x, i) => (
        <div className="row" key={i}>{x}</div>
      ))}
    </div>
  )
}

type Props = {
  outcome: AiOutcome | null
  loading: boolean
  waitingForEvidence?: boolean
  onAsk: () => void
  policyVerdict: Decision | null
}

export function AiPanel({
  outcome,
  loading,
  waitingForEvidence = false,
  onAsk,
  policyVerdict,
}: Props) {
  const caution = outcome ? aiCaution(policyVerdict, outcome) : null
  const a = outcome && outcome.state === 'GEMINI' ? outcome.analysis : null
  const tone = !a ? '' : a.riskLevel === 'LOW' ? 'neutral' : a.riskLevel === 'MEDIUM' ? 'mid' : 'bad'
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <span className="tag-demo">OPTIONAL · GEMINI AI · ADVISORY ONLY</span>
      <p className="muted">
        Sends the fields above (and the rule summary) through this app server to the
        Gemini API of Google. On the free tier Google may use what it receives to
        improve its products. Never include secrets. Gemini cannot approve, block,
        sign or send anything, and it cannot change the decision above.
      </p>
      <button
        className="btn"
        onClick={onAsk}
        disabled={loading || waitingForEvidence}
      >
        {waitingForEvidence
          ? 'Waiting for blockchain data...'
          : loading
            ? 'Asking Gemini...'
            : 'Ask Gemini for a second opinion'}
      </button>
      {waitingForEvidence && (
        <p className="muted">Waiting for the available blockchain evidence before sending the request to Gemini.</p>
      )}
      {outcome && outcome.state === 'UNAVAILABLE' && (
        <div>
          <div className="row">
            <span>Source</span>
            <strong className="mid">Gemini not used</strong>
          </div>
          <p className="muted">{outcome.message} The rule-based result above is unchanged.</p>
        </div>
      )}
      {outcome && outcome.state === 'GEMINI' && a && (
        <div>
          <div className="row">
            <span>Source</span>
            <strong>Gemini AI ({outcome.model})</strong>
          </div>
          <div className={'big ' + tone}>{a.riskScore}/100 · {a.riskLevel}</div>
          <div className="muted">
            Confidence: {a.confidence}
            {a.inconclusive ? ' · Inconclusive' : ''}
          </div>
          <p>{a.summary}</p>
          <List title="Reasons" items={a.reasons} />
          <List title="Indicators" items={a.indicators} />
          <List title="Recommendations" items={a.recommendations} />
          <List title="Uncertainties" items={a.uncertainties} />
          {caution && (
            <div className="row">
              <strong className="mid">{caution}</strong>
            </div>
          )}
          <p className="muted">
            AI-generated opinion. It is not verified blockchain data and not proof.
          </p>
        </div>
      )}
    </div>
  )
}
