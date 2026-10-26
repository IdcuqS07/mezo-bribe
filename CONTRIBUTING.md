# Contributing to MezoBribe

Thanks for helping improve MezoBribe. The project is an experimental Mezo Testnet prototype, not an audited production system.

## Development setup

Requirements: Node.js `>=22.12.0`, npm, and Foundry for Solidity work.

```bash
npm ci
npm run dev
```

The UI is available at `http://127.0.0.1:3000`.

## Required checks

Run the relevant checks before opening a pull request. The full CI set is:

```bash
npm run typecheck
npm test
npm run build
forge fmt --check
forge build
forge test -vv
```

Format Solidity changes with `forge fmt` before committing. Add or update tests when behavior changes, and keep README, deployment metadata, and UI demo/live boundaries accurate.

## Pull requests

- Keep each change focused and explain its user impact and any contract/security implications.
- Link the issue or discussion when one exists.
- Include tests for behavior changes and document any untested paths.
- Do not include deployment broadcasts, private keys, wallet seeds, keystores, API tokens, or `.env` files. Use `.env.example` for non-secret configuration examples.
- CI must not broadcast transactions or require wallet secrets.
- Do not describe testnet verification as an audit or production readiness.

See [SECURITY.md](SECURITY.md) for vulnerability reports.
