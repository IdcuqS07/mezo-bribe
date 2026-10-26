export type TokenSymbol = 'MUSD' | 'MEZO'
export type EpochStatus = 'Open' | 'Voting closed' | 'Dispute' | 'Claims open'

export interface Bribe {
  id: string
  token: TokenSymbol
  amount: number
  priceUsd: number
  usdValue: number
  voteCount: number
  previousCostPerVote: number
  depositWindowOpen: boolean
  userOwned: boolean
}

export interface Gauge {
  id: string
  pool: string
  protocol: string
  dex: string
  symbol: string
  accent: string
  description: string
  address: string
  liveAddress?: string
  explorerUrl: string
  totalVotes: number
  previousVotes: number
  bribes: Bribe[]
  status: 'Active' | 'Ending soon' | 'Cancelled'
  updatedAt: string
}

export interface Epoch {
  id: string
  number: number
  status: EpochStatus
  epochDays: number
  daysRemaining: number
  endsAt: string
  totalBribeUsd: number
  gaugeCount: number
  lastUpdated: string
}

export interface Allocation {
  gaugeId: string
  percentage: number
  votes: number
  income: number
  marginal: number
  reason: string
}

export interface ClaimItem {
  id: string
  gaugeId: string
  gaugeName: string
  epochNumber: number
  token: TokenSymbol
  amount: number
  usdValue: number
  status: 'Available' | 'Claimed'
  proof: string
}

export interface DemoState {
  walletConnected: boolean
  walletAddress: string
  walletBalances?: {
    btc: string
    musd: string
    mezo: string
  }
  veWeight: number
  epoch: Epoch
  gauges: Gauge[]
  claims: ClaimItem[]
  lockedGaugeIds: string[]
  excludedGaugeIds: string[]
  voted: boolean
  depositedBribes: string[]
}
