import { herbSeeds } from './worldContent.js'
import { addWorldLog } from './worldProgress.js'

const syncTotal = player => {
  player.world.garden.herbs = herbSeeds.reduce((sum, seed) => sum + player.props[seed.key], 0)
}

export const initializeHerbs = player => {
  const garden = player.world.garden
  for (const seed of herbSeeds) player.props[seed.key] ??= 0
  if (garden.herbVersion !== 1) {
    player.props.bloodGrass += Math.max(0, Math.floor(garden.herbs || 0))
    garden.herbVersion = 1
  }
  garden.pendingCultivation ??= 0
  syncTotal(player)
}

export const addHerbs = (player, id, count) => {
  initializeHerbs(player)
  const seed = herbSeeds.find(item => item.id === id)
  player.props[seed.key] += count
  syncTotal(player)
}

export const spendHerbs = (player, count, id) => {
  initializeHerbs(player)
  const seeds = id ? herbSeeds.filter(seed => seed.id === id) : herbSeeds
  if (seeds.reduce((sum, seed) => sum + player.props[seed.key], 0) < count) return false
  let remaining = count
  for (const seed of seeds) {
    const spent = Math.min(remaining, player.props[seed.key])
    player.props[seed.key] -= spent
    remaining -= spent
  }
  syncTotal(player)
  return true
}

export const healWithHerb = (player, id) => {
  initializeHerbs(player)
  const seed = id ? herbSeeds.find(item => item.id === id) : herbSeeds.find(item => player.props[item.key] > 0)
  if (!seed || !player.props[seed.key]) return '药草不足'
  if (player.health <= 0) return '气血耗尽，请先回营疗伤'
  if (player.health >= player.maxHealth) return '气血已经恢复'
  const healed = Math.min(player.maxHealth - player.health, Math.max(1, Math.round(player.maxHealth * seed.heal)))
  spendHerbs(player, 1, seed.id)
  player.health += healed
  addWorldLog(player, `服用${seed.name}，恢复 ${healed} 气血（药效：最大气血的 ${seed.heal * 100}%）。`, 'heal')
  return ''
}

export const autoHealWithHerbs = player => {
  const world = player.world
  if (world.mode !== 'hunt' || ['fighting', 'ready'].includes(world.trial?.status) || world.resting ||
    player.health <= 0 || player.health > player.maxHealth * 0.5 || (world.herbCooldown || 0) > 0) return false
  initializeHerbs(player)
  const seed = [...herbSeeds].reverse().find(item => player.props[item.key] > 0)
  if (!seed) return false
  healWithHerb(player, seed.id)
  world.herbCooldown = 3
  world.logs[0].text = '自动' + world.logs[0].text
  return true
}
