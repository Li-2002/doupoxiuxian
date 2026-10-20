import { worldMaps } from './douqiWorld.js'
import { regionRequirements } from './worldContent.js'
import { enemyAttributes } from './balance.js'
import { addWorldLog } from './worldProgress.js'
import { spendHerbs } from './herbs.js'
import { levelNames } from './realms.js'

export const initializeJourney = player => {
  if (player.world.journey) return
  const index = Math.max(0, worldMaps.findIndex(map => map.id === player.world.mapId && player.level >= map.min))
  player.world.journey = { unlocked: worldMaps.slice(0, index + 1).map(map => map.id), events: {} }
}

export const isRegionUnlocked = (player, id) => {
  initializeJourney(player)
  return player.world.journey.unlocked.includes(id)
}

export const cultivationEfficiency = (player, map = worldMaps.find(item => item.id === player.world.mapId) || worldMaps[0]) => {
  if (player.level < map.min || !isRegionUnlocked(player, map.id)) return 0
  return Math.max(0.05, 1 / (1 + Math.max(0, player.level - map.max) * 0.22) ** 2)
}

export const recordJourneyEvent = (player, event, choice) => {
  initializeJourney(player)
  player.world.journey.events[`${event.mapId}:${event.kind || 'meeting'}:${choice}`] = true
}

export const regionUnlockHint = (player, id) => {
  if (isRegionUnlocked(player, id)) return '已解锁'
  const index = worldMaps.findIndex(map => map.id === id)
  if (index < 1) return ''
  const map = worldMaps[index], previous = worldMaps[index - 1]
  if (!isRegionUnlocked(player, previous.id)) return `先解锁${previous.name}`
  if (player.level < map.min) return `需要${levelNames(map.min)}`
  return regionRequirements[id].text
}

export const completeRegionUnlock = (player, id) => {
  initializeJourney(player)
  const index = worldMaps.findIndex(map => map.id === id)
  if (index < 1 || player.level < worldMaps[index].min || !isRegionUnlocked(player, worldMaps[index - 1].id) || isRegionUnlocked(player, id)) return false
  player.world.journey.unlocked.push(id)
  addWorldLog(player, `${worldMaps[index].name}已解锁，可前往历练与修炼。`, 'realm')
  return true
}

export const unlockRegion = (player, id) => {
  const index = worldMaps.findIndex(map => map.id === id)
  if (index < 1) return '此地点无需解锁'
  if (isRegionUnlocked(player, id)) return '此地点已经解锁'
  const map = worldMaps[index], previous = worldMaps[index - 1], condition = regionRequirements[id]
  if (!isRegionUnlocked(player, previous.id) || player.level < map.min) return regionUnlockHint(player, id)
  if (player.world.encounter || player.world.opportunity || ['fighting', 'ready'].includes(player.world.trial?.status)) return '请先结束战斗或处理当前奇遇'
  if (condition.type === 'herbs') {
    if (!spendHerbs(player, condition.count, condition.seed)) return condition.text + '，当前药草不足'
  } else if (condition.type === 'event') {
    if (!player.world.journey.events[`${previous.id}:${condition.kind}:${condition.choice}`]) return condition.text
  } else {
    if (player.health < player.maxHealth * 0.5) return '气血不足一半，请先疗伤再挑战'
    player.world.mode = 'idle'
    player.world.resting = false
    player.world.lastTick = Date.now()
    player.world.encounter = { ...enemyAttributes(map.min, { health: 1.6, attack: 1.15, defense: 1 }), name: `${map.name}守关者`, kind: 'pass', unlock: id, rounds: 0 }
    addWorldLog(player, `开始挑战${map.name}守关者。获胜后解锁，失败可整备再战。`, 'combat')
    return ''
  }
  completeRegionUnlock(player, id)
  return ''
}
