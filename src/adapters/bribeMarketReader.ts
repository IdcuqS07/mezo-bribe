import { Contract, JsonRpcProvider } from 'ethers'
import type { Bribe, DemoState, Epoch, EpochStatus, Gauge } from '../domain/types'
import { mezoTestnetDeployment } from './mezoGaugeAdapter'

const BRIBE_MARKET_READ_ABI = [
  'function epochs(uint256) view returns (uint8 status,uint64 depositClose,uint64 disputeEnds,bytes32 merkleRoot)',
  'function allowedToken(address token) view returns (bool)',
  'function minimumDeposit(address token) view returns (uint256)',
  'function bribeTotal(uint256 epoch,address gauge,address token) view returns (uint256)',
]

const MEZO_VOTER_READ_ABI = [
  'function gauges(address pool) view returns (address)',
  'function weights(address pool) view returns (uint256)',
  'function isGauge(address gauge) view returns (bool)',
  'function isAlive(address gauge) view returns (bool)',
]

const ERC20_READ_ABI = ['function balanceOf(address account) view returns (uint256)']

const STATUS_LABELS: EpochStatus[] = ['Open', 'Voting closed', 'Dispute', 'Claims open']

const LIVE_POOL_CATALOG = [
  { id: 'pool-musd-btc', pool: 'MUSD / BTC', symbol: 'MB', accent: '#d8f56a', token1: 'BTC', address: '0xd16A5Df82120ED8D626a1a15232bFcE2366d6AA9' },
  { id: 'pool-musd-musdc', pool: 'MUSD / mUSDC', symbol: 'MM', accent: '#79d3d6', token1: 'mUSDC', address: '0x525F049A4494dA0a6c87E3C4df55f9929765Dc3e' },
  { id: 'pool-musd-musdt', pool: 'MUSD / mUSDT', symbol: 'MT', accent: '#f7b267', token1: 'mUSDT', address: '0x27414B76CF00E24ed087adb56E26bAeEEe93494e' },
] as const

export interface LiveMarketRead {
  epoch: Epoch
  allowedTokens: Record<'MUSD' | 'MEZO', boolean>
  minimumDeposits: Record<'MUSD' | 'MEZO', bigint>
  source: 'BribeMarket'
}

function formatCloseTime(timestamp: bigint): string {
  if (timestamp === 0n) return 'not configured'
  return new Date(Number(timestamp) * 1000).toISOString().replace('T', ' · ').replace('.000Z', ' UTC')
}

function daysRemaining(timestamp: bigint): number {
  if (timestamp === 0n) return 0
  return Math.max(0, (Number(timestamp) - Math.floor(Date.now() / 1000)) / 86400)
}

export function emptyReadState(): DemoState {
  return {
    walletConnected: false,
    walletAddress: '',
    veWeight: 0,
    epoch: {
      id: 'epoch-42', number: 42, status: 'Open', epochDays: 7, daysRemaining: 0,
      endsAt: 'Loading on-chain state…', totalBribeUsd: 0, gaugeCount: 0, lastUpdated: 'not loaded',
    },
    gauges: [], claims: [], lockedGaugeIds: [], excludedGaugeIds: [], voted: false, depositedBribes: [],
  }
}

export async function readBribeMarket(epochNumber = 42): Promise<LiveMarketRead> {
  const provider = new JsonRpcProvider(mezoTestnetDeployment.rpcUrl, mezoTestnetDeployment.chainId)
  const market = new Contract(mezoTestnetDeployment.bribeMarketAddress, BRIBE_MARKET_READ_ABI, provider)
  const [epochConfig, musdAllowed, mezoAllowed, musdMinimum, mezoMinimum] = await Promise.all([
    market.epochs(epochNumber),
    market.allowedToken(mezoTestnetDeployment.tokenAddresses.MUSD),
    market.allowedToken(mezoTestnetDeployment.tokenAddresses.MEZO),
    market.minimumDeposit(mezoTestnetDeployment.tokenAddresses.MUSD),
    market.minimumDeposit(mezoTestnetDeployment.tokenAddresses.MEZO),
  ])
  const status = STATUS_LABELS[Number(epochConfig.status)] ?? 'Open'
  return {
    epoch: {
      id: `epoch-${epochNumber}`,
      number: epochNumber,
      status,
      epochDays: 7,
      daysRemaining: daysRemaining(epochConfig.depositClose),
      endsAt: formatCloseTime(epochConfig.depositClose),
      totalBribeUsd: 0,
      gaugeCount: 0,
      lastUpdated: new Date().toISOString().replace('T', ' · ').replace('.000Z', ' UTC'),
    },
    allowedTokens: { MUSD: Boolean(musdAllowed), MEZO: Boolean(mezoAllowed) },
    minimumDeposits: { MUSD: BigInt(musdMinimum), MEZO: BigInt(mezoMinimum) },
    source: 'BribeMarket',
  }
}

export async function readAddressBalances(address: string): Promise<{ btc: string; musd: string; mezo: string }> {
  const provider = new JsonRpcProvider(mezoTestnetDeployment.rpcUrl, mezoTestnetDeployment.chainId)
  const musd = new Contract(mezoTestnetDeployment.tokenAddresses.MUSD, ERC20_READ_ABI, provider)
  const mezo = new Contract(mezoTestnetDeployment.tokenAddresses.MEZO, ERC20_READ_ABI, provider)
  const [btc, musdBalance, mezoBalance] = await Promise.all([
    provider.getBalance(address),
    musd.balanceOf(address),
    mezo.balanceOf(address),
  ])
  const format = (value: bigint) => (Number(value) / 1e18).toString()
  return { btc: format(btc), musd: format(musdBalance), mezo: format(mezoBalance) }
}

async function readLivePools(epochNumber: number, epoch: Epoch): Promise<Gauge[]> {
  const provider = new JsonRpcProvider(mezoTestnetDeployment.rpcUrl, mezoTestnetDeployment.chainId)
  const market = new Contract(mezoTestnetDeployment.bribeMarketAddress, BRIBE_MARKET_READ_ABI, provider)
  const voter = new Contract(mezoTestnetDeployment.gaugeControllerAddress, MEZO_VOTER_READ_ABI, provider)
  const rows: Array<Gauge | null> = await Promise.all(LIVE_POOL_CATALOG.map(async (pool): Promise<Gauge | null> => {
    const [liveGauge, totalVotes] = await Promise.all([
      voter.gauges(pool.address) as Promise<string>,
      voter.weights(pool.address) as Promise<bigint>,
    ])
    const gaugeAddress = liveGauge as string
    const isGauge = gaugeAddress !== '0x0000000000000000000000000000000000000000'
      ? Boolean(await voter.isGauge(gaugeAddress))
      : false
    const alive = isGauge ? Boolean(await voter.isAlive(gaugeAddress)) : false
    if (!isGauge || !alive) return null
    const [musdRaw, mezoRaw] = await Promise.all([
      market.bribeTotal(epochNumber, pool.address, mezoTestnetDeployment.tokenAddresses.MUSD),
      market.bribeTotal(epochNumber, pool.address, mezoTestnetDeployment.tokenAddresses.MEZO),
    ])
    const bribes: Bribe[] = []
    const musdAmount = Number(musdRaw) / 1e18
    const mezoAmount = Number(mezoRaw) / 1e18
    if (musdAmount > 0) bribes.push({ id: `${pool.id}-musd`, token: 'MUSD', amount: musdAmount, priceUsd: 1, usdValue: musdAmount, voteCount: 0, previousCostPerVote: 0, depositWindowOpen: epoch.status === 'Open', userOwned: false })
    if (mezoAmount > 0) bribes.push({ id: `${pool.id}-mezo`, token: 'MEZO', amount: mezoAmount, priceUsd: 0, usdValue: 0, voteCount: 0, previousCostPerVote: 0, depositWindowOpen: epoch.status === 'Open', userOwned: false })
    return {
      id: pool.id,
      pool: pool.pool,
      protocol: 'Mezo Pools',
      dex: 'Mezo Basic',
      symbol: pool.symbol,
      accent: pool.accent,
      description: `${pool.pool} is mapped to an active gauge in the official Mezo Testnet VeBTCVoter. Bribe totals are read from BribeMarket epoch ${epochNumber}.`,
      address: pool.address,
      liveAddress: gaugeAddress,
      explorerUrl: `${mezoTestnetDeployment.explorerBaseUrl}/address/${gaugeAddress}`,
      totalVotes: Number(totalVotes) / 1e18,
      previousVotes: 0,
      bribes,
      status: epoch.status === 'Open' ? 'Active' : 'Ending soon',
      updatedAt: epoch.lastUpdated,
    }
  }))
  return rows.filter((row): row is Gauge => row !== null)
}

export async function loadReadOnlyState(epochNumber = 42): Promise<DemoState> {
  const snapshot = await readBribeMarket(epochNumber)
  const walletBalances = await readAddressBalances('0x7119d53f0241F16c96b521ccF862473e18a29d6b')
  const gauges = await readLivePools(epochNumber, snapshot.epoch)
  return {
    ...emptyReadState(),
    epoch: { ...snapshot.epoch, gaugeCount: gauges.length, totalBribeUsd: gauges.reduce((sum, gauge) => sum + gauge.bribes.reduce((inner, bribe) => inner + bribe.usdValue, 0), 0) },
    gauges,
    walletBalances,
  }
}
