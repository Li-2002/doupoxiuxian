import test from 'node:test'
import assert from 'node:assert/strict'
import { makePlayer } from './fixtures.js'
import { herbSeeds } from '../src/plugins/worldContent.js'
import { addHerbs, initializeHerbs, autoHealWithHerbs } from '../src/plugins/herbs.js'
import { harvestHerb, useHerbs, settleGardenCultivation, startTrial, helpGardenVisitor, giveNpcGift, meetNpc } from '../src/plugins/worldActivities.js'
import { initializeWorld, setAutomation, advanceWorld, automationStatus } from '../src/plugins/douqi.js'

test('挂机交战可收获成熟药草，分类存入背包，修为延后结算且不能重复领取', () => {
  const p = makePlayer(18)
  setAutomation(p, 'hunt', 1000)
  p.world.encounter = { name: '魔兽', health: 500 }
  p.world.garden.plots[0] = { seed: 'lotus-herb', plantedAt: 0, readyAt: 1000 }
  const cultivation = p.cultivation
  assert.equal(harvestHerb(p, 0, 1000, () => 0.9), '')
  assert.equal(p.props.iceFlameGrass, 5)
  assert.equal(p.world.garden.herbs, 5)
  assert.equal(p.world.garden.plots[0], null)
  assert.equal(p.cultivation, cultivation)
  assert.ok(p.world.garden.pendingCultivation > 0)
  assert.match(harvestHerb(p, 0, 1000), /尚未成熟/)
  p.world.encounter = null
  settleGardenCultivation(p)
  assert.ok(p.cultivation > cultivation)
  assert.equal(p.world.garden.pendingCultivation, 0)
})

test('三类药草按最大生命15%、25%、35%回复，满血不消耗且回复不溢出', () => {
  for (const [id, percent] of [['grass', 0.15], ['lotus-herb', 0.25], ['soul', 0.35]]) {
    const p = makePlayer()
    p.maxHealth = 1000
    p.health = 100
    addHerbs(p, id, 3)
    assert.equal(useHerbs(p, 'heal', id), '')
    assert.equal(p.health, 100 + percent * 1000)
    assert.equal(p.world.garden.herbs, 2)
    p.health = 999
    useHerbs(p, 'heal', id)
    assert.equal(p.health, 1000)
    assert.match(useHerbs(p, 'heal', id), /恢复/)
    assert.equal(p.world.garden.herbs, 1)
  }
})

test('自动打怪按高回复优先用药，6秒内不能重复服用，不需要另开页面或定时器', () => {
  const p = makePlayer()
  p.maxHealth = 1000
  p.health = 100
  addHerbs(p, 'grass', 4)
  addHerbs(p, 'soul', 4)
  setAutomation(p, 'hunt', 1000)
  p.world.opportunity = { kind: 'meeting', npc: 'yao' }
  p.world.autoNpc = false
  advanceWorld(p, 3000)
  assert.equal(p.health, 450)
  assert.equal(p.props.soulDew, 3)
  assert.equal(p.props.bloodGrass, 4)
  advanceWorld(p, 7000)
  assert.equal(p.health, 450)
  advanceWorld(p, 9000)
  assert.equal(p.health, 800)
  assert.equal(p.props.soulDew, 2)
  advanceWorld(p, 15000)
  assert.equal(p.props.soulDew, 2)
})

test('药草不在手动、修炼、传统战斗暂停、试炼、死亡与营地休息时自动消耗', () => {
  for (const mode of ['idle', 'cultivate', 'hunt']) {
    const p = makePlayer(31)
    addHerbs(p, 'soul', 10)
    p.health = 1
    setAutomation(p, mode, 1000)
    if (mode === 'hunt') {
      advanceWorld(p, 3000, false)
      assert.equal(p.world.garden.herbs, 10)
      p.health = p.maxHealth
      assert.equal(startTrial(p, 'lotus-trial'), '')
      p.health = 1
      p.world.mode = 'hunt'
    }
    assert.equal(autoHealWithHerbs(p), false)
    assert.equal(p.world.garden.herbs, 10)
  }
  const p = makePlayer()
  addHerbs(p, 'grass', 2)
  setAutomation(p, 'hunt')
  p.health = 0
  assert.equal(autoHealWithHerbs(p), false)
  p.health = 1
  p.world.resting = true
  assert.equal(autoHealWithHerbs(p), false)
  assert.equal(p.world.garden.herbs, 2)
})

test('野外交战也可正常赠礼：扣除灵石或两份药草，分别增加4和7好感，间隔60秒', () => {
  const p = makePlayer(18)
  const relation = meetNpc(p, 'xuner')
  p.props.money = 200
  addHerbs(p, 'grass', 1)
  addHerbs(p, 'soul', 2)
  p.world.encounter = { name: '魔兽', health: 500 }
  assert.equal(giveNpcGift(p, 'xuner', 'money', 100000), '')
  assert.equal(p.props.money, 110)
  assert.equal(relation.affinity, 4)
  const before = JSON.stringify(p)
  assert.match(giveNpcGift(p, 'xuner', 'herbs', 130000), /稍后/)
  assert.equal(JSON.stringify(p), before)
  assert.equal(giveNpcGift(p, 'xuner', 'herbs', 160000), '')
  assert.equal(relation.affinity, 11)
  assert.equal(p.props.bloodGrass, 0)
  assert.equal(p.props.soulDew, 1)
  assert.equal(p.world.garden.herbs, 1)
})

test('赠礼不足不扣任何资源、不启动冷却，旧同名NPC的好感不会掩盖赠礼增量', () => {
  const p = makePlayer(9)
  const relation = meetNpc(p, 'xuner')
  p.npcs.push({ name: '古薰儿', favorability: 450 })
  const before = JSON.stringify(p)
  assert.match(giveNpcGift(p, 'xuner', 'money', 100000), /需要 60/)
  assert.equal(JSON.stringify(p), before)
  assert.match(giveNpcGift(p, 'xuner', 'herbs', 100000), /需要 2/)
  assert.equal(relation.lastGiftAt, 0)
  p.props.money = 60
  assert.equal(giveNpcGift(p, 'xuner', 'money', 100000), '')
  assert.equal(relation.affinity, 454)
})

test('旧药草计数迁入凝血草一次，赠礼、老人、出售按分类扣除，总数始终一致', () => {
  const p = makePlayer()
  p.world.garden.herbs = 12
  initializeWorld(p)
  initializeWorld(p)
  assert.equal(p.props.bloodGrass, 12)
  assert.equal(p.world.garden.herbs, 12)
  addHerbs(p, 'soul', 2)
  meetNpc(p, 'xuner')
  assert.equal(giveNpcGift(p, 'xuner', 'herbs', 100000), '')
  assert.equal(p.props.bloodGrass, 10)
  p.world.garden.visitor = { arrivedAt: 1 }
  helpGardenVisitor(p, () => 0.9)
  assert.equal(p.props.bloodGrass, 4)
  const money = p.props.money
  assert.equal(useHerbs(p, 'sell', 'soul'), '')
  assert.equal(p.props.money, money + 50)
  assert.equal(p.props.soulDew, 0)
  assert.equal(p.world.garden.herbs, 4)
  initializeHerbs(p)
  assert.equal(p.props.bloodGrass, 4)
  assert.equal(herbSeeds.length, 3)
})

test('只接受独立打怪/修炼，旧同修存档停止挂机，未结束交战不能切换修炼', () => {
  const p = makePlayer()
  p.world.mode = 'both'
  initializeWorld(p)
  assert.equal(p.world.mode, 'idle')
  setAutomation(p, 'both')
  assert.equal(p.world.mode, 'idle')
  setAutomation(p, 'hunt', 1000)
  assert.match(automationStatus(p), /正在自动打怪/)
  p.world.encounter = { health: 100 }
  assert.ok(setAutomation(p, 'cultivate', 1000))
  assert.equal(p.world.mode, 'hunt')
  p.world.encounter = null
  setAutomation(p, 'idle', 1000)
  assert.equal(setAutomation(p, 'cultivate', 1000), undefined)
  assert.equal(p.world.encounter, null)
  assert.match(automationStatus(p), /正在自动修炼/)
  advanceWorld(p, 21000)
  assert.equal(p.world.kills, 0)
  assert.ok(p.cultivation > 0)
})
