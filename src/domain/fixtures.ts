import type { ClaimItem, DemoState, Epoch, Gauge } from './types'

const explorer = 'https://explorer.test.mezo.org'

export const demoEpoch: Epoch = {
  id: 'epoch-42',
  number: 42,
  status: 'Open',
  epochDays: 7,
  daysRemaining: 2,
  endsAt: 'Thursday, 30 Oct · 18:00 UTC',
  totalBribeUsd: 24890,
  gaugeCount: 4,
  lastUpdated: '26 Oct 2026, 10:58 UTC',
}

export const demoGauges: Gauge[] = [
  {
    id: 'curve-musd-btc', pool: 'MUSD / BTC', protocol: 'MUSD', dex: 'Curve', symbol: 'CB', accent: '#D8F56A',
    description: 'Deep stablecoin liquidity for the MUSD borrowing market.', address: '0x71c4…9aa2', liveAddress: '0xd16A5Df82120ED8D626a1a15232bFcE2366d6AA9', explorerUrl: explorer,
    totalVotes: 186400, previousVotes: 172900, status: 'Active', updatedAt: '2 min ago',
    bribes: [
      { id: 'cb-musd', token: 'MUSD', amount: 8200, priceUsd: 1, usdValue: 8200, voteCount: 186400, previousCostPerVote: 0.038, depositWindowOpen: true, userOwned: false },
      { id: 'cb-mezo', token: 'MEZO', amount: 6900, priceUsd: 0.42, usdValue: 2898, voteCount: 186400, previousCostPerVote: 0.012, depositWindowOpen: true, userOwned: false },
    ],
  },
  {
    id: 'aero-musd-usdc', pool: 'MUSD / USDC', protocol: 'MUSD', dex: 'Aerodrome', symbol: 'AD', accent: '#79D3D6',
    description: 'A concentrated stable pair for efficient MUSD routing.', address: '0x0d8f…31c0', liveAddress: '0x525F049A4494dA0a6c87E3C4df55f9929765Dc3e', explorerUrl: explorer,
    totalVotes: 132800, previousVotes: 119400, status: 'Ending soon', updatedAt: '2 min ago',
    bribes: [
      { id: 'ad-musd', token: 'MUSD', amount: 6500, priceUsd: 1, usdValue: 6500, voteCount: 132800, previousCostPerVote: 0.041, depositWindowOpen: true, userOwned: true },
      { id: 'ad-mezo', token: 'MEZO', amount: 4100, priceUsd: 0.42, usdValue: 1722, voteCount: 132800, previousCostPerVote: 0.010, depositWindowOpen: true, userOwned: true },
    ],
  },
  {
    id: 'uni-musd-wbtc', pool: 'MUSD / WBTC', protocol: 'MUSD', dex: 'Uniswap', symbol: 'UN', accent: '#F5B95B',
    description: 'Long-tail liquidity route with a growing bribe signal.', address: '0x8e2a…1b57', explorerUrl: explorer,
    totalVotes: 98600, previousVotes: 104200, status: 'Active', updatedAt: '2 min ago',
    bribes: [
      { id: 'un-musd', token: 'MUSD', amount: 3200, priceUsd: 1, usdValue: 3200, voteCount: 98600, previousCostPerVote: 0.027, depositWindowOpen: true, userOwned: false },
      { id: 'un-mezo', token: 'MEZO', amount: 5400, priceUsd: 0.42, usdValue: 2268, voteCount: 98600, previousCostPerVote: 0.021, depositWindowOpen: true, userOwned: false },
    ],
  },
  {
    id: 'curve-musd-eth', pool: 'MUSD / ETH', protocol: 'MUSD', dex: 'Curve', symbol: 'CE', accent: '#AFA8FF',
    description: 'Volatile pair with lower competition and a higher clearing price.', address: '0x4fa1…cc90', explorerUrl: explorer,
    totalVotes: 76400, previousVotes: 71300, status: 'Active', updatedAt: '2 min ago',
    bribes: [
      { id: 'ce-musd', token: 'MUSD', amount: 3600, priceUsd: 1, usdValue: 3600, voteCount: 76400, previousCostPerVote: 0.039, depositWindowOpen: true, userOwned: false },
    ],
  },
]

export const demoClaims: ClaimItem[] = [
  { id: 'claim-1', gaugeId: 'curve-musd-btc', gaugeName: 'MUSD / BTC', epochNumber: 41, token: 'MUSD', amount: 184.62, usdValue: 184.62, status: 'Available', proof: '0xa2c1…9f10' },
  { id: 'claim-2', gaugeId: 'aero-musd-usdc', gaugeName: 'MUSD / USDC', epochNumber: 41, token: 'MEZO', amount: 392.48, usdValue: 164.84, status: 'Available', proof: '0x84be…22d1' },
  { id: 'claim-3', gaugeId: 'uni-musd-wbtc', gaugeName: 'MUSD / WBTC', epochNumber: 40, token: 'MUSD', amount: 67.14, usdValue: 67.14, status: 'Claimed', proof: '0xf7a8…c11e' },
]

export const initialDemoState: DemoState = {
  walletConnected: false,
  walletAddress: '',
  veWeight: 12480,
  epoch: demoEpoch,
  gauges: demoGauges,
  claims: demoClaims,
  lockedGaugeIds: ['curve-musd-btc'],
  excludedGaugeIds: [],
  voted: false,
  depositedBribes: [],
}
