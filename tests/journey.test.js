import test from 'node:test'
import assert from 'node:assert/strict'
import { makePlayer, makeItem } from './fixtures.js'
import { initializeWorld, gainCultivation, selectMap, cultivateTick, explorationStep, rewardMonster, setAutomation, flameBonuses } from '../src/plugins/douqi.js'
import { initializeCapacity, advanceAge } from '../src/plugins/worldProgress.js'
import { unlockRegion, cultivationEfficiency } from '../src/plugins/journey.js'
import { salvagePreview, salvageBelow, redeemExclusiveSet } from '../src/plugins/equipmentGrowth.js'
import { addHerbs } from '../src/plugins/herbs.js'
import { opportunityChoices, resolveOpportunity, meetNpc, harvestHerb } from '../src/plugins/worldActivities.js'
import { worldMaps, worldNpcs } from '../src/plugins/douqiWorld.js'
import { cultivationCost, cultivationPerTick } from '../src/plugins/realms.js'

test('容量补发仅一次，每次突破额外50格，连续突破与读档不重复发放', () => {
  const p = makePlayer(9)
  initializeWorld(p)
  assert.equal(p.backpackCapacity, 500)
  initializeWorld(p)
  assert.equal(p.backpackCapacity, 500)
  gainCultivation(p, p.maxCultivation + cultivationCost(10))
  assert.equal(p.level, 11)
  assert.equal(p.backpackCapacity, 600)
  initializeCapacity(p)
  assert.equal(p.backpackCapacity, 600)
})

test('蓝色以下严格排除蓝色，锁定、穿戴、专属及未知品质保留，收益只结算一次', () => {
  const p = makePlayer(9)
  const white = makeItem('armor', 9, 'info'), green = makeItem('weapon', 9, 'success')
  const blue = makeItem('sutra', 9, 'primary'), locked = { ...white, id: 'lock', lock: true }
  const worn = makeItem('accessory', 9, 'info')
  p.equipment.accessory = worn
  const unknown = { ...white, id: 'unknown', quality: 'other' }
  p.inventory = [white, green, blue, locked, worn, unknown]
  redeemExclusiveSet(p, 'dwdldhsglqfkssjqd')
  const exclusive = p.inventory.slice(-4)
  exclusive.forEach(item => { item.lock = false })
  assert.equal(salvagePreview(p, 'primary').items.length, 2)
  assert.equal(salvageBelow(p, 'primary'), '')
  assert.deepEqual(p.inventory, [blue, locked, worn, unknown, ...exclusive])
  assert.equal(salvagePreview(p, 'pink').items.includes(exclusive[0]), false)
  assert.equal(p.props.money, 2)
  assert.equal(p.props.strengtheningStone, 18)
  assert.ok(salvageBelow(p, 'primary'))
  assert.equal(p.props.money, 2)
})

test('地图按顺序开放：守关战胜利才解锁，药草按种类扣除，奇遇须在前一区完成', () => {
  const p = makePlayer(63)
  initializeWorld(p)
  assert.ok(unlockRegion(p, 'desert'))
  assert.equal(selectMap(p, 'mountains'), false)
  assert.equal(unlockRegion(p, 'mountains'), '')
  assert.equal(p.world.encounter.kind, 'pass')
  assert.equal(selectMap(p, 'mountains'), false)
  rewardMonster(p, () => 0.9)
  assert.equal(selectMap(p, 'mountains'), true)
  assert.ok(unlockRegion(p, 'desert'))
  addHerbs(p, 'grass', 10)
  assert.equal(unlockRegion(p, 'desert'), '')
  assert.equal(p.props.bloodGrass, 0)
  assert.equal(unlockRegion(p, 'blackcorner').includes('打听'), true)
  selectMap(p, 'desert')
  p.world.opportunity = { kind: 'meeting', npc: 'hai', mapId: 'desert', level: 26 }
  resolveOpportunity(p, 'clue')
  assert.equal(unlockRegion(p, 'blackcorner'), '')
  assert.deepEqual(p.world.journey.unlocked, ['wutan', 'mountains', 'desert', 'blackcorner'])
})

test('旧存档保留当前已达区域，低级地点修炼严重衰减，无法跨等级进入', () => {
  const p = makePlayer(63)
  delete p.world.journey
  p.world.mapId = 'pill'
  initializeWorld(p)
  assert.equal(p.world.journey.unlocked.length, 8)
  assert.equal(cultivationEfficiency(p), 1)
  selectMap(p, 'wutan')
  assert.equal(cultivationEfficiency(p), 0.05)
  p.level = 0
  assert.equal(selectMap(p, 'pill'), false)
})

test('修炼与打怪所有入口互斥，开启修炼不能清除未完战斗和奇遇', () => {
  const p = makePlayer()
  setAutomation(p, 'cultivate')
  explorationStep(p, () => 0.9)
  assert.equal(p.world.encounter, null)
  setAutomation(p, 'hunt')
  cultivateTick(p)
  assert.equal(p.cultivation, 0)
  explorationStep(p, () => 0.9)
  const encounter = p.world.encounter
  assert.ok(setAutomation(p, 'cultivate'))
  assert.equal(p.world.encounter, encounter)
  assert.equal(p.world.mode, 'hunt')
})

test('NPC取舍可降低好感且不保证获利，每名NPC均有放弃和冒险选项', () => {
  const p = makePlayer(9)
  meetNpc(p, 'doctor').affinity = 100
  const event = { kind: 'meeting', npc: 'doctor', mapId: 'mountains', level: 9 }
  for (const npc of worldNpcs) {
    p.world.opportunity = { ...event, npc: npc.id }
    assert.ok(opportunityChoices(p).some(item => item.id === 'leave'))
    assert.ok(opportunityChoices(p).some(item => item.id === 'bargain'))
  }
  p.world.opportunity = event
  assert.ok(opportunityChoices(p).some(item => item.id === 'leave'))
  assert.ok(opportunityChoices(p).some(item => item.id === 'bargain'))
  resolveOpportunity(p, 'bargain', () => 0.99)
  assert.equal(p.world.social.doctor.affinity, 94)
  assert.equal(p.props.money, 0)
  p.world.opportunity = event
  resolveOpportunity(p, 'bargain', () => 0.01)
  assert.ok(p.props.yellowStone > 0)
})

test('默认不自动处理事件，挂机遇到奇遇等待手动；自动处理新奇遇不能获得火种', () => {
  const p = makePlayer(63)
  initializeWorld(p)
  assert.equal(p.world.autoNpc, false)
  const event = { kind: 'insight', npc: 'doctor', mapId: 'mountains', level: 9 }
  p.world.opportunity = event
  setAutomation(p, 'hunt')
  explorationStep(p, () => 0)
  assert.equal(p.world.opportunity, event)
  assert.equal(p.world.flames.length, 0)
  p.world.autoNpc = true
  explorationStep(p, () => 0)
  assert.equal(p.world.opportunity, null)
  assert.equal(p.world.flames.length, 0)
})

test('未通过守关战、战斗中交药、跨级及奇遇不足均不开放地图或扣除资源', () => {
  const p = makePlayer(9)
  initializeWorld(p)
  assert.equal(unlockRegion(p, 'mountains'), '')
  p.world.encounter.attack = 100000
  p.world.encounter.health = 100000
  explorationStep(p, () => 0.5)
  assert.deepEqual(p.world.journey.unlocked, ['wutan'])
  assert.ok(unlockRegion(p, 'desert'))
  p.level = 63
  p.health = p.maxHealth
  p.world.resting = false
  unlockRegion(p, 'mountains')
  rewardMonster(p)
  addHerbs(p, 'grass', 10)
  p.world.encounter = { name: '交战中' }
  assert.ok(unlockRegion(p, 'desert'))
  assert.equal(p.props.bloodGrass, 10)
  p.world.encounter = null
  assert.equal(unlockRegion(p, 'desert'), '')
  assert.ok(unlockRegion(p, 'blackcorner'))
  assert.ok(!p.world.journey.unlocked.includes('blackcorner'))
})

test('悟道异火通过手动非战斗奇遇，失败有保底进度且奖励不可重复，自动处理会错过', () => {
  for (const [kind, id, mapId, choice] of [['insight', 'serenity', 'mountains', 'meditate']]) {
    const p = makePlayer(63)
    initializeWorld(p)
    const event = { kind, npc: 'yao', mapId, level: 27 }
    for (let i = 0; i < 5; i++) {
      p.world.opportunity = event
      assert.equal(resolveOpportunity(p, choice, () => 0.99), true)
      assert.equal(p.world.encounter, null)
    }
    assert.equal(p.world.flames.filter(f => f.id === id).length, 1)
    p.world.flames[0].refined = true
    assert.ok(flameBonuses(p).cultivation > 0.1)
    p.world.opportunity = event
    resolveOpportunity(p, choice, () => 0)
    assert.equal(p.world.flames.length, 1)
    assert.ok(worldMaps.every(map => !map.fires.includes(id)))
    const auto = makePlayer(63)
    auto.world.opportunity = event
    assert.equal(resolveOpportunity(auto, 'leave'), true)
    assert.equal(auto.world.flames.length, 0)
  }
})

test('送信保留普通奇遇奖励，不再发放星灯离尘火或陨落心炎', () => {
  const p = makePlayer(63)
  initializeWorld(p)
  for (let i = 0; i < 10; i++) {
    p.world.opportunity = { kind: 'courier', npc: 'merchant', mapId: 'blackcorner', level: 27 }
    assert.equal(resolveOpportunity(p, 'deliver', () => i % 2 ? 0.99 : 0), true)
    assert.equal(p.world.encounter, null)
  }
  assert.equal(p.world.flames.length, 0)
  assert.ok(p.props.money > 0)
  assert.equal(p.world.social.merchant.affinity, 30)
})

test('旧星灯火退出图鉴，已炼化费用只返还一次，陨落心炎仍需通过副本获得', () => {
  const p = makePlayer(63)
  p.world.flames = [{ id: 'starlight', refined: true }, { id: 'fallen', refined: true, source: 'trial' }]
  p.world.activeFlame = 'starlight'
  p.world.opportunityProgress = { starlight: 4, serenity: 2 }
  initializeWorld(p)
  assert.deepEqual(p.world.flames.map(fire => fire.id), ['fallen'])
  assert.equal(p.props.money, 2800)
  assert.equal(p.world.opportunityProgress.starlight, undefined)
  assert.equal(p.world.opportunityProgress.serenity, 2)
  const before = JSON.stringify(p)
  initializeWorld(p)
  assert.equal(JSON.stringify(p), before)
  const unrefined = makePlayer(27)
  unrefined.world.flames = [{ id: 'starlight', refined: false }]
  initializeWorld(unrefined)
  assert.equal(unrefined.world.flames.length, 0)
  assert.equal(unrefined.props.money, 0)
})

test('年龄按累计在线一小时一岁，零头保留；各级基础修炼时间逐级增长', () => {
  const p = makePlayer()
  p.age = 1
  advanceAge(p, 59 * 60000)
  assert.equal(p.age, 1)
  advanceAge(p, 60000)
  assert.equal(p.age, 2)
  assert.equal(p.world.ageElapsed, 0)
  let prior = 0
  for (let lv = 0; lv < 102; lv++) {
    const seconds = cultivationCost(lv) / Math.floor(3 + lv * 3 + lv * lv * 0.08) * 2
    assert.ok(seconds > prior, `level ${lv}`)
    prior = seconds
  }
})

test('低级怪、低级药草与请教修为有上限，不能用当前升级需求比例绕过后期节奏', () => {
  const p = makePlayer(90)
  initializeWorld(p)
  const limit = cultivationPerTick(90)
  p.world.encounter = { name: '低级怪', level: 8 }
  rewardMonster(p, () => 0.9)
  assert.ok(p.cultivation < p.maxCultivation * 0.01)
  const before = p.cultivation
  p.world.opportunity = { kind: 'meeting', npc: 'yao', mapId: 'wutan', level: 8 }
  resolveOpportunity(p, 'learn')
  assert.ok(p.cultivation - before <= limit)
  const after = p.cultivation
  p.world.garden.plots[0] = { seed: 'grass', plantedAt: 0, readyAt: 1 }
  harvestHerb(p, 0, 2, () => 0.9)
  assert.ok(p.cultivation - after <= limit * 3)
  assert.equal(p.level, 90)
})
