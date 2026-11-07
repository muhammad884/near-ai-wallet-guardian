import { useEffect, useRef, useState } from 'react'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { checkSend, yoctoToNear } from './logic'
import { countsAsSpent, readResult } from './result'
import type { Outcome } from './result'
import { decide, mayRequestSignature } from '../policy/decide'
import type { ScanResult } from '../scanner/risk'
import { decideAndLog } from '../log/decided'
import { addEvent } from '../log/store'
import { addSent } from './session'
import { actionCreators } from '@near-js/transactions'

const EXPLORER = 'https://testnet.nearblocks.io'

type Review = {
  sender: string
  receiver: string
  amountText: string
  yocto: bigint
  result: ScanResult
}

type Done = {
  outcome: Outcome
  receiver: string
  amountText: string
  time: string
}

export function SendCard({ account }: { account: string }) {
  const { signAndSendTransactions, getBalance } = useWalletSelector()
  const [balance, setBalance] = useState<bigint | null>(null)
  const [receiver, setReceiver] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [rawReview, setRawReview] = useState<Review | null>(null)
  const review = rawReview?.sender === account ? rawReview : null
  const [agreed, setAgreed] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [done, setDone] = useState<Done | null>(null)
  const busy = useRef(false)

  function loadBalance() {
    Promise.resolve(getBalance(account))
      .then((b) => setBalance(b))
      .catch(() => setBalance(null))
  }

  useEffect(() => {
    loadBalance()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- known warning, left as is on purpose to avoid re-running wallet effects
  }, [account])

  function runCheck() {
    setError('')
    setMessage('')
    setDone(null)
    setRawReview(null)
    setAgreed(false)
    const c = checkSend(account, receiver, amount, balance)
    if (!c.ok) {
      setError(c.error)
      return
    }
    const to = receiver.trim()
    const result = decideAndLog(
      'Send NEAR',
      { agentId: 'you', receiver: to, amount: Number(amount) },
      'verdict',
      `Review: ${amount.trim()} NEAR to ${to}`,
    )
    setRawReview({ sender: account, receiver: to, amountText: amount.trim(), yocto: c.yocto, result })
  }

  async function send() {
    if (!review || pending || busy.current) return
    if (review.sender !== account) {
      setRawReview(null)
      setAgreed(false)
      setMessage('The connected wallet changed. Review the transaction again.')
      return
    }
    const fresh = decide({
      agentId: 'you',
      receiver: review.receiver,
      amount: Number(review.amountText),
    })
    if (!mayRequestSignature(fresh.verdict, agreed)) {
      setMessage('The policy does not allow this transfer right now. Review it again.')
      return
    }
    busy.current = true
    setPending(true)
    setMessage('')
    const r = review
    try {
      const res = await signAndSendTransactions({
        transactions: [
          {
            signerId: account,
            receiverId: r.receiver,
            actions: [
              actionCreators.transfer(r.yocto),
            ],
          },
        ],
      })
      const outcome = readResult(res)
      if (countsAsSpent(outcome.state)) addSent(Number(r.amountText))
      addEvent({
        source: 'Send NEAR',
        summary: `${r.amountText} NEAR to ${r.receiver}`,
        outcome:
          outcome.state === 'SUCCESS' ? 'SENT ON TESTNET'
          : outcome.state === 'FAILED' ? 'FAILED ON CHAIN'
          : 'SUBMITTED, RESULT UNKNOWN',
        tone:
          outcome.state === 'SUCCESS' ? 'ok'
          : outcome.state === 'FAILED' ? 'bad'
          : 'mid',
      })
      setDone({
        outcome,
        receiver: r.receiver,
        amountText: r.amountText,
        time: new Date().toISOString(),
      })
      setRawReview(null)
      loadBalance()
    } catch (e) {
      setMessage(
        e instanceof Error && e.message
          ? e.message
          : 'The wallet did not complete the transfer.',
      )
      addEvent({
        source: 'Send NEAR',
        summary: `${r.amountText} NEAR to ${r.receiver}`,
        outcome: 'NOT SENT',
        tone: 'mid',
      })
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  const decision = review?.result.policy.decision
  const blocked = decision === 'BLOCKED'
  const needsOk = decision === 'REQUIRES_APPROVAL'
  const canSend = review !== null && !blocked && (!needsOk || agreed) && !pending

  return (
    <div>
      <h2 style={{ fontSize: 17, margin: '24px 0 10px' }}>Send NEAR (testnet only)</h2>
      <div className="card">
        <span className="tag-demo">TESTNET</span>
        <div className="row">
          <span>From</span>
          <strong>{account}</strong>
        </div>
        <div className="row">
          <span>Balance</span>
          <strong>{balance === null ? 'unknown' : yoctoToNear(balance) + ' NEAR'}</strong>
        </div>
        <label className="muted">Recipient (testnet account)</label>
        <input className="field" value={receiver} onChange={(e) => { setReceiver(e.target.value); setRawReview(null); setAgreed(false) }} placeholder="friend.testnet" />
        <label className="muted">Amount (NEAR)</label>
        <input className="field" value={amount} onChange={(e) => { setAmount(e.target.value); setRawReview(null); setAgreed(false) }} inputMode="decimal" placeholder="0.1" />
        {error && <div className="bad">{error}</div>}
        <button className="btn" onClick={runCheck} disabled={pending}>Review and check</button>
      </div>

      {review && (
        <div className="card" style={{ marginTop: 12 }}>
          <span className="tag-demo">REVIEW BEFORE SIGNING</span>
          <div className="row"><span>From</span><strong>{account}</strong></div>
          <div className="row"><span>To</span><strong>{review.receiver}</strong></div>
          <div className="row"><span>Amount</span><strong>{review.amountText} NEAR</strong></div>
          <div className="row"><span>Network fee</span><span>Shown by your wallet</span></div>
          <div className={'big ' + (review.result.level === 'LOW' ? 'ok' : review.result.level === 'MEDIUM' ? 'mid' : 'bad')}>
            {review.result.score}/100 · {review.result.level}
          </div>
          <div className="muted">Policy decision (app-level): {decision}</div>
          {review.result.policy.reasons.map((x) => (
            <div className="row" key={x}>{x}</div>
          ))}
          {review.result.findings.map((f) => (
            <div className="row" key={f.text}>
              <span>{f.text}</span>
              <strong>+{f.points}</strong>
            </div>
          ))}
          <p className="muted">
            Protection level: this check runs in the app only. It does not
            stop anyone from sending from a wallet directly. Your wallet will
            still ask you to approve, and you can refuse there.
          </p>
          {needsOk && (
            <label className="muted">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /> I approve this transfer
            </label>
          )}
          {blocked ? (
            <div className="bad">Blocked by your policy. The wallet will not be asked to sign.</div>
          ) : (
            <button className="btn" disabled={!canSend} onClick={send}>
              {pending ? 'Waiting for your wallet...' : 'Send in my wallet'}
            </button>
          )}
        </div>
      )}

      {message && (
        <div className="card bad" style={{ marginTop: 12 }}>{message}</div>
      )}

      {done && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className={'big ' + (done.outcome.state === 'SUCCESS' ? 'ok' : done.outcome.state === 'FAILED' ? 'bad' : 'mid')}>
            {done.outcome.state === 'SUCCESS'
              ? 'Sent on testnet'
              : done.outcome.state === 'FAILED'
                ? 'Failed on chain'
                : 'Submitted, result not confirmed'}
          </div>
          <div className="row"><span>To</span><strong>{done.receiver}</strong></div>
          <div className="row"><span>Amount</span><strong>{done.amountText} NEAR</strong></div>
          <div className="row"><span>Time</span><span>{done.time.slice(0, 19).replace('T', ' ')} UTC</span></div>
          <div className="row">
            <span>Hash</span>
            <span style={{ wordBreak: 'break-all' }}>{done.outcome.hash ?? 'not returned'}</span>
          </div>
          {done.outcome.state === 'UNKNOWN' && (
            <p className="muted">
              The wallet gave no result we can read, so we do not call this a
              success. Check the explorer.
            </p>
          )}
          <a
            className="btn"
            style={{ textAlign: 'center', textDecoration: 'none' }}
            href={done.outcome.hash ? `${EXPLORER}/txns/${done.outcome.hash}` : `${EXPLORER}/address/${account}`}
            target="_blank"
            rel="noreferrer"
          >
            Open in testnet explorer
          </a>
        </div>
      )}
    </div>
  )
}
