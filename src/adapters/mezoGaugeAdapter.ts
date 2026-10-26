import type { Epoch, Gauge } from '../domain/types'

export interface MezoGaugeAdapter {
  getEpoch(): Promise<Epoch>
  getGauges(): Promise<Gauge[]>
  getVeWeight(address: string): Promise<number>
  getExplorerUrl(hashOrAddress: string): string
}

export class DemoMezoGaugeAdapter implements MezoGaugeAdapter {
  constructor(private readonly epoch: Epoch, private readonly gauges: Gauge[], private readonly explorerBase = 'https://explorer.test.mezo.org') {}

  async getEpoch(): Promise<Epoch> {
    return this.epoch
  }

  async getGauges(): Promise<Gauge[]> {
    return this.gauges
  }

  async getVeWeight(_address: string): Promise<number> {
    return 12480
  }

  getExplorerUrl(hashOrAddress: string): string {
    return `${this.explorerBase}/address/${hashOrAddress}`
  }
}

// Live adapter boundary. Contract addresses and ABI are intentionally supplied at runtime
// after Mezo testnet verification; no placeholder address is presented as on-chain truth.
export interface LiveMezoConfig {
  chainId: 31611 | 31612
  rpcUrl: string
  gaugeControllerAddress: string
  gaugeAdapterAddress?: string
  bribeMarketAddress?: string
  tokenAddresses?: {
    MUSD: string
    MEZO: string
  }
  explorerBaseUrl: string
}

export const mezoTestnetDeployment = {
  chainId: 31611 as const,
  rpcUrl: 'https://rpc.test.mezo.org',
  bribeMarketAddress: '0xe378E93D5eC4dDa719355c5274d85e97c3a0A500',
  // Official Mezo Testnet VeBTCVoter. The previous mainnet PoolsVoter address
  // has no bytecode on chain 31611 and must not be used for live reads.
  gaugeControllerAddress: '0x72F8dd7F44fFa19E45955aa20A5486E8EB255738',
  gaugeAdapterAddress: '0x9E3439387B685FD4731Fdc7b3382B3348C03998a' as const,
  tokenAddresses: {
    MUSD: '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503',
    MEZO: '0x7B7c000000000000000000000000000000000001',
  },
  explorerBaseUrl: 'https://explorer.test.mezo.org',
} satisfies LiveMezoConfig
