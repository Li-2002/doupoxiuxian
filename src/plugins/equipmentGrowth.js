import equip from './equip.js'
import { applyEquipmentBalance, combatScore, clamp, syncExclusiveEquipment } from './balance.js'
import { exclusiveEquipment, isExclusiveEquipment, craftingQualities } from './equipmentContent.js'
import { stoneTiers } from './douqiWorld.js'
import { hasActiveTrial } from './worldActivities.js'
import { addWorldLog } from './worldProgress.js'
import { levelNames } from './realms.js'

const generators = { weapon: 'equip_Weapons', armor: 'equip_Armors', accessory: 'equip_Accessorys', sutra: 'equip_Sutras' }
const gearLevel = player => clamp(Math.floor(player.level), 1, 102)
const combatGuard = player => hasActiveTrial(player) || player.world.encounter ? '请先结束战斗再整备装备' : ''
const owns = (player, item) => !!item?.name && (player.inventory.includes(item) || player.equipment[item.type] === item)
const hasSpace = (player, count) => player.inventory.length + count <= player.backpackCapacity

export const salvageQualities = [
  { quality: 'info', name: '白色' }, { quality: 'success', name: '绿色' }, { quality: 'primary', name: '蓝色' },
  { quality: 'purple', name: '紫色' }, { quality: 'warning', name: '橙色' }, { quality: 'danger', name: '红色' }, { quality: 'pink', name: '粉色' }
]
export const salvagePreview = (player, quality) => {
  const cutoff = salvageQualities.findIndex(entry => entry.quality === quality)
  const items = player.inventory.filter(item => {
    const rank = salvageQualities.findIndex(entry => entry.quality === item.quality)
    return rank >= 0 && rank < cutoff && !item.lock && !isExclusiveEquipment(item) &&
      !Object.values(player.equipment).some(worn => worn === item || (worn?.id && worn.id === item.id))
  })
  return { items, money: items.length, stones: items.reduce((sum, item) => sum + Math.floor(item.level * (1 + player.reincarnation / 10)), 0) }
}
export const salvageBelow = (player, quality) => {
  if (combatGuard(player)) return combatGuard(player)
  const preview = salvagePreview(player, quality)
  if (!preview.items.length) return '没有可分解的装备，所选品质本身、锁定与专属装备均会保留'
  player.inventory = player.inventory.filter(item => !preview.items.includes(item))
  player.props.money += preview.money
  player.props.strengtheningStone += preview.stones
  addWorldLog(player, `一键分解 ${preview.items.length} 件装备，获得 ${preview.stones} 炼器石、${preview.money} 灵石。`, 'equipment')
  return ''
}

export const createStarterPack = (mode = 'normal', random = Math.random) => {
  const types = Object.keys(generators)
  const red = []
  if (mode === 'red') {
    const pool = [...types]
    for (let i = 0; i < 2; i++) red.push(pool.splice(Math.floor(random() * pool.length), 1)[0])
  }
  return types.map(type => equip[generators[type]](1, false, red.includes(type) ? 'danger' : undefined))
}

export const claimStarterPack = (player, pack) => {
  if (combatGuard(player)) return combatGuard(player)
  if (player.isNewbie) return '新手礼包已经领取过了'
  if (pack.length !== 4 || new Set(pack.map(item => item.type)).size !== 4 ||
    pack.some(item => !generators[item.type] || item.level !== 1 || isExclusiveEquipment(item))) return '请先刷新一套新手装备'
  if (!hasSpace(player, 4)) return '背包空间不足，请空出四格后领取'
  player.inventory.push(...pack)
  player.isNewbie = true
  return ''
}

export const redeemExclusiveSet = (player, code) => {
  if (combatGuard(player)) return combatGuard(player)
  if (String(code).trim() !== 'dwdldhsglqfkssjqd') return '兑换码不正确'
  if (player.world.exclusiveRedeemed) return '这份存档已经兑换过专属套装'
  if (!hasSpace(player, 4)) return '背包空间不足，请空出四格后兑换'
  const items = exclusiveEquipment.map(entry => applyEquipmentBalance({
    id: globalThis.crypto.randomUUID(), exclusiveId: entry.id, name: entry.name, type: entry.type,
    level: gearLevel(player), quality: 'danger', strengthen: 0, lock: true
  }))
  player.inventory.push(...items)
  syncExclusiveEquipment(player)
  player.world.exclusiveRedeemed = true
  addWorldLog(player, '专属四件套已存入行囊并锁定：文葬镰刀、监兵凶神、火链、人皇幡。', 'equipment')
  return ''
}

export const craftCost = (player, quality) => {
  const recipe = craftingQualities.find(entry => entry.quality === quality)
  if (!recipe) return null
  const index = craftingQualities.indexOf(recipe) + 1
  return { stone: stoneTiers[recipe.tier], count: 3 * index,
    essence: (8 + gearLevel(player) * 2) * index, money: (40 + gearLevel(player) * 12) * index }
}

const pay = (player, cost) => {
  if (player.props.money < cost.money) return '灵石不足'
  if (player.props.strengtheningStone < cost.essence) return '炼器石不足，可分解闲置装备获取'
  if (cost.stone && (player.props[cost.stone.key] || 0) < cost.count) return cost.stone.name + '不足'
  player.props.money -= cost.money
  player.props.strengtheningStone -= cost.essence
  if (cost.stone) player.props[cost.stone.key] -= cost.count
  return ''
}

export const craftEquipment = (player, type, quality) => {
  if (combatGuard(player)) return combatGuard(player)
  if (!generators[type]) return '请选择装备部位'
  const recipe = craftingQualities.find(entry => entry.quality === quality)
  if (!recipe) return '该品质无法定向打造'
  if (player.level < recipe.min) return '打造境界不足，需要' + levelNames(recipe.min)
  if (!hasSpace(player, 1)) return '背包空间不足'
  const error = pay(player, craftCost(player, quality))
  if (error) return error
  const item = equip[generators[type]](gearLevel(player), false, quality)
  player.inventory.push(item)
  addWorldLog(player, '定向打造获得「' + item.name + '」，已存入行囊。', 'equipment')
  return ''
}

export const ascensionCost = (player, item) => {
  const target = gearLevel(player)
  const delta = Math.max(0, target - item.level)
  const tier = target < 18 ? 0 : target < 36 ? 1 : target < 54 ? 2 : target < 72 ? 3 : target < 93 ? 4 : 5
  return { target, stone: stoneTiers[tier], count: Math.ceil(delta / 3), essence: delta * 4,
    money: 6 * delta * (item.level + target + 1) }
}

const updateWorn = (player, changes) => {
  for (const { item, before } of changes) {
    if (player.equipment[item.type] !== item) continue
    for (const key of ['attack', 'defense', 'critical', 'dodge']) player[key] += item[key] - before[key]
    player.maxHealth += item.health - before.health
  }
  player.health = Math.min(player.health, player.maxHealth)
  player.score = combatScore(player)
}

export const ascendEquipment = (player, item) => {
  if (combatGuard(player)) return combatGuard(player)
  if (!owns(player, item)) return '装备不存在'
  if (!isExclusiveEquipment(item)) return '普通装备仅可强化，只有专属装备可以提升境界'
  const cost = ascensionCost(player, item)
  if (item.level >= cost.target) return '装备已达到当前境界，无需提升'
  const error = pay(player, cost)
  if (error) return error
  const before = { ...item }
  item.level = cost.target
  applyEquipmentBalance(item)
  updateWorn(player, [{ item, before }])
  addWorldLog(player, '「' + item.name + '」提升至' + levelNames(item.level) + '，品质与强化保留。', 'equipment')
  return ''
}

export const transferCost = (target, source) => ({
  money: 20 * Math.max(1, target.level) * (source?.strengthen || 0), essence: 2 * (source?.strengthen || 0)
})

export const transferEnhancement = (player, target, source) => {
  if (combatGuard(player)) return combatGuard(player)
  if (!owns(player, target) || !owns(player, source)) return '装备不存在'
  if (target === source || target.type !== source.type) return '只能在两件同部位装备之间传承'
  if (source.lock) return '来源装备已锁定，请先在行囊解锁'
  if ((source.strengthen || 0) <= (target.strengthen || 0)) return '来源装备需要更高的强化等级'
  const error = pay(player, transferCost(target, source))
  if (error) return error
  const changes = [target, source].map(item => ({ item, before: { ...item } }))
  target.strengthen = source.strengthen
  source.strengthen = 0
  applyEquipmentBalance(target)
  applyEquipmentBalance(source)
  updateWorn(player, changes)
  addWorldLog(player, '强化已传承至「' + target.name + '」+' + target.strengthen + '，来源「' + source.name + '」归零并保留。', 'equipment')
  return ''
}
