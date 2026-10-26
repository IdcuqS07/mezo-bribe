# BribeMarket Testnet Contract

`BribeMarket.sol` is a standalone bribe-escrow contract for MezoBribe. It accepts allowlisted ERC-20 tokens, records deposits per `(epoch, gauge, token)`, manages the epoch lifecycle, accepts Merkle roots from the publisher, and processes single or batch claims using the floor-rounding rules encoded in each leaf.

The contract deliberately avoids hardcoding Mezo's gauge ABI. `MezoGaugeAdapter` implements `IGaugeAdapter` against Mezo Testnet's official `VeBTCVoter` and is installed on the testnet BribeMarket. For `isGaugeValid(address)`, the adapter accepts either a gauge address directly or a pool key: it resolves the pool through `voter.gauges(pool)`, then requires the resolved address to be a registered, live gauge. The adapter also exposes `gaugeForPool` and `poolWeight`. The contract does not manage veMEZO or request approvals for NFTs or locks.

## Mezo Testnet Adapter

- Chain ID: `31611`; RPC: `https://rpc.test.mezo.org`
- BribeMarket: `0xe378E93D5eC4dDa719355c5274d85e97c3a0A500`
- Official VeBTCVoter: `0x72F8dd7F44fFa19E45955aa20A5486E8EB255738`
- Active MezoGaugeAdapter: `0x9E3439387B685FD4731Fdc7b3382B3348C03998a`
- Deployment transaction: `0x6df52be1e25194dce3cfa3d08640a56517702a533d78a484c667587bb4c86756`
- `setGaugeAdapter(address)` transaction: `0x7330ae76f6b683d88190407c01c400023d296bddc00fff294e573fea75fca115`
- Both transactions were included in block `16379346`; `BribeMarket.gaugeAdapter()` returns the adapter address above.
- RPC checks confirm that the MUSD/BTC and MUSD/mUSDC pool keys, along with their resolved gauges, are valid. A live refund transaction for an invalid gauge has not been tested.

This deployment is testnet-only. The contract has not been audited and is not production-ready.

## Local Checks

```bash
forge build
forge test -vv
```

## Mezo Testnet

- RPC: `https://rpc.test.mezo.org`
- Chain ID: `31611`
- Gas token: BTC
- Explorer: `https://explorer.test.mezo.org`
- Testnet MUSD: `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`
- MEZO: `0x7B7c000000000000000000000000000000000001`

Import a testnet-only deployer into a Foundry encrypted keystore using the interactive prompt. Keep the private key out of chat, source files, and shell history:

```bash
cast wallet import mezobribe-testnet --interactive
source .env
forge script script/Deploy.s.sol:DeployBribeMarket --rpc-url mezotestnet --account mezobribe-testnet --broadcast
```

Before broadcasting, review the printed deployer, chain ID, gas estimate, and contract address. Use a funded testnet-only deployer. The contract code has not been audited.
