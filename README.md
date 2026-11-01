# AI Wallet Guardian

A security layer for NEAR Protocol that sits between a user, their AI
agents and their transactions. Built for the NEAR hackathon, AI Security
& Defense track.

Live demo: add your Vercel link here.

## Status: what is real and what is not

This project is a work in progress. This table is the honest state of
every part.

| Part | Status |
| --- | --- |
| Policy engine (limits, allowed contracts and methods) | Works. Pure code, 12 automated tests. |
| Transaction Scanner (0-100 score with visible rules) | Works. Pure code, 10 automated tests. |
| AI Agents page (validated agent profiles) | Works in the browser only. 10 automated tests. |
| Activity History and Security Alerts | Works. Kept in memory, cleared on refresh. |
| Wallet page (NEAR Wallet Selector, Meteor, testnet) | The page loads and the wallet picker opens. Sign-in has not been verified yet. |
| Dashboard | Demo data, clearly labelled. |
| Permissions, Scam Detector, Settings | Not built yet. |
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
- Sign-in with a wallet is not verified yet.
- The policy values and today's spending on the Spending Limits and
  Scanner pages are fixed demo values.
- Agents and the activity log live in memory and are lost on refresh.
- The Scanner only looks at what you type. It does not read the
  blockchain, and a low score does not prove a transaction is safe.
- npm audit reports vulnerabilities in dependencies (mostly pulled in by
  the wallet packages). They are not reviewed yet.

## Network

Testnet only. Do not use an account that holds real funds.
