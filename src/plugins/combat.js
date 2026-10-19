import { calculateStrike } from './balance.js'

export default {
  calculateDamage(attacker, defender, options = {}) {
    return calculateStrike(attacker, defender, options)
  },
  executeCombatRound(attacker, defender, options = {}) {
    attacker.combatRounds = ((attacker.combatRounds || 0) + 1) % 420 || 1
    const result = this.calculateDamage(attacker, defender, { round: attacker.combatRounds, ...options })
    defender.health = Math.max(0, defender.health - result.damage)
    return { ...result, remainingHealth: defender.health }
  }
}
