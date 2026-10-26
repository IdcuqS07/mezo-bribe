import { BrowserProvider, Contract, formatUnits, getAddress, isAddress, parseUnits } from 'ethers'
import { mezoTestnetDeployment } from './mezoGaugeAdapter'
import type { TokenSymbol } from '../domain/types'

export interface WalletSession {
  address: string
  chainId: number
  isDemo: boolean
  balances: WalletBalances
}

export interface WalletBalances {
  btc: string
  musd: string
  mezo: string
}

export interface DepositReceipt {
  approvalHash: string
  depositHash: string
}

const MEZO_TESTNET_CHAIN = {
  chainId: '0x7b7b',
  chainName: 'Mezo Testnet',
  nativeCurrency: { name: 'BTC', symbol: 'BTC', decimals: 18 },
  rpcUrls: ['https://rpc.test.mezo.org'],
  blockExplorerUrls: ['https://explorer.test.mezo.org'],
}

const ERC20_ABI = [
  'function approve(address spender,uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
]

const BRIBE_MARKET_ABI = [
  'function epochs(uint256) view returns (uint8 status,uint64 depositClose,uint64 disputeEnds,bytes32 merkleRoot)',
  'function depositBribe(uint256 epoch,address gauge,address token,uint256 amount)',
]

function getEthereum(): EthereumProvider {
  if (!window.ethereum) throw new Error('No browser wallet detected. Install MetaMask or another EVM wallet.')
  return window.ethereum
}

export async function connectBrowserWallet(): Promise<WalletSession> {
  const ethereum = getEthereum()
  try {
    await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: MEZO_TESTNET_CHAIN.chainId }] })
  } catch (error) {
    if ((error as { code?: number }).code !== 4902) throw error
    await ethereum.request({ method: 'wallet_addEthereumChain', params: [MEZO_TESTNET_CHAIN] })
  }
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[]
  const address = accounts?.[0]
  if (!address || !isAddress(address)) throw new Error('Wallet did not return a valid EVM address.')
  const provider = new BrowserProvider(ethereum)
  const network = await provider.getNetwork()
  if (network.chainId !== 31611n) throw new Error('Please switch the wallet to Mezo Testnet (chain 31611).')
  const checksummedAddress = getAddress(address)
  return { address: checksummedAddress, chainId: 31611, isDemo: false, balances: await readWalletBalances(provider, checksummedAddress) }
}

export async function readWalletBalances(provider: BrowserProvider, address: string): Promise<WalletBalances> {
  const musd = new Contract(mezoTestnetDeployment.tokenAddresses.MUSD, ERC20_ABI, provider)
  const mezo = new Contract(mezoTestnetDeployment.tokenAddresses.MEZO, ERC20_ABI, provider)
  const [btc, musdBalance, mezoBalance] = await Promise.all([
    provider.getBalance(address),
    musd.balanceOf(address),
    mezo.balanceOf(address),
  ])
  return {
    btc: formatUnits(btc, 18),
    musd: formatUnits(musdBalance, 18),
    mezo: formatUnits(mezoBalance, 18),
  }
}

export async function depositBribeOnChain({
  epoch,
  gauge,
  token,
  amount,
}: {
  epoch: number
  gauge: string
  token: TokenSymbol
  amount: string
}): Promise<DepositReceipt> {
  if (!isAddress(gauge)) throw new Error('Enter a valid gauge or pool address before depositing.')
  const ethereum = getEthereum()
  const provider = new BrowserProvider(ethereum)
  const network = await provider.getNetwork()
  if (network.chainId !== 31611n) throw new Error('Wallet must be connected to Mezo Testnet (chain 31611).')
  const signer = await provider.getSigner()
  const amountWei = parseUnits(amount, 18)
  const tokenAddress = mezoTestnetDeployment.tokenAddresses[token]
  const market = new Contract(mezoTestnetDeployment.bribeMarketAddress, BRIBE_MARKET_ABI, signer)
  const epochConfig = await market.epochs(epoch) as { status: bigint; depositClose: bigint }
  if (epochConfig.status !== 0n || epochConfig.depositClose === 0n || BigInt(Math.floor(Date.now() / 1000)) >= epochConfig.depositClose) {
    throw new Error(`Epoch ${epoch} is not open on-chain yet. The owner must configure its deposit window.`)
  }
  const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer)
  const approval = await tokenContract.approve(mezoTestnetDeployment.bribeMarketAddress, amountWei)
  await approval.wait()
  const deposit = await market.depositBribe(epoch, gauge, tokenAddress, amountWei)
  await deposit.wait()
  return { approvalHash: approval.hash, depositHash: deposit.hash }
}

export function getWalletLabel(session: WalletSession | null): string {
  if (!session) return 'Connect wallet'
  return session.isDemo ? `${session.address} · demo` : session.address
}

interface EthereumProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>
}
