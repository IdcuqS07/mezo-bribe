import { strict as assert } from 'node:assert'
import { calculateAdvisor, incomeForVote } from '../src/domain/advisor.ts'
import { demoGauges } from '../src/domain/fixtures.ts'

const income = incomeForVote(1000, 10000, 1000)
assert.equal(Math.round(income * 100) / 100, 90.91)

const result = calculateAdvisor(demoGauges, 12480, ['curve-musd-btc'], ['curve-musd-eth'], 7)
const allocated = result.allocations.reduce((sum, item) => sum + item.votes, 0)
assert.ok(Math.abs(allocated - 12480) < 0.5, `allocated ${allocated} should equal ve weight`)
assert.equal(result.allocations.some((item) => item.gaugeId === 'curve-musd-eth'), false)
assert.ok(result.allocations.some((item) => item.gaugeId === 'curve-musd-btc'), 'locked gauge should receive a share')
assert.ok(result.totalIncome > 0)
console.log('advisor checks passed')
