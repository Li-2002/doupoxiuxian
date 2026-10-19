import test from 'node:test'
import assert from 'node:assert/strict'
import { realmNames, levelNames, maxLv, cultivationCost } from '../src/plugins/realms.js'
import { createWorldState, heavenlyFlames, worldMaps, stoneTiers } from '../src/plugins/douqiWorld.js'
import combat from '../src/plugins/combat.js'
import { makePlayer, makeItem } from './fixtures.js'
import { flameAcquisition } from '../src/plugins/worldContent.js'
import { initializeWorld, gainCultivation, setAutomation, advanceWorld, selectMap, explorationStep,
  refineFlame, seekFlame, flameBonuses, resolveOpportunity, strengthenEquipment, rewardMonster,
  MAX_OFFLINE_TICKS, WORLD_TICK } from '../src/plugins/douqi.js'

const player = () => { const p = makePlayer(); initializeWorld(p); return p }
const item = (type = 'weapon') => makeItem(type)

test('斗气境界的关键边界与地图、异火完整性', () => {
  assert.equal(realmNames.length, 103)
  for (const [level, name] of [[0, '斗之气一段'], [8, '斗之气九段'], [9, '一星斗者'],
    [80, '九星斗尊'], [81, '一转斗尊巅峰'], [89, '九转斗尊巅峰'], [90, '初级半圣'],
    [92, '高级半圣'], [93, '一星斗圣'], [101, '九星斗圣'], [102, '斗帝']]) assert.equal(levelNames(level), name)
  assert.equal(levelNames(144), '斗帝')
  assert.equal(new Set(heavenlyFlames.map(f => f.id)).size, 23)
  assert.equal(new Set([...worldMaps.flatMap(map => map.fires), ...Object.keys(flameAcquisition)]).size, 23)
  assert.equal(new Set(worldMaps.map(map => map.stone)).size, stoneTiers.length)
})

test('旧档保留物品与财产，映射境界并重算有界属性，迁移可重复读取', () => {
  const p = player()
  delete p.world
  p.level = 144
  p.cultivation = 500
  p.maxCultivation = 1000
  p.inventory = [{ ...item(), level: 144 }]
  p.equipment.weapon = { ...item(), level: 120 }
  p.shopData = [{ type: 'weapon', data: [{ ...item(), level: 144 }] }]
  p.props.money = 123
  initializeWorld(p)
  assert.equal(p.level, maxLv)
  assert.equal(p.cultivation, Math.floor(p.maxCultivation / 2))
  assert.equal(p.inventory[0].level, maxLv)
  assert.equal(p.equipment.weapon.level, 85)
  assert.equal(p.shopData[0].data[0].level, maxLv)
  assert.equal(p.inventory[0].name, '测试weapon')
  assert.ok(p.inventory[0].attack > 0 && p.inventory[0].attack < 2000)
  assert.equal(p.props.money, 123)
  const snapshot = JSON.stringify(p)
  initializeWorld(p)
  assert.equal(JSON.stringify(p), snapshot)
})

test('修为突破正确消耗阈值，自动增长属性且上限不会溢出', () => {
  const p = player()
  gainCultivation(p, 150)
  assert.equal(p.level, 1)
  assert.equal(p.cultivation, 50)
  assert.equal(p.maxCultivation, cultivationCost(1))
  assert.equal(p.attack, 30)
  assert.equal(p.points, 3)
  p.level = maxLv - 1
  p.cultivation = p.maxCultivation - 1
  gainCultivation(p, 100000000)
  assert.equal(p.level, maxLv)
  assert.equal(p.cultivation, 0)
  assert.equal(gainCultivation(p, 100), 0)
})

test('自动修炼独立于页面运行，可停止；离线结算有四小时上限', () => {
  const p = player()
  setAutomation(p, 'cultivate', 1000)
  assert.equal(advanceWorld(p, 21000), 10)
  assert.ok(p.cultivation > 0)
  assert.equal(p.world.kills, 0)
  setAutomation(p, 'idle', 21000)
  const cultivation = p.cultivation
  advanceWorld(p, 41000)
  assert.equal(p.cultivation, cultivation)
  setAutomation(p, 'cultivate', 41000)
  assert.equal(advanceWorld(p, 41000 + 10 * 60 * 60 * 1000, true, MAX_OFFLINE_TICKS), MAX_OFFLINE_TICKS)
  assert.equal(MAX_OFFLINE_TICKS * WORLD_TICK, 4 * 60 * 60 * 1000)
})

test('浏览器定时器延迟不会吞掉未满两秒的挂机时间', () => {
  const p = player()
  setAutomation(p, 'cultivate', 1000)
  assert.equal(advanceWorld(p, 3999), 1)
  assert.equal(advanceWorld(p, 5000), 1)
  assert.equal(p.cultivation, 6)
})

test('挂机打怪能击杀并掉落强化石、灵石、修为；战败自动疗伤，未解锁地图不可进入', () => {
  const p = player()
  assert.equal(selectMap(p, 'desert'), false)
  assert.equal(selectMap(p, 'wutan'), true)
  for (let i = 0; i < 30; i++) explorationStep(p, () => 0.5)
  assert.ok(p.world.kills >= 1)
  assert.ok(p.props.yellowStone > 0)
  assert.ok(p.props.money > 0)
  assert.ok(p.cultivation > 0)
  p.world.resting = false
  p.health = p.maxHealth
  p.world.encounter = { name: '强敌', level: 1, health: 9999, maxHealth: 9999, attack: 99999, defense: 100, rounds: 0 }
  explorationStep(p, () => 0.5)
  assert.equal(p.health, 0)
  assert.equal(p.world.resting, true)
  for (let i = 0; i < 5; i++) explorationStep(p)
  assert.equal(p.health, p.maxHealth)
  assert.equal(p.world.resting, false)
})

test('传统战斗期间暂停自动打怪，同修仍可增长修为', () => {
  const p = player()
  setAutomation(p, 'both', 1000)
  advanceWorld(p, 21000, false)
  assert.ok(p.cultivation > 0)
  assert.equal(p.world.encounter, null)
  assert.equal(p.world.kills, 0)
})

test('NPC 事件等待手动选择，交易不足不扣费，线索与交情持久保存', () => {
  const p = player()
  explorationStep(p, () => 0.01)
  assert.equal(p.world.opportunity.npc, 'xuner')
  assert.equal(resolveOpportunity(p, 'trade'), false)
  assert.equal(p.props.money, 0)
  assert.equal(resolveOpportunity(p, 'clue'), true)
  assert.equal(p.world.clues.wutan, 3)
  assert.equal(p.world.relationships.xuner, 10)
  assert.equal(p.world.opportunity, null)
})

test('随机异火无固定必得次数，寻获不重复，炼化后参与协同附伤', () => {
  const p = player()
  for (let i = 0; i < 59; i++) assert.equal(seekFlame(p, worldMaps[0], () => 0.99), false)
  assert.equal(seekFlame(p, worldMaps[0], () => 0.99), false)
  assert.equal(seekFlame(p, worldMaps[0], () => 0), true)
  assert.equal(seekFlame(p, worldMaps[0], () => 0), false)
  assert.equal(p.world.flames.length, 1)
  assert.equal(refineFlame(p, 'xuanhuang'), '需要 100 灵石')
  p.props.money = 100
  assert.equal(refineFlame(p, 'xuanhuang'), '')
  assert.equal(p.props.money, 0)
  assert.ok(flameBonuses(p).attack > 0)
  assert.ok(flameBonuses(p).cultivation > 0)
  assert.equal(refineFlame(p, 'xuanhuang'), '这道异火已炼化')
  assert.equal(p.props.money, 0)
})

test('穿戴装备强化准确扣费并增加对应属性，背包装备不会影响人物', () => {
  const p = player()
  const armor = item('armor')
  p.equipment.armor = armor
  p.maxHealth += armor.health
  p.health += armor.health
  p.defense += armor.defense
  const health = p.maxHealth
  const attack = p.attack
  p.props.yellowStone = 2
  p.props.money = 100
  assert.equal(strengthenEquipment(p, armor, () => 0), '')
  assert.equal(armor.strengthen, 1)
  assert.equal(p.props.yellowStone, 1)
  assert.equal(p.props.money, 88)
  assert.ok(p.maxHealth > health)
  assert.equal(p.attack, attack)
  const after = p.maxHealth
  const spare = { ...item(), id: 'spare' }
  p.inventory.push(spare)
  assert.equal(strengthenEquipment(p, spare, () => 0), '')
  assert.equal(p.attack, attack)
  assert.equal(p.maxHealth, after)
})

test('异火也对原有无尽塔战斗生效，未装备异火的魔兽保持原伤害', () => {
  const p = player()
  p.attack = 100
  p.world.flames = [{ id: 'xuanhuang', refined: true }]
  p.world.activeFlame = 'xuanhuang'
  const target = { defense: 0, dodge: -1 }
  assert.equal(combat.calculateDamage(p, target, { random: () => 0.5 }).damage, 126)
  assert.equal(combat.calculateDamage({ attack: 100, critical: 0 }, target).damage, 100)
})

test('强化不足、上限不扣材料，高阶失败保留装备，炼器石只替代黄阶石', () => {
  const p = player()
  const weapon = item()
  p.inventory.push(weapon)
  p.props.money = 10000
  assert.equal(strengthenEquipment(p, weapon, () => 0), '黄阶强化石不足')
  assert.equal(p.props.money, 10000)
  p.props.strengtheningStone = 10
  assert.equal(strengthenEquipment(p, weapon, () => 0), '')
  assert.equal(p.props.strengtheningStone, 9)
  weapon.strengthen = 5
  assert.equal(strengthenEquipment(p, weapon, () => 0), '玄阶强化石不足')
  p.props.blackStone = 2
  assert.equal(strengthenEquipment(p, weapon, () => 0.999), '强化失败，装备与强化等级保留')
  assert.equal(weapon.strengthen, 5)
  assert.ok(p.inventory.includes(weapon))
  weapon.strengthen = 30
  const money = p.props.money
  assert.equal(strengthenEquipment(p, weapon, () => 0), '装备已强化至上限 +30')
  assert.equal(p.props.money, money)
})

test('背包满只分解新掉落，保留已有锁定装备；关闭自动分解则停止挂机', () => {
  const p = player()
  const locked = { ...item(), lock: true }
  p.inventory = [locked]
  p.backpackCapacity = 1
  p.world.encounter = { name: '青木狼', level: 1 }
  rewardMonster(p, () => 0.5)
  assert.deepEqual(p.inventory, [locked])
  assert.ok(p.props.strengtheningStone > 0)
  p.world.autoSalvage = false
  setAutomation(p, 'hunt')
  p.world.encounter = { name: '青木狼', level: 1 }
  rewardMonster(p, () => 0.5)
  assert.equal(p.world.mode, 'idle')
  assert.deepEqual(p.inventory, [locked])
})
