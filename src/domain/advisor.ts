import type { Allocation, Gauge } from './types'

export interface AdvisorResult {
  allocations: Allocation[]
  totalIncome: number
  annualizedIncome: number
  apy: number
}

export function incomeForVote(bribeUsd: number, existingVotes: number, ownVotes: number): number {
  if (ownVotes <= 0 || bribeUsd <= 0) return 0
  return (bribeUsd * ownVotes) / Math.max(existingVotes + ownVotes, 1)
}

function marginalIncome(bribeUsd: number, existingVotes: number, ownVotes: number): number {
  const baseVotes = Math.max(existingVotes, 1)
  return (bribeUsd * baseVotes) / Math.pow(baseVotes + ownVotes, 2)
}

export function calculateAdvisor(
  gauges: Gauge[],
  totalWeight: number,
  lockedGaugeIds: string[] = [],
  excludedGaugeIds: string[] = [],
  epochDays = 7,
): AdvisorResult {
  const eligible = gauges.filter((gauge) => gauge.status !== 'Cancelled' && !excludedGaugeIds.includes(gauge.id))
  if (eligible.length === 0 || totalWeight <= 0) {
    return { allocations: [], totalIncome: 0, annualizedIncome: 0, apy: 0 }
  }

  const votes = new Map<string, number>(eligible.map((gauge) => [gauge.id, 0]))
  const locked = eligible.filter((gauge) => lockedGaugeIds.includes(gauge.id))
  const minimumLocked = locked.length > 0 ? Math.max(totalWeight * 0.14, 1) : 0
  for (const gauge of locked) votes.set(gauge.id, minimumLocked)

  const remaining = Math.max(totalWeight - minimumLocked * locked.length, 0)
  const steps = Math.max(120, Math.min(600, Math.round(remaining / 2)))
  const increment = steps > 0 ? remaining / steps : 0

  for (let index = 0; index < steps; index += 1) {
    const candidate = eligible.reduce((best, gauge) => {
      const bestGauge = best ?? gauge
      const bestValue = marginalIncome(bestGauge.bribes.reduce((sum, bribe) => sum + bribe.usdValue, 0), bestGauge.totalVotes, votes.get(bestGauge.id) ?? 0)
      const value = marginalIncome(gauge.bribes.reduce((sum, bribe) => sum + bribe.usdValue, 0), gauge.totalVotes, votes.get(gauge.id) ?? 0)
      return value > bestValue ? gauge : bestGauge
    }, undefined as Gauge | undefined)
    if (candidate) votes.set(candidate.id, (votes.get(candidate.id) ?? 0) + increment)
  }

  const allocations = eligible
    .map((gauge) => {
      const ownVotes = votes.get(gauge.id) ?? 0
      const bribeUsd = gauge.bribes.reduce((sum, bribe) => sum + bribe.usdValue, 0)
      const income = incomeForVote(bribeUsd, gauge.totalVotes, ownVotes)
      const percentage = totalWeight > 0 ? (ownVotes / totalWeight) * 100 : 0
      const dilution = ownVotes / Math.max(gauge.totalVotes + ownVotes, 1)
      const reason = lockedGaugeIds.includes(gauge.id)
        ? 'Locked by you · protected allocation'
        : `${bribeUsd.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} pool with ${(dilution * 100).toFixed(1)}% self-dilution`
      return {
        gaugeId: gauge.id,
        percentage,
        votes: ownVotes,
        income,
        marginal: marginalIncome(bribeUsd, gauge.totalVotes, ownVotes),
        reason,
      }
    })
    .filter((allocation) => allocation.votes > 0.01)
    .sort((a, b) => b.income - a.income)

  const totalIncome = allocations.reduce((sum, allocation) => sum + allocation.income, 0)
  const annualizedIncome = totalIncome * (365 / Math.max(epochDays, 1))
  const apy = totalWeight > 0 ? (annualizedIncome / (totalWeight * 0.012)) * 100 : 0
  return { allocations, totalIncome, annualizedIncome, apy }
}
