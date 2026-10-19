import { createWorldState } from '../src/plugins/douqiWorld.js'
import { baseAttributes, applyEquipmentBalance } from '../src/plugins/balance.js'
import { cultivationCost } from '../src/plugins/realms.js'

export const makePlayer = (level = 0) => {
  const base = baseAttributes(level)
  return { level, reincarnation: 0, cultivation: 0, maxCultivation: cultivationCost(level), points: level * 3, taskNum: 0,
    attack: base.attack, defense: base.defense, health: base.health, maxHealth: base.health, dodge: 0.03, critical: 0.05,
    inventory: [], equipment: { weapon: {}, armor: {}, accessory: {}, sutra: {} },
    props: { money: 0, strengtheningStone: 0, cultivateDan: 0, yellowStone: 0, blackStone: 0, earthStone: 0, heavenStone: 0, saintStone: 0, emperorStone: 0 },
    backpackCapacity: 50, shopData: [], world: createWorldState(), pets: [], pet: {}, wifes: [], wife: {}, npcs: [] }
}
export const makeItem = (type = 'weapon', level = 1, quality = 'info', strengthen = 0) =>
  applyEquipmentBalance({ id: `${type}-${level}-${quality}`, name: '测试' + type, type, level, quality, strengthen, lock: false })

export const wearSet = (player, quality = 'purple', strengthen = 5) => {
  for (const type of ['weapon', 'armor', 'accessory', 'sutra']) {
    const item = makeItem(type, player.level, quality, strengthen)
    player.equipment[type] = item
    player.attack += item.attack
    player.defense += item.defense
    player.maxHealth += item.health
    player.critical += item.critical
    player.dodge += item.dodge
  }
  player.health = player.maxHealth
  return player
}
export const seededRandom = seed => () => {
  seed = (Math.imul(1664525, seed) + 1013904223) >>> 0
  return seed / 4294967296
}
