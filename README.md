# AI Wallet Guardian

A security layer for NEAR Protocol that sits between a user, their AI
agents and their transactions. Built for the NEAR hackathon, AI Security
& Defense track.

Live demo: https://near-ai-wallet-guardian.vercel.app

## Status: what is real and what is not

This project is a work in progress. This table is the honest state of
every part.

| Part | Status |
| --- | --- |
| Policy engine (limits, allowed contracts and methods) | Works. Pure code with automated tests. The Spending Limits page lets you edit the policy. It is saved in this browser and used by the Scanner, Spending Limits and Send NEAR. Decisions are app-level only. |
| Transaction Scanner (0-100 score with visible rules) | Works. Pure code, 10 automated tests. |
| AI Agents page (validated agent profiles) | Works. Profiles are saved in this browser. They are saved settings only: they do not run, do not control any AI agent and do not send transactions. Automated tests cover validation and saving. |
| Activity History and Security Alerts | Works. Saved in this browser (up to 200 records) and restored on reload. Not stored on the blockchain or in the cloud. |
| Wallet page (NEAR Wallet Selector, Meteor, testnet) | Sign-in and sign-out checked by hand on testnet with Meteor Wallet. It shows the account ID and a read-only list of the account's access keys from the testnet RPC (checked by hand: our test account has 1 full-access key and 0 function-call keys). The Dashboard shows the wallet status as last seen on this page. |
| Dashboard | Real counts from the decisions saved in this browser, the number of enabled agent profiles, and the wallet status as last seen on Wallet Security. |
| Scam Detector (rules on the spelling of an account name) | Works, 11 automated tests. Reads nothing from the blockchain, uses no AI model, and cannot prove an account is safe or a scam. |
| Permissions | Explains who enforces each rule. Creates and changes no keys. |
| Send NEAR (testnet, on the Wallet Security page) | Checked by hand on testnet by the author: input errors, a blocked review (the wallet is never asked), an approval-needed review (Send stays disabled until you tick the box), one real 0.01 NEAR transfer (the app reported Sent on testnet and the author saw it succeed in the explorer) and a refused wallet request (nothing was sent). Unit tests cover the checks and the result reader. This is the app only: a transfer the policy blocks never reaches the wallet, but anyone can still send directly from their wallet. |
| Settings | Light or dark theme (saved in the browser) and clearing the decision history. |
| AI model | Not used anywhere yet. |
| On-chain enforcement | Not built yet. See below. |

## How the checks work

The policy engine, the transaction scanner and the scam detector are rule-based code. They do not use an AI model, and no AI model decides anything in this app. The name refers to the people this tool is for: owners who let AI agents act on their NEAR account. Every rule is visible in the source, and the same input and policy always give the same decision.

## About enforcement (read this)

Today every rule in this app is applied by code running in your browser.
The app can show APPROVED, REQUIRES_APPROVAL or BLOCKED, but it does not
stop anything on the NEAR blockchain. Removing an agent in the app does
not revoke any key on chain. The app does not claim otherwise.

What the official NEAR docs say about access keys:

- A function-call key can only call one contract, can be limited to named
  methods, and its allowance pays for gas only.
- A function-call key cannot attach NEAR to a call.
- A full-access key has complete control of the account. Never give one
  to an agent.

Plan (not built yet):

1. Give each agent a function-call key limited to one contract and a list
   of methods, never a full-access key. This restriction is enforced by
   the NEAR protocol itself.
2. Limits on how much NEAR can move cannot be enforced by that key alone.
   That would need a smart contract of our own. We have not designed,
   written or verified one, and nothing in this repository claims it.

## Run it

The app lives in the web folder. It uses React, TypeScript and Vite. We
developed it on Node v26 (the tests rely on Node running TypeScript files
directly).

    cd web
    npm install
    npm run dev

Build and tests:

    npm run build
    node --test tests/engine.test.ts
    node --test tests/risk.test.ts
    node --test tests/agents.test.ts

Environment variables: see .env.example. The app does not read any yet.
Never commit a real .env file. The app never asks for a seed phrase or a
private key.

## Known issues

- The wallet picker can be hidden in a narrow phone layout. We tried a CSS change for narrow screens and it did not fix it, so we removed it. Switching the
  browser to desktop site shows it.
- Spending limits count only what you send with Send NEAR in this
  session, and the count is lost when you refresh. The Scanner, Spending
  Limits and Send NEAR use the same policy: the one you applied on the
  Spending Limits page.
- Activity history, agent profiles, the applied policy and the amount sent today are saved in this browser (localStorage). This is specific to one browser on one device. It is not cloud or blockchain storage, and clearing the browser data removes it. Agent profiles are saved settings only: they do not run and do not send transactions.
- Allowed contracts and methods are checked only when a method is given
  (a contract call). A plain NEAR transfer is limited by the amount rules
  only.
- Send NEAR counts a transfer as spent unless the wallet reports a
  failure, so a result we cannot read still counts toward the daily limit.
- The Scanner only looks at what you type. It does not read the
  blockchain, and a low score does not prove a transaction is safe.
- npm audit reports vulnerabilities in dependencies (mostly pulled in by
  the wallet packages). They are not reviewed yet.

## Network

Testnet only. Do not use an account that holds real funds.
## Enforced by NEAR vs shown by this app

This app does not create, add or remove any access keys today. The table
shows who would enforce each rule.

| Rule | Who enforces it |
| --- | --- |
| An agent can call only one contract | The NEAR protocol, if the agent holds a function-call key. Not built in this app yet. |
| An agent can call only listed methods | The NEAR protocol, same condition. |
| An agent cannot attach NEAR to a call | The NEAR protocol, same condition. |
| Per-transaction and daily NEAR limits | This app only. It shows a decision and does not stop anything on chain. |
| Risk scores and scam signals | This app only. Advice, not proof. |

Source for the first three rows: the NEAR access keys documentation
(docs.near.org, Access Keys page). Whether a contract of our own is
needed to enforce NEAR limits is our own design idea, not something
the documentation states.

## Dependency audit

Run on 2026-11-04 with npm audit (the full report).

- Production dependencies (npm audit --omit=dev): 16 (16 low, 0 moderate, 0 high, 0 critical).
- All dependencies including development tools: 28 (16 low, 12 moderate, 0 high, 0 critical).

Before our change the production audit listed 5 high findings
(decode-uri-component and nanoid, and the packages that depend on them).
package.json now has overrides that force nanoid 5.1.16 and
decode-uri-component 0.5.1. The second is newer than the version the
Meteor SDK asked for, so we checked Meteor sign-in by hand on testnet
again after the change.

What remains is low severity: the @near-js packages, near-api-js,
secp256k1 and elliptic (an advisory about a risky cryptographic
implementation that we have not read in detail). In the report we read,
npm's suggested fix for that chain was a forced change that installs
meteor-wallet 9.3.0. It is a breaking change, so we did not apply it.

Reachability: our own source does not import these packages directly
(checked with grep). We did not trace whether the wallet libraries call
vulnerable code with input an attacker controls, so we do not claim it
is unreachable. Our code never asks for or stores a seed phrase or
private key and never signs anything itself, but that does not prove the
risk is zero.

## Tests

Run all automated tests from the web folder (91 tests at the time of
writing: policy engine, scanner, agents, scam rules, key parsing, policy settings, send checks, central policy, browser storage):

    cd web
    node --test tests/*.test.ts

These tests check the rules in code. They do not test the wallet sign-in,
which we checked by hand, and they do not test anything on the blockchain.

## How to try it (judges)

Open https://near-ai-wallet-guardian.vercel.app. On a phone, switch the
browser to Desktop site. Your decisions, agent profiles and policy are saved in this browser.

1. Spending Limits: press Check transaction (Amount 2) and see APPROVED.
   Change Amount to 7 and see REQUIRES_APPROVAL. Change it to 40 and see
   BLOCKED with the reasons.
2. Transaction Scanner: Amount 1, Method add_full_access_key, press Scan.
   You see 90/100 CRITICAL with each rule listed.
3. Scam Detector: check wrap.neer and see HIGH (it looks like wrap.near).
   Check wrap.near and see NO SIGNS FOUND plus a list of what was not
   checked.
4. Activity History, Security Alerts and Dashboard: see the decisions
   from the steps above.
5. Wallet Security: press Connect wallet, choose Meteor Wallet with a
   testnet account, and see Connected with the account ID. Disconnect
   returns it to Not connected.
6. Permissions: shows who enforces each rule.
7. Send NEAR (Wallet Security, after you connect a testnet account that
   has testnet NEAR from the faucet): enter a testnet recipient and a
   small amount, press Review and check, read the policy decision, then
   press Send in my wallet and approve in Meteor. A BLOCKED review never
   opens the wallet.

## Built with, and AI disclosure

Track: AI Security & Defense.

Libraries: React, TypeScript, Vite, react-router-dom, lucide-react, buffer
(a browser polyfill) and the NEAR Wallet Selector packages (core,
modal-ui, react-hook, meteor-wallet).

AI assistance: the code in this repository was written with an AI coding
assistant (Claude) and run and tested by hand by the author.

Hackathon window: every commit in this repository is from 31 October 2026
or later. This is a new project and it does not reuse code from the
author's other projects.

