# AI Wallet Guardian

A security check for people who let AI agents work with their NEAR account. It sits between the user, their agents and their transactions, and gives every transaction a clear verdict with reasons. Built for the NEAR hackathon, AI Security & Defense track.

**Live demo:** https://near-ai-wallet-guardian.vercel.app (NEAR testnet only). On a phone, switch the browser to Desktop site to see the wallet list.

## In 30 seconds

- **Policy engine:** per-transaction, daily and per-agent limits, plus allowed contracts and methods. Verdict: APPROVED, REQUIRES_APPROVAL or BLOCKED, with reasons.
- **Transaction Scanner:** a 0-100 risk score from visible rules (`add_full_access_key` scores 90/100 CRITICAL).
- **Scam Detector:** flags lookalike account names (`wrap.neer` vs `wrap.near`) and shows on-chain evidence from NEAR RPC and NearBlocks.
- **Gemini second opinion (optional):** advisory only. It can never approve, block or change a verdict.
- **Send NEAR (testnet):** review, see the verdict, then approve in your wallet. A blocked transfer never opens the wallet.
- **Agent key (testnet):** create and revoke a real function-call key limited to one contract and named methods. Two test buttons show NEAR accepting an allowed call and rejecting a transfer. The NEAR protocol itself enforces that limit.

## Try it in 2 minutes

1. Open the live demo, go to Spending Limits, and check amounts 2, 7 and 40 to see APPROVED, REQUIRES_APPROVAL and BLOCKED.
2. Go to Transaction Scanner, enter method `add_full_access_key`, and press Scan.
3. Go to Scam Detector, and check `wrap.neer` and then `wrap.near`.
4. Go to Wallet Security, connect a testnet wallet, press Create agent key, press the blue button (allowed call, accepted) and the red button (transfer, rejected by NEAR), then press Revoke this key. The key list reads the live testnet RPC.

Steps 1 to 3 need no wallet. Step 4 needs a free NEAR testnet account in Meteor Wallet.

The full walkthrough is in "How to try it (judges)" below.

## Honest status

- Works and tested: policy engine, scanner, scam detector (128 automated tests); Send NEAR, agent key create/revoke and the accept/reject test on testnet (checked by hand).
- App-level only: spending limits, risk scores and verdicts run in your browser. The one thing enforced on chain is the function-call key limit (one contract, named methods), which NEAR itself enforces.
- Built and checked by hand on testnet: creating and revoking a function-call key (Agent key section).
- Not built yet: on-chain spending contracts for NEAR amount limits (see the roadmap).
- AI Agent profiles are saved settings only. They do not run an agent.
- Gemini runs on a free tier. If its quota is used up, the app says Gemini was not used and everything else keeps working.

Full details follow below.

## What it does

- **Policy engine:** per-transaction, daily and per-agent NEAR limits, an approval threshold, allowed contracts and allowed methods. Every transaction gets APPROVED, REQUIRES_APPROVAL or BLOCKED, with the reasons shown. This is plain code, not an AI model.
- **Transaction Scanner:** a 0-100 risk score from visible rules (for example, a call to `add_full_access_key` scores 90/100 CRITICAL).
- **Scam Detector:** flags account names that look like well-known ones (for example, `wrap.neer` vs `wrap.near`), shows its evidence and lists what it did not check.
- **Gemini second opinion (optional):** on the Scanner and the Scam Detector you can ask Google Gemini for a separate, advisory opinion through a server function. It never changes a decision.
- **Send NEAR (testnet):** review a transfer, see the policy decision and the risk score, then approve in your wallet. A blocked transfer never opens the wallet.
- **Wallet Security:** connect a NEAR testnet wallet (Meteor, through Wallet Selector) and see the account's access keys, read live from the testnet RPC.
- **AI Agents:** saved agent profiles with their own limits. They are settings only: they do not run and do not send anything.
- **Activity History, Security Alerts and Dashboard:** a log of the decisions made in this browser.

## Status: what is real and what is not

This is a work in progress. This table is the honest state of every part.

| Part | Status |
|---|---|
| Policy engine (limits, allowed contracts and methods) | Works. Plain code with automated tests. The Spending Limits page lets you edit the policy; it is saved in this browser and used by the Scanner, Spending Limits and Send NEAR. Decisions are app-level only. |
| Transaction Scanner | Works. Rule-based code with automated tests; it reads nothing from the blockchain. An optional Gemini opinion is shown separately. |
| Scam Detector | Works. Name-based rules assess account spelling only. Separately, the page checks NEAR Mainnet and Testnet RPC data and displays NearBlocks indexed transaction, contract and deployment records. These checks do not prove an account is safe or malicious. An optional Gemini opinion is shown separately. |
| Gemini second opinion | Optional and advisory only. It needs GEMINI_API_KEY on the server; without it the pages say Gemini was not used. On 2026-11-05 the author checked by hand with a real key that a Gemini answer is shown for an account and for a transaction, that a blocked verdict stays blocked, and that the key string does not appear in the served JavaScript. Automated tests use a fake Gemini. |
| AI Agents page | Works. Profiles are saved in this browser. They are saved settings only: they do not run, do not control any AI agent and do not send transactions. |
| Activity History and Security Alerts | Works. Saved in this browser (up to 200 records) and restored on reload. Not stored on the blockchain or in the cloud. |
| Wallet page (Meteor Wallet, testnet) | Sign-in and sign-out checked by hand on testnet with Meteor Wallet, using the browser's Desktop site setting. Shows the account ID and a read-only list of the account's access keys from the testnet RPC. In the normal phone layout the wallet list is hidden (see Known issues). |
| Dashboard | Counts from the decisions saved in this browser, the number of enabled agent profiles, and the wallet status as last seen on Wallet Security. |
| Permissions | Explains who enforces each rule. Key changes happen only in the Agent key section on Wallet Security. |
| Send NEAR (testnet) | Checked by hand on testnet: input errors, a blocked review (the wallet is never asked), an approval-needed review (Send stays disabled until you tick the box), one real 0.01 NEAR transfer and a refused wallet request (nothing was sent). Unit tests cover the checks and the result reader. A transfer the policy blocks never reaches the wallet, but anyone can still send directly from their wallet. |
| Settings | Light or dark theme and clearing the decision history. |
| On-chain enforcement | Partly. Function-call keys (one contract, named methods) are created and revoked on testnet and enforced by NEAR itself. NEAR amount limits are not enforced on chain. See below. |

## Manual Testing & Production Verification

The deployed application was manually reviewed by the author in a browser using NEAR Testnet and read-only Mainnet checks. These checks complement automated tests; they are not a formal security audit.

### Automated tests and code checks

| Check | Result |
|---|---|
| Automated test suite | 128 passed, 0 failed |
| TypeScript | `npx tsc --noEmit` passed |
| ESLint | `npm run lint` passed |
| Production build | `npm run build` passed |
| Gemini endpoint and client tests | Covered using a fake Gemini service; no real API key or network required |

### Manual application tests

| Feature | What was checked | Result |
|---|---|---|
| Meteor Wallet | Connected a Testnet wallet and displayed the account ID. | Passed |
| Wallet balance | Displayed the connected account's Testnet balance. | Passed |
| Send NEAR validation | Zero amount was rejected. | Passed |
| Send NEAR policy checks | Transfers above configured transaction, daily and agent limits were blocked before the wallet was asked to sign. | Passed |
| Spending Limits | A test transaction exceeding the agent limit and using a contract outside the allowed list was blocked. | Passed |
| Transaction Scanner | Reviewed rule-based transaction risk results. | Passed |
| Scam Detector | Checked `wrappp.near` and `wrap.near`; the lookalike received a warning while the canonical name had no spelling warning. | Passed |
| Mainnet and Testnet checks | Reviewed account existence, balance, contract and NearBlocks evidence. | Passed |
| Gemini second opinion | Received a separate advisory response for `wrap.near`; it did not change the rule-based result. | Passed |
| AI Agents | Created and displayed an enabled saved agent profile. | Passed |
| Permissions | Verified the explanation of protocol-enforced key restrictions versus app-only controls. | Passed |
| Activity History | Confirmed decisions appeared in browser-local history. | Passed |
| Security Alerts | Confirmed alerts reflected recorded decisions. | Passed |
| Settings | Reviewed theme and decision-history settings. | Passed |

### Important test qualifications

- The latest restrictive Send NEAR checks were blocked before the wallet was asked to sign. No transaction was signed or sent during those checks.
- A policy decision is enforced by this application flow, not by the NEAR blockchain. A user can still transfer directly from their wallet outside this app.
- The Scam Detector's spelling score is not a security verdict. The displayed blockchain and NearBlocks information is limited to the data returned by those sources.
- The `wrap.near` review showed 10 sampled successful Mainnet transactions and 10 sampled failed Testnet transactions. These are samples, not complete account histories. Failed Testnet transactions do not prove malicious activity.
- The Gemini result for `wrap.near` was 15/100, LOW risk, with MEDIUM confidence. It was advisory only and did not establish that the account or contract is safe.
- AI Agent profiles are saved settings only. They do not run an autonomous agent or control a wallet key.
- Permissions were reviewed as explanatory information. The Permissions page only explains; function-call keys are created and revoked in the Agent key section on Wallet Security.

## Feature Roadmap

The roadmap separates existing app features from work that has not yet been implemented.

### Phase 1 — Core wallet security experience
<badge color="success">Core app features implemented</badge>

- Rule-based transaction policy engine.
- Transaction Scanner and risk explanations.
- Scam Detector with separate NEAR RPC and NearBlocks evidence.
- Optional Gemini advisory opinions.
- NEAR Testnet wallet connection and Send NEAR review flow.
- App-level spending limits and approval checks.
- Browser-local agent profiles, activity history and security alerts.
- Dashboard, permissions explanations and settings.

### Phase 2 — NEAR protocol-level key protection
<badge color="warning">Planned — not implemented</badge>

- Function-call key creation and revoke: done for a demo key on testnet (Agent key section). Next: tie keys to saved agent profiles.
- Restrict agent keys to one approved contract and permitted methods.
- Avoid giving agents Full-Access Keys.
- Test key permissions, allowance handling, revocation and failure cases.

### Phase 3 — On-chain spending controls
<badge color="warning">Planned — design required</badge>

- Research and design a smart-contract-based spending control system.
- Define how transaction limits and agent permissions would be enforced on chain.
- Review the design for security before implementation.
- Do not treat the current browser policy engine as on-chain enforcement.

### Phase 4 — AI Agent integration
<badge color="warning">Future work</badge>

- Explore connecting real AI agents to restricted wallet permissions.
- Require explicit user-configured permissions.
- Keep transaction review, limits and security boundaries clear.
- Test agent behavior without exposing seed phrases or Full-Access Keys.

### Phase 5 — Advanced security and reliability
<badge color="warning">Future work</badge>

- Improve contract and transaction risk analysis.
- Explore additional threat-intelligence sources.
- Improve monitoring, error handling and security testing.
- Review dependencies and wallet integration as upstream packages evolve.

Roadmap items are proposals, not completed features or guarantees. Their implementation depends on security design, testing and review.

## About enforcement (read this)

Today the spending limits, risk scores and verdicts in this app are applied by code running in your browser. The app can show APPROVED, REQUIRES_APPROVAL or BLOCKED, but it does not stop anything on the NEAR blockchain. Removing an agent profile in the app does not revoke a key on chain; keys are revoked separately in the Agent key section. The app does not claim otherwise.

What the official NEAR docs say about access keys:

- A function-call key can only call one contract, can be limited to named methods, and its allowance pays for gas only.
- A function-call key cannot attach NEAR to a call.
- A full-access key has complete control of the account. Never give one to an agent.

Plan (step 1 now exists as the Agent key section, step 2 is not built):

1. Give each agent a function-call key limited to one contract and a list of methods, never a full-access key. This restriction is enforced by the NEAR protocol itself.
2. Limits on how much NEAR can move cannot be enforced by that key alone. That would need a smart contract of our own. We have not designed, written or verified one, and nothing in this repository claims it.

### Enforced by NEAR vs shown by this app

This app can create and revoke one kind of key: a function-call key limited to one contract and named methods (Agent key section, testnet). It never creates a full-access key and never offers to remove one. The table shows who would enforce each rule.

| Rule | Who enforces it |
|---|---|
| An agent can call only one contract | The NEAR protocol, if the agent holds a function-call key. The Agent key section creates and revokes such a key on testnet (checked by hand). |
| An agent can call only listed methods | The NEAR protocol, same condition. |
| An agent cannot attach NEAR to a call | The NEAR protocol, same condition. |
| Per-transaction and daily NEAR limits | This app only. It shows a decision and does not stop anything on chain. |
| Risk scores and scam signals | This app only. Advice, not proof. |

Source for the first three rows: the NEAR access keys documentation (docs.near.org, Access Keys page). Whether a contract of our own is needed to enforce NEAR limits is our own design idea, not something the documentation states.

## Agent key (testnet): a real key, enforced by NEAR

On the Wallet Security page, the Agent key section creates a function-call key limited to one contract and named methods, with a 0.25 NEAR gas allowance, and lists and revokes function-call keys on the connected account.

Checked by hand on testnet with Meteor Wallet on 8 November 2026: we created a key for hello.near-examples.testnet (set_greeting) and saw it in the live key list as a function-call key. With that key, the agent signed a set_greeting call on its own and NEAR accepted it. The same key then tried to send 0.01 NEAR and NEAR rejected it with InvalidAccessKeyError RequiresFullAccess. Earlier runs also revoked keys, and the function-call key count returned to 0 while the full-access key stayed untouched.

- The private half of each demo key stays in the browser tab only and is lost on refresh. It is never saved or sent anywhere. The two test buttons sign with it directly, without the wallet, so the accept and reject results come from NEAR itself, not from this app. This tests the permission. It is not a running autonomous agent.
- An empty method list is refused, because it would allow every method.
- The app never creates a full-access key and never offers to remove one.
- Limits on how much NEAR can move are still not enforced on chain. That would need a smart contract of our own, which we have not built.

## Run it

The app lives in the `web` folder (React, TypeScript, Vite). We developed it on Node v26; the tests rely on Node running TypeScript files directly.

```bash
cd web
npm install
npm run dev
```

Build and tests:

```bash
npm run build
node --test tests/*.test.ts
```

`npm run dev` serves only the front end. The Gemini button needs the server function in `web/api/analyze.js`, which runs on Vercel, so locally it reports that Gemini was not used.

Environment variables: see `.env.example`. The front end reads none. The server function reads `GEMINI_API_KEY` and can optionally read `GEMINI_MODEL`. These server-side settings are never committed. The app never asks for a seed phrase or a private key.

## Network

Send NEAR transactions are Testnet only. Do not use an account that holds real funds. The Scam Detector also performs read-only checks against NEAR Mainnet and Testnet.

## How to try it (judges)

Open https://near-ai-wallet-guardian.vercel.app. On a phone, switch the browser to Desktop site before step 5. Your decisions, agent profiles and policy are saved in this browser.

1. Spending Limits: press Check transaction (Amount 2) and see APPROVED. Change Amount to 7 and see REQUIRES_APPROVAL. Change it to 40 and see BLOCKED with the reasons.
2. Transaction Scanner: Amount 1, Method `add_full_access_key`, press Scan. You see 90/100 CRITICAL with each rule listed.
3. Scam Detector: check `wrap.neer` and see HIGH (it looks like `wrap.near`). Check `wrap.near` and see NO SIGNS FOUND plus a list of what was not checked.
4. Gemini (optional): after a Scam Detector or Scanner result, press Ask Gemini for a second opinion. If the server has a key and free quota you see a Gemini answer in its own box. Otherwise the page says Gemini was not used. The rule-based result and the policy decision never change.
5. Wallet Security: press Connect wallet, choose Meteor Wallet with a testnet account, and see Connected with the account ID and the key list. Disconnect returns it to Not connected.
6. Send NEAR (Wallet Security, with testnet NEAR from the faucet): enter a testnet recipient and a small amount, press Review and check, read the policy decision, then press Send in my wallet and approve in Meteor. A BLOCKED review never opens the wallet.
7. Activity History, Security Alerts and Dashboard: see the decisions from the steps above.
8. Permissions: shows who enforces each rule.

## Known issues

- The wallet list is hidden in the normal phone layout of the Wallet Selector window. Switching the browser to Desktop site shows it. We tried a CSS change for narrow screens and it did not fix the problem, so we removed it. Only Meteor Wallet is configured.
- Activity history, agent profiles, the applied policy and the amount sent today are saved in this browser (localStorage). That is specific to one browser on one device. It is not cloud or blockchain storage, and clearing the browser data removes it. The amount sent today is counted in UTC days and only for transfers sent with Send NEAR.
- Send NEAR counts a transfer as spent unless the wallet reports a failure, so a result we cannot read still counts toward the daily limit.
- Allowed contracts and methods are checked only when a method is given (a contract call). A plain NEAR transfer is limited by the amount rules only.
- The Transaction Scanner rules assess the transaction details entered and do not read blockchain data. The Scam Detector name-based score assesses account spelling only; separate Mainnet and Testnet RPC checks and NearBlocks records are displayed as evidence. A low score does not prove an account is safe.
- Agent profiles are saved settings only. They are not connected to any running agent.
- Gemini: free-tier quotas can run out, Google may use free-tier content to improve its products, and the endpoint's abuse limits are best effort (see the Gemini section).
- npm audit still reports low-severity findings (see Dependency audit).

## Gemini AI (optional, advisory only)

The Transaction Scanner and the Scam Detector have a button: Ask Gemini for a second opinion. It sends a small, validated request to our own server function (`web/api/analyze.js` on Vercel). The server calls the Google Gemini API with a key kept in the server variable `GEMINI_API_KEY` and returns a validated answer: a 0-100 risk score, a level, confidence, reasons, indicators, recommendations and what is uncertain.

- The rule-based engines decide. Gemini cannot approve, block, sign or send anything, and it cannot change the policy verdict. Its answer is shown in its own box, labelled with the model name.
- If Gemini is not available (no key, quota used up, network error, timeout, or an answer that fails validation) the page says Gemini was not used and keeps the rule-based result. It never shows an AI answer that was not received.
- Gemini only sees what we send: receiver, amount, method, arguments (300 characters at most) and the rule summary, or just the account ID. It has no blockchain access and no threat-intelligence lists, so it can only judge how the data looks. Its answer is an opinion, not verified blockchain data.
- The server refuses text that looks like a private key or a seed phrase. This is a best-effort check: never paste secrets.
- User text is treated as data inside the prompt, and the answer must match a fixed JSON schema and pass checks before it is shown. This lowers prompt-injection risk but does not remove it, which is why the answer cannot change any decision.
- Protecting the free quota is best effort: the endpoint checks input size and origin and applies small per-address and per-day limits kept in memory, which serverless instances do not share. No billing is linked, so the worst case is that the free quota runs out and the app falls back to the rules.

Free tier notes:

- It uses Gemini on the free tier. The default primary model is `gemini-3.6-flash`; `gemini-3.5-flash-lite` is the fallback for retryable failures. The primary model can be overridden with the server variable `GEMINI_MODEL`. Free-tier limits vary by model, apply per project and are shown in Google AI Studio. We did not copy numbers here because they change.
- On the free tier Google may use the content it receives to improve its products. Only data of the kind listed above is sent, and the app is testnet only. Check the Google terms for your region.

Setup for maintainers:

1. Create a key in Google AI Studio. Do not link billing.
2. In Vercel add `GEMINI_API_KEY` under Project Settings, Environment Variables (Production), then redeploy. New variables apply only to new deployments.
3. No local file is needed: the function runs on Vercel. Never commit the key and never give it a `VITE_` or `NEXT_PUBLIC_` name.

Checks: automated tests cover the endpoint and the client with a fake Gemini (no network and no key): input checks, secret refusal, answer validation, every fallback path, no key in any response, rate limits, and that the policy verdict cannot change. On 2026-11-05 the author checked by hand with a real key that a Gemini answer is shown for an account and for a transaction, that a blocked verdict stays blocked, and that the key string does not appear in the served JavaScript.


Update 2026-11-07: Google's docs say Gemini 3.6 Flash and Gemini 3.5 Flash-Lite no longer accept the sampling parameters `temperature`, `top_p` and `top_k`. We removed `temperature` (the only one we used) from the request in `web/api/analyze.js`. No automated test depended on it.

## Dependency audit

Run on 2026-11-05 with npm audit (the full report).

- Production dependencies (`npm audit --omit=dev`): 16 (16 low, 0 moderate, 0 high, 0 critical).
- All dependencies including development tools: 26 (16 low, 10 moderate, 0 high, 0 critical).

Before our change the production audit listed 5 high findings (decode-uri-component and nanoid, and the packages that depend on them). `package.json` now has overrides that force nanoid 5.1.16 and decode-uri-component 0.5.1. The second is newer than the version the Meteor SDK asked for, so it could affect Meteor sign-in. We checked Meteor sign-in by hand on testnet after the change and it worked.

What remains is low severity: the @near-js packages, near-api-js, secp256k1 and elliptic (an advisory about a risky cryptographic implementation that we have not read in detail). In the report we read, npm's suggested fix for that chain was a forced change that installs meteor-wallet 9.3.0. It is a breaking change, so we did not apply it. Any moderate findings are in development tools and were not inspected one by one.

Reachability: our own source does not import decode-uri-component, query-string, nanoid, elliptic or secp256k1 directly (checked with grep). We did not trace whether the wallet libraries call vulnerable code with input an attacker controls, so we do not claim it is unreachable. Our code never asks for or stores a seed phrase or private key and never signs anything itself, but that does not prove the risk is zero.

## Tests

Run all automated tests from the `web` folder (128 tests at the time of writing: policy engine, scanner, agents, scam rules, key parsing, policy settings, send checks, central policy, browser storage, and the Gemini endpoint and client):

    cd web
    node --test tests/*.test.ts

The Gemini tests use a fake Gemini, so they need no key and no network. These tests check the rules in code. They do not test the wallet sign-in, which we checked by hand, anything on the blockchain, or the real Gemini service.

## Built with, and AI disclosure

Track: AI Security & Defense.

Libraries: React, TypeScript, Vite, react-router-dom, lucide-react, buffer (a browser polyfill), @near-js/transactions (to build the transfer action) and the NEAR Wallet Selector packages (core, modal-ui, react-hook, meteor-wallet). Runtime service: the Google Gemini API, optional, through our server function.

AI assistance: the code in this repository was written with an AI coding assistant (Claude) and run and tested by the author. At runtime an AI model (Gemini) is used only for the optional advisory opinion; it makes no decisions.

Project start: the first commit in this repository is dated 2026-10-31 11:10 UTC, and every commit is after it. The hackathon rules say code written since the announcement counts, and development runs 1 to 14 November 2026. This is a new project and it does not reuse code from the author's other projects.

## License

MIT

## On-chain account checks (Mainnet and Testnet)

The Scam Detector queries both NEAR Mainnet and Testnet RPC endpoints using `view_account`. It displays whether the account exists, its balance, and whether a smart contract is deployed on each network. These facts are shown separately from the name-based rule result and do not change its score or prove that an account is safe or malicious. If an RPC cannot be reached, the app reports the failure and makes no conclusion about that network. RPC failure handling is covered by unit tests with mocked responses.

NearBlocks separately provides indexed transaction, contract, and deployment data for both networks. These records are limited to the data returned by the provider and are not a complete security audit.
