import { heavenlyFlames } from './douqiWorld.js'
import { combatSkills } from './worldContent.js'
import { isExclusiveEquipment } from './equipmentContent.js'

export const BALANCE_VERSION = 2
export const ENHANCE_STEP = 0.04
export const MAX_FLAME_BONUS = 0.55
export const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0))
export const combatScore = actor => Math.round(actor.attack * 1.5 + actor.defense * 1.2 + (actor.maxHealth ?? actor.health) * 0.2 +
  (actor.attack + actor.defense) * (clamp(actor.critical, 0, 0.5) + clamp(actor.dodge, 0, 0.35)) * 0.2)

export const baseAttributes = (level = 0, reincarnation = 0) => {
  const lv = clamp(level, 0, 102)
  const scale = 1 + Math.min(10, reincarnation) * 0.12
  return {
    attack: Math.round((24 + lv * 6 + lv * lv * 0.08) * scale),
    defense: Math.round((12 + lv * 3 + lv * lv * 0.04) * scale),
    health: Math.round((240 + lv * 48 + lv * lv * 0.7) * scale)
  }
}

export const equipmentAttributes = item => {
  const base = baseAttributes(item.level)
  const quality = { info: 1, success: 1.18, primary: 1.38, purple: 1.6, warning: 1.85, danger: 2.1, pink: 2.35 }[item.quality] || 1
  const seed = [...String(item.id || item.name)].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const roll = isExclusiveEquipment(item) ? 1.1 : 0.92 + seed % 17 / 100
  const budgets = {
    weapon: { attack: 0.36, defense: 0, health: 0, critical: 0.015, dodge: 0 },
    armor: { attack: 0, defense: 0.36, health: 0.28, critical: 0, dodge: 0 },
    accessory: { attack: 0.13, defense: 0.12, health: 0.12, critical: 0.01, dodge: 0.01 },
    sutra: { attack: 0.17, defense: 0.13, health: 0.10, critical: 0.01, dodge: 0.01 }
  }
  const budget = budgets[item.type] || budgets.weapon
  return Object.fromEntries(Object.entries(budget).map(([key, ratio]) => [key,
    key === 'critical' || key === 'dodge' ? Number((ratio * quality).toFixed(4)) : Math.round(base[key] * ratio * quality * roll)
  ]))
}

export const applyEquipmentBalance = item => {
  if (!item?.name) return item
  item.initial = equipmentAttributes(item)
  item.strengthen = clamp(item.strengthen, 0, 30)
  for (const key of ['attack', 'defense', 'health']) item[key] = Math.round(item.initial[key] * (1 + item.strengthen * ENHANCE_STEP))
  item.critical = item.initial.critical
  item.dodge = item.initial.dodge
  item.balanceVersion = BALANCE_VERSION
  item.score = combatScore(item)
  return item
}

export const applyCompanionBalance = item => {
  if (!item?.name) return item
  const base = baseAttributes(item.level, item.reincarnation)
  const aptitude = 1 + clamp(item.rootBone, 0, 50) / 200
  item.attack = Math.round(base.attack * 0.10 * aptitude)
  item.defense = Math.round(base.defense * 0.10 * aptitude)
  item.health = Math.round(base.health * 0.12 * aptitude)
  item.critical = 0.005
  item.dodge = 0.005
  item.score = combatScore(item)
  item.balanceVersion = BALANCE_VERSION
  return item
}

export const migrateBalance = player => {
  if (player.world.balanceVersion === BALANCE_VERSION) return false
  const companions = [player.pet, player.wife].filter(item => item?.name)
  const worn = Object.values(player.equipment).filter(item => item?.name)
  const all = [...worn, ...player.inventory, ...(player.shopData || []).flatMap(group => group.data || [group])]
  const oldHealth = player.maxHealth || 100
  const ratio = clamp(player.health / oldHealth, 0, 1)
  const oldBase = { attack: 10 + player.level * 7, defense: 10 + player.level * 4, health: 100 + player.level * 35 }
  const base = baseAttributes(player.level, player.reincarnation)
  const totalPoints = player.level * 3
  let remaining = totalPoints
  const allocations = {}
  for (const key of ['attack', 'defense', 'health']) {
    const current = key === 'health' ? oldHealth : player[key]
    const contribution = [...worn, ...companions].reduce((sum, item) => sum + (item[key] || 0), 0)
    allocations[key] = Math.min(remaining, Math.max(0, Math.round((current - contribution - oldBase[key]) / (key === 'health' ? 100 : 50))))
    remaining -= allocations[key]
  }
  for (const item of new Set(all)) applyEquipmentBalance(item)
  for (const item of new Set([...companions, ...(player.pets || []), ...(player.wifes || [])])) applyCompanionBalance(item)
  player.attack = base.attack + allocations.attack * 2
  player.defense = base.defense + allocations.defense
  player.maxHealth = base.health + allocations.health * 18
  player.critical = 0.05
  player.dodge = 0.03
  for (const item of [...worn, ...companions]) {
    player.attack += item.attack
    player.defense += item.defense
    player.maxHealth += item.health
    player.critical += item.critical
    player.dodge += item.dodge
  }
  player.health = Math.round(player.maxHealth * ratio)
  player.world.allocations = allocations
  player.world.balanceVersion = BALANCE_VERSION
  player.score = combatScore(player)
  return true
}

export const flameDamageProfile = player => {
  const refined = heavenlyFlames.filter(fire => player.world?.flames.some(owned => owned.id === fire.id && owned.refined))
  const raw = refined.reduce((sum, fire) => sum + fire.attack, 0)
  const total = MAX_FLAME_BONUS * (1 - Math.exp(-raw / MAX_FLAME_BONUS))
  return { total, parts: refined.map(fire => ({ id: fire.id, name: fire.name, rate: raw ? fire.attack * total / raw : 0 })) }
}

export const selectedSkill = (actor, round = 1) => {
  if (!actor.world) return { name: '普通攻击', coefficient: actor.skillCoefficient || 1 }
  const skill = combatSkills.find(item => item.id === actor.world.skillId)
  const trained = actor.world.skills?.[skill?.id] || 0
  const fires = actor.world.flames.filter(fire => fire.refined).length
  if (!skill || !trained || actor.level < skill.min || fires < (skill.flames || 0) || (round - 1) % (skill.cooldown + 1)) return { name: '普通攻击', coefficient: 1 }
  return { name: skill.name, coefficient: Math.min(2.5, skill.coefficient + (trained - 1) * 0.04) }
}

export const calculateStrike = (attacker, defender, { round = 1, random = Math.random } = {}) => {
  const skill = selectedSkill(attacker, round)
  if (random() < clamp(defender.dodge, 0, 0.35)) return { damage: 0, baseDamage: 0, flames: [], isCritical: false, isHit: false, skill: skill.name }
  const critical = random() < clamp(attacker.critical, 0, 0.5)
  const armorConstant = 60 + clamp(attacker.level, 0, 102) * 12
  const mitigation = Math.max(0.25, armorConstant / (armorConstant + Math.max(0, defender.defense || 0)))
  const baseDamage = Math.max(1, Math.floor(Math.max(1, attacker.attack) * skill.coefficient * mitigation * (critical ? 1.5 : 1)))
  const profile = flameDamageProfile(attacker)
  const extra = Math.floor(baseDamage * profile.total)
  const flames = profile.parts.map(fire => ({ ...fire, damage: Math.floor(baseDamage * fire.rate) }))
  let remainder = extra - flames.reduce((sum, fire) => sum + fire.damage, 0)
  for (const fire of [...flames].sort((a, b) => b.rate - a.rate)) if (remainder-- > 0) fire.damage++
  return { damage: baseDamage + extra, baseDamage, flames, isCritical: critical, isHit: true, skill: skill.name }
}

export const enemyAttributes = (level, { health = 0.9, attack = 0.92, defense = 0.75, scale = 1 } = {}) => {
  const base = baseAttributes(level)
  const hp = Math.round(base.health * health * scale)
  return { level, health: hp, maxHealth: hp, maxhealth: hp, attack: Math.round(base.attack * attack * scale),
    defense: Math.round(base.defense * defense * scale), dodge: 0.03, critical: 0.05 }
}
