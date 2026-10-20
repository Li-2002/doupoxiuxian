import equip from './equip.js'
import { maxLv, levelNames, cultivationCost, cultivationPerTick } from './realms.js'
import { createWorldState, worldMaps, worldNpcs, heavenlyFlames, stoneTiers } from './douqiWorld.js'
import { migrateBalance, flameDamageProfile, calculateStrike, enemyAttributes, applyEquipmentBalance, combatScore, syncExclusiveEquipment } from './balance.js'
import { hasActiveTrial, trialStep, meetNpc, changeAffinity, createWildEvent, resolveOpportunity, settleGardenCultivation } from './worldActivities.js'
import { initializeHerbs, autoHealWithHerbs } from './herbs.js'
import { addWorldLog, gainCultivation, currentMap, grantFlame, initializeCapacity } from './worldProgress.js'
import { initializeJourney, isRegionUnlocked, cultivationEfficiency, completeRegionUnlock } from './journey.js'
export { addWorldLog, gainCultivation, currentMap } from './worldProgress.js'
export { resolveOpportunity } from './worldActivities.js'

export const WORLD_TICK = 2000
export const MAX_OFFLINE_TICKS = 4 * 60 * 60 * 1000 / WORLD_TICK

export const initializeWorld = player => {
  if (!player.world) {
    const ratio = Math.min(1, player.cultivation / (player.maxCultivation || 100))
    player.level = Math.round(Math.min(144, player.level) * maxLv / 144)
    const items = [...player.inventory, ...Object.values(player.equipment), ...(player.shopData || []).flatMap(group => group.data || [group])]
    for (const item of new Set(items)) if (item?.name) item.level = Math.round(Math.min(144, item.level) * maxLv / 144)
    player.maxCultivation = cultivationCost(player.level, player.reincarnation)
    player.cultivation = Math.floor(ratio * player.maxCultivation)
    player.world = createWorldState()
    player.world.balanceVersion = 0
    addWorldLog(player, '已踏入斗气大陆，原有装备、法宝、灵宠与道侣均已保留。', 'realm')
  }
  const world = player.world
  initializeCapacity(player)
  initializeJourney(player)
  if (world.progressionVersion !== 1) {
    const ratio = Math.min(1, player.cultivation / (player.maxCultivation || 100))
    player.maxCultivation = cultivationCost(player.level, player.reincarnation)
    player.cultivation = Math.floor(player.maxCultivation * ratio)
    world.progressionVersion = 1
  }
  if (world.autoNpcVersion !== 1) { world.autoNpc = false; world.autoNpcVersion = 1 }
  world.exclusiveRedeemed ??= false
  if (world.version < 2) {
    const defaults = createWorldState()
    for (const [key, value] of Object.entries(defaults)) if (world[key] === undefined) world[key] = value
    world.balanceVersion = 0
    world.encounter = null
    world.opportunity = null
    for (const [id, value] of Object.entries(world.relationships)) {
      world.social[id] = { affinity: Math.min(1000, value * 10), metAt: Date.now(), partner: false, lastGiftAt: 0 }
      world.relationships[id] = world.social[id].affinity
    }
    world.version = 2
    addWorldLog(player, '异火获取与属性体系已更新，旧物品和收集进度保留；战斗数值已统一重算。', 'system')
  }
  const retiredFlame = world.flames.find(fire => fire.id === 'starlight')
  if (retiredFlame) {
    world.flames = world.flames.filter(fire => fire.id !== 'starlight')
    if (retiredFlame.refined) player.props.money += 2800
    addWorldLog(player, `星灯离尘火已移出图鉴。${retiredFlame.refined ? '已返还 2800 炼化灵石。' : ''}通关心炎深渊获得陨落心炎，炼化后可加快修炼。`, 'system')
  }
  if (world.activeFlame === 'starlight') world.activeFlame = ''
  if (world.opportunityProgress) delete world.opportunityProgress.starlight
  for (const stone of stoneTiers) player.props[stone.key] ??= 0
  initializeHerbs(player)
  world.herbCooldown ??= 0
  if (world.mode === 'both') {
    world.mode = 'idle'
    world.lastTick = Date.now()
    addWorldLog(player, '同修模式已取消，挂机已停止。请选择自动打怪或自动修炼。', 'system')
  }
  migrateBalance(player)
  syncExclusiveEquipment(player)
  player.score = combatScore(player)
  for (const npc of worldNpcs) {
    if (player.wife?.name === npc.name || player.wifes?.some(item => item.name === npc.name)) {
      const relation = meetNpc(player, npc.id)
      relation.partner = true
      relation.affinity = 1000
      world.relationships[npc.id] = 1000
      if (npc.id === 'xuner') grantFlame(player, 'goldemperor', 'bond')
    }
  }
  return world
}

export const flameBonuses = player => {
  const profile = flameDamageProfile(player)
  const raw = heavenlyFlames.filter(fire => player.world.flames.some(owned => owned.id === fire.id && owned.refined)).reduce((sum, fire) => sum + fire.cultivation, 0)
  return { attack: profile.total, cultivation: 0.35 * (1 - Math.exp(-raw / 0.35)) }
}

export const cultivateTick = player => {
  if (player.world.mode === 'hunt' || player.world.encounter || player.world.opportunity || hasActiveTrial(player)) return
  const mentors = Object.values(player.world.relationships).filter(value => value >= 600).length
  gainCultivation(player, cultivationPerTick(player.level) * (1 + flameBonuses(player).cultivation + Math.min(0.2, mentors * 0.025)) * cultivationEfficiency(player))
  if (!player.world.encounter) player.health = Math.min(player.maxHealth, player.health + Math.max(2, Math.floor(player.maxHealth * 0.01)))
}

export const setAutomation = (player, mode, now = Date.now()) => {
  if (!['idle', 'hunt', 'cultivate'].includes(mode)) return
  if (mode === 'cultivate' && (player.world.encounter || player.world.opportunity)) return '请先完成战斗或处理野外奇遇，再开启修炼'
  if (mode !== 'idle' && hasActiveTrial(player)) {
    const error = '试炼中无法开启挂机修炼或野外打怪，请先结束试炼。'
    addWorldLog(player, error, 'system')
    return error
  }
  player.world.mode = mode
  if (mode === 'cultivate') {
    player.world.encounter = null
    player.world.opportunity = null
    player.world.resting = false
  }
  player.world.lastTick = now
  const names = { idle: '已停止挂机', hunt: '已开启自动打怪', cultivate: '已开启自动修炼，野外历练已停止' }
  addWorldLog(player, names[mode], 'system')
}

export const automationStatus = (player, paused = false) => {
  const world = player.world
  if (world.mode === 'cultivate') return '正在自动修炼'
  if (world.mode !== 'hunt') return '当前为手动模式'
  if (paused) return '自动打怪已暂停 · 传统战斗进行中'
  if (world.resting) return '正在自动打怪 · 营地疗伤中'
  if (world.opportunity && !world.autoNpc) return '正在自动打怪 · 等待处理野外机缘'
  return '正在自动打怪'
}

export const selectMap = (player, id) => {
  const map = worldMaps.find(item => item.id === id)
  if (!map || player.level < map.min || !isRegionUnlocked(player, id) || hasActiveTrial(player) || player.world.encounter || player.world.opportunity) return false
  player.world.mapId = id
  player.world.encounter = null
  player.world.opportunity = null
  player.world.resting = false
  addWorldLog(player, '抵达' + map.name + '。' + map.desc, 'system')
  return true
}

export const seekFlame = (player, map, random = Math.random) => {
  const missing = map.fires.filter(id => heavenlyFlames.find(fire => fire.id === id)?.source.type === 'wild' && !player.world.flames.some(fire => fire.id === id))
  if (!missing.length) return false
  player.world.pity[map.id] = (player.world.pity[map.id] || 0) + 1
  const chance = 0.015 + Math.min(0.08, (player.world.clues[map.id] || 0) * 0.01)
  if (random() >= chance) return false
  const id = missing[Math.floor(random() * missing.length)]
  player.world.clues[map.id] = 0
  return grantFlame(player, id, 'wild')
}

export const refineFlame = (player, id) => {
  const owned = player.world.flames.find(item => item.id === id)
  const flame = heavenlyFlames.find(item => item.id === id)
  if (!owned || !flame) return '尚未寻获这道火种'
  if (owned.refined) return '这道异火已炼化'
  if (player.level < flame.min) return '需要达到' + levelNames(flame.min)
  if (player.props.money < flame.cost) return '需要 ' + flame.cost + ' 灵石'
  if (hasActiveTrial(player) || player.world.encounter) return '请先结束战斗再炼化'
  player.props.money -= flame.cost
  owned.refined = true
  player.world.activeFlame = id
  addWorldLog(player, '成功炼化「' + flame.name + '」，从此每次命中都会附带此火伤害。', 'flame')
  return ''
}

export const rewardMonster = (player, random = Math.random) => {
  const world = player.world
  const map = currentMap(player)
  const monster = world.encounter
  if (monster.kind === 'pass') {
    completeRegionUnlock(player, monster.unlock)
    world.encounter = null
    world.mode = 'idle'
    return
  }
  const money = 18 + monster.level * 4
  const stoneCount = 1 + Math.floor(random() * 3)
  const tier = random() < 0.2 ? Math.max(0, map.stone - 1) : map.stone
  player.taskNum++
  world.kills++
  world.sessions.kills++
  player.props.money += money
  world.sessions.money += money
  player.props[stoneTiers[tier].key] += stoneCount
  world.sessions.stones += stoneCount
  player.props.cultivateDan += 1 + player.reincarnation
  const exp = gainCultivation(player, Math.min(player.maxCultivation * 0.10, cultivationPerTick(player.level) * 6) * Math.min(1, (monster.level + 1) / (player.level + 1)))
  addWorldLog(player, '击败' + monster.name + '，获得 ' + exp + ' 修为、' + money + ' 灵石、' + stoneCount + ' 枚' + stoneTiers[tier].name + '。', 'loot')
  if (monster.event) {
    changeAffinity(player, monster.event.npc, monster.event.favor)
    world.eventWins++
    addWorldLog(player, worldNpcs.find(npc => npc.id === monster.event.npc).name + '的危机已解除，好感 +' + monster.event.favor + '。', 'npc')
  }
  if (monster.kind === 'wildBoss' && player.level >= 72 && random() < 0.25) grantFlame(player, 'void', 'boss')
  if (random() < 0.65) {
    const generators = ['equip_Weapons', 'equip_Armors', 'equip_Accessorys', 'equip_Sutras']
    const item = equip[generators[Math.floor(random() * generators.length)]](Math.min(player.level, monster.level))
    if (player.inventory.length < player.backpackCapacity) {
      player.inventory.push(item)
      world.sessions.equipment++
      addWorldLog(player, '拾取「' + item.name + '」。可在行囊中穿戴、强化或分解。', 'equipment')
    } else if (world.autoSalvage) {
      player.props.strengtheningStone += Math.max(1, item.level)
      player.props.money++
      addWorldLog(player, '行囊已满，新掉落的「' + item.name + '」已分解；原有装备保留。', 'equipment')
    } else {
      setAutomation(player, 'idle')
      addWorldLog(player, '行囊已满，本次装备未拾取，已停止挂机。', 'system')
    }
  }
  if (monster.kind !== 'wildBoss') seekFlame(player, map, random)
  world.encounter = null
}

export const strikeText = result => {
  if (!result.isHit) return '攻击被闪避'
  const extra = result.flames.length ? '，异火附伤 ' + result.flames.map(fire => fire.name + ' ' + fire.damage).join('、') : ''
  return result.skill + '造成 ' + result.baseDamage + ' 伤害' + extra + '，合计 ' + result.damage
}

export const explorationStep = (player, random = Math.random) => {
  const world = player.world
  if (hasActiveTrial(player) || world.mode === 'cultivate') return
  autoHealWithHerbs(player)
  let map = currentMap(player)
  if (player.level < map.min) { selectMap(player, 'wutan'); map = currentMap(player) }
  if (world.opportunity) {
    if (world.mode !== 'idle' && world.autoNpc) resolveOpportunity(player, world.opportunity.kind === 'meeting' ? 'learn' : ['insight', 'courier'].includes(world.opportunity.kind) ? 'leave' : 'help')
    return
  }
  if (world.resting || (!world.encounter && player.health <= player.maxHealth * 0.25)) {
    world.resting = true
    world.encounter = null
    player.health = Math.min(player.maxHealth, player.health + Math.max(10, Math.floor(player.maxHealth * 0.2)))
    if (player.health >= player.maxHealth) { world.resting = false; addWorldLog(player, '疗伤完毕，重新踏上历练之路。', 'system') }
    return
  }
  if (!world.encounter) {
    if (player.level >= 72 && random() < 0.015) {
      world.encounter = { ...enemyAttributes(Math.min(102, player.level), { health: 4, attack: 2.15, defense: 1.3 }), name: '吞炎魔影', kind: 'wildBoss', rounds: 0 }
      addWorldLog(player, '野外异变！吞炎魔影现身，战胜后有机会获得虚无吞炎。', 'flame')
      return
    }
    if (random() < 0.20) {
      createWildEvent(player, random)
      if (world.mode !== 'idle' && world.autoNpc) resolveOpportunity(player, world.opportunity.kind === 'meeting' ? 'learn' : ['insight', 'courier'].includes(world.opportunity.kind) ? 'leave' : 'help')
      return
    }
    const level = Math.min(map.max, Math.max(map.min, player.level))
    world.encounter = { ...enemyAttributes(level, { scale: 1 + Math.min(10, player.reincarnation) * 0.12 }),
      name: map.monsters[Math.floor(random() * map.monsters.length)], rounds: 0 }
    addWorldLog(player, '遭遇' + world.encounter.name + '（' + levelNames(level) + '）。', 'combat')
    return
  }
  const monster = world.encounter
  monster.rounds++
  const attack = calculateStrike(player, monster, { round: monster.rounds, random })
  world.lastAttack = attack
  monster.health = Math.max(0, monster.health - attack.damage)
  if (monster.health <= 0) {
    if (attack.flames.length) addWorldLog(player, strikeText(attack), 'flame')
    rewardMonster(player, random)
    return
  }
  const counter = calculateStrike(monster, player, { round: monster.rounds, random })
  player.health = Math.max(0, player.health - counter.damage)
  if (player.health <= 0 || monster.rounds >= 40) {
    world.encounter = null
    world.resting = true
    addWorldLog(player, '本次未能战胜' + monster.name + '，已撤回营地。装备保留，救援事件需要获胜才增加好感。', 'system')
  } else if (monster.rounds % 3 === 0) {
    addWorldLog(player, '第 ' + monster.rounds + ' 回合：' + strikeText(attack) + '；受到 ' + counter.damage + ' 伤害。', 'combat')
  }
}

export const advanceWorld = (player, now = Date.now(), allowHunt = true, limit = 30) => {
  const world = player.world
  const elapsed = Math.max(0, now - world.lastTick)
  const ticks = Math.min(limit, Math.floor(elapsed / WORLD_TICK))
  if (!ticks) return 0
  for (let i = 0; i < ticks; i++) {
    if (hasActiveTrial(player)) { if (world.trial.auto) trialStep(player); continue }
    world.herbCooldown = Math.max(0, (world.herbCooldown || 0) - 1)
    if (world.mode === 'cultivate') cultivateTick(player)
    if (allowHunt && world.mode === 'hunt') explorationStep(player)
    settleGardenCultivation(player)
  }
  world.lastTick = now - (elapsed % WORLD_TICK)
  if (world.mode === 'cultivate' && player.level >= maxLv) setAutomation(player, 'idle', now)
  return ticks
}

export const enhancementCost = item => ({
  stone: stoneTiers[Math.min(5, Math.floor((item.strengthen || 0) / 5))],
  count: 1 + Math.floor((item.strengthen || 0) / 5),
  money: 12 * Math.max(1, item.level) * (1 + (item.strengthen || 0)),
  rate: (item.strengthen || 0) < 5 ? 1 : Math.max(0.45, 1 - ((item.strengthen || 0) - 4) * 0.025)
})

export const strengthenEquipment = (player, item, random = Math.random) => {
  const worn = player.equipment[item?.type]
  if (!item?.name || (!player.inventory.includes(item) && worn !== item)) return '装备不存在'
  if ((item.strengthen || 0) >= 30) return '装备已强化至上限 +30'
  if (hasActiveTrial(player) || player.world.encounter) return '请先结束战斗再强化'
  const cost = enhancementCost(item)
  const legacy = cost.stone.key === stoneTiers[0].key ? player.props.strengtheningStone : 0
  if (player.props[cost.stone.key] + legacy < cost.count) return cost.stone.name + '不足'
  if (player.props.money < cost.money) return '灵石不足'
  const used = Math.min(player.props[cost.stone.key], cost.count)
  player.props[cost.stone.key] -= used
  player.props.strengtheningStone -= cost.count - used
  player.props.money -= cost.money
  if (random() >= cost.rate) return '强化失败，装备与强化等级保留'
  const before = { attack: item.attack, defense: item.defense, health: item.health }
  item.strengthen = (item.strengthen || 0) + 1
  applyEquipmentBalance(item)
  if (worn === item) {
    player.attack += item.attack - before.attack
    player.defense += item.defense - before.defense
    player.maxHealth += item.health - before.health
    player.health = Math.min(player.maxHealth, player.health + item.health - before.health)
  }
  player.score = combatScore(player)
  addWorldLog(player, '「' + item.name + '」强化成功，当前 +' + item.strengthen + '。', 'equipment')
  return ''
}
