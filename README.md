# Warden

(The repository is named AI Wallet Guardian.)

A security layer for NEAR Protocol that sits between a user, their AI
agents and their transactions. Built for the NEAR hackathon, AI Security
& Defense track.

Live demo: https://near-ai-wallet-guardian.vercel.app

## Status: what is real and what is not

This project is a work in progress. This table is the honest state of
every part.

| Part | Status |
| --- | --- |
| Policy engine (limits, allowed contracts and methods) | Works. Pure code, 12 automated tests. The Spending Limits page lets you edit the policy (its input checks have 8 tests). Decisions are app-level only. |
| Transaction Scanner (0-100 score with visible rules) | Works. Pure code, 10 automated tests. |
| AI Agents page (validated agent profiles) | Works in the browser only. 10 automated tests. |
| Activity History and Security Alerts | Works. Kept in memory, cleared on refresh. |
| Wallet page (NEAR Wallet Selector, Meteor, testnet) | Sign-in and sign-out checked by hand on testnet with Meteor Wallet. It shows the account ID and a read-only list of the account's access keys from the testnet RPC (checked by hand: our test account has 1 full-access key and 0 function-call keys). The Dashboard shows the wallet status as last seen on this page. |
| Dashboard | Real counts from this session's decision log, the number of enabled agent profiles, and the wallet status as last seen on Wallet Security. |
| Scam Detector (rules on the spelling of an account name) | Works, 11 automated tests. Reads nothing from the blockchain, uses no AI model, and cannot prove an account is safe or a scam. |
| Permissions | Explains who enforces each rule. Creates and changes no keys. |
| Settings | Light or dark theme (saved in the browser) and clearing the decision history. |
| AI model | Not used anywhere yet. |
| On-chain enforcement | Not built yet. See below. |

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

- The wallet picker can be hidden in a narrow phone layout. Switching the
  browser to desktop site shows it.
- Today's spending (12 NEAR) is a fixed demo value on the Spending
  Limits and Scanner pages, and the Scanner uses a fixed demo policy.
  Only the Spending Limits page lets you edit the policy.
- Agents and the activity log live in memory and are lost on refresh.
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

## Dependency audit (not fixed)

On 1 November 2026 we ran npm audit on production dependencies only
(npm audit --omit=dev). It reported 19 vulnerabilities (14 low, 5 high).
We have not fixed them. We read the first 40 lines of the report, not all
of it, and we have not looked at the 12 or so warnings in development
tools.

What we saw:

- decode-uri-component: denial of service on malformed input (high).
- nanoid: can loop forever on some invalid size values (high).
- elliptic: an advisory about a risky cryptographic implementation. We
  have not read the details.

All of them come in through the NEAR wallet packages and the Meteor
wallet SDK. The only fix npm offers is a forced downgrade of
meteor-wallet to 9.3.0. That is a breaking change and could break the
sign-in we tested by hand, so we did not apply it.

We have not checked whether our own code can reach the vulnerable code.
Our code never asks for or stores a seed phrase or private key and never
signs anything itself, but that does not prove the risk is zero.

## Tests

Run all automated tests from the web folder (57 tests at the time of
writing: policy engine, scanner, agents, scam rules, key parsing, policy settings):

    cd web
    node --test tests/*.test.ts

These tests check the rules in code. They do not test the wallet sign-in,
which we checked by hand, and they do not test anything on the blockchain.

## How to try it (judges)

Open https://near-ai-wallet-guardian.vercel.app. On a phone, switch the
browser to Desktop site. Do not refresh between steps: the log is kept in
memory.

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

