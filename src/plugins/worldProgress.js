import { maxLv, levelNames, cultivationCost } from './realms.js'
import { heavenlyFlames, worldMaps } from './douqiWorld.js'
import { baseAttributes, combatScore, syncExclusiveEquipment } from './balance.js'

export const currentMap = player => worldMaps.find(map => map.id === player.world.mapId) || worldMaps[0]
export const addWorldLog = (player, text, type = 'normal') => {
  player.world.logs.unshift({ text, type, time: Date.now() })
  player.world.logs.length = Math.min(player.world.logs.length, 80)
}

export const initializeCapacity = player => {
  if (player.world.capacityVersion === 1) return
  player.backpackCapacity += player.level * 50
  player.world.capacityVersion = 1
}

export const advanceAge = (player, elapsed) => {
  player.world.ageElapsed = (player.world.ageElapsed || 0) + Math.max(0, elapsed)
  const years = Math.floor(player.world.ageElapsed / 3600000)
  player.age += years
  player.world.ageElapsed %= 3600000
}

export const gainCultivation = (player, amount) => {
  initializeCapacity(player)
  if (player.level >= maxLv) return 0
  const gain = Math.max(0, Math.floor(amount))
  player.cultivation += gain
  player.world.sessions.cultivation += gain
  while (player.level < maxLv && player.cultivation >= player.maxCultivation) {
    const before = baseAttributes(player.level, player.reincarnation)
    player.cultivation -= player.maxCultivation
    player.level++
    player.backpackCapacity += 50
    player.points += 3
    const after = baseAttributes(player.level, player.reincarnation)
    player.attack += after.attack - before.attack
    player.defense += after.defense - before.defense
    player.maxHealth += after.health - before.health
    player.health = Math.min(player.maxHealth, player.health + after.health - before.health)
    player.maxCultivation = cultivationCost(player.level, player.reincarnation)
    addWorldLog(player, `斗气突破，晋入${levelNames(player.level)}。获得 3 点境界点。`, 'realm')
  }
  if (player.level === maxLv) player.cultivation = 0
  player.score = combatScore(player)
  return gain
}

export const grantFlame = (player, id, source) => {
  const fire = heavenlyFlames.find(item => item.id === id)
  if (!fire || fire.source.type !== source || player.world.flames.some(item => item.id === id)) return false
  player.world.flames.push({ id, refined: false, source, foundAt: Date.now() })
  syncExclusiveEquipment(player)
  addWorldLog(player, `获得${fire.rank > 23 ? '奇遇异火' : '异火榜第 ' + fire.rank}「${fire.name}」火种。炼化后，每次命中自动附带这道异火伤害。`, 'flame')
  return true
}
