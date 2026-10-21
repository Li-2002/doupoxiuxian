import test from 'node:test'
import assert from 'node:assert/strict'
import { makePlayer } from './fixtures.js'
import { initializeWorld, rewardMonster, cultivateTick, setAutomation } from '../src/plugins/douqi.js'
import { meetNpc, giveNpcGift, formBond, harvestHerb, resolveOpportunity, knownNpcRows, changeAffinity, createWildEvent } from '../src/plugins/worldActivities.js'
import { initializeBonds, claimBondStarter, buyGift, partnerRows, setPartnerTeam, upgradePartner, partnerUpgradeCost, interactPartner, partnerContribution, partnerCultivationBonus, rewardTrialGift } from '../src/plugins/partners.js'
import { worldNpcs } from '../src/plugins/douqiWorld.js'
import { wildEventTypes } from '../src/plugins/worldContent.js'
import { applyCompanionBalance, baseAttributes } from '../src/plugins/balance.js'
import { performReincarnation } from '../src/plugins/worldProgress.js'

const addPartner = (p, name, level = p.level) => {
  const item = applyCompanionBalance({ name, level, reincarnation: 0, id: `partner-${name}` })
  p.wifes.push(item)
  return item
}

test('赠礼给普通NPC也获得情缘，常用礼物低价购买，满好感伴侣仍可赠送；失败不扣费', () => {
  const p = makePlayer(9)
  initializeWorld(p)
  p.props.money = 100
  meetNpc(p, 'yao')
  assert.equal(buyGift(p, 'tea', 1), '')
  assert.equal(p.props.money, 88)
  assert.equal(p.world.bonds.gifts.tea, 1)
  assert.equal(giveNpcGift(p, 'yao', 'tea', 100000), '')
  assert.equal(p.props.qingyuan, 4)
  assert.equal(p.world.social.yao.affinity, 6)
  assert.equal(p.world.bonds.gifts.tea, 0)
  const snapshot = JSON.stringify(p)
  assert.ok(giveNpcGift(p, 'yao', 'tea', 200000))
  assert.equal(JSON.stringify(p), snapshot)
  assert.ok(buyGift(p, 'xuner-token', 1))
  meetNpc(p, 'xuner').affinity = 1000
  assert.equal(formBond(p, 'xuner'), '')
  assert.equal(giveNpcGift(p, 'xuner', 'money', 300000), '')
  assert.equal(p.props.qingyuan, 6)
  assert.equal(p.world.social.xuner.affinity, 1000)
  assert.ok(giveNpcGift(p, 'xuner', 'money', 300001))
})

test('历练、收获、修炼与友善机缘提供情缘，不依赖先结伴或赠礼；奖励只发一次', () => {
  const p = makePlayer(9)
  initializeWorld(p)
  p.world.encounter = { name: '测试怪', level: 9 }
  rewardMonster(p, () => 0.9)
  assert.equal(p.props.qingyuan, 1)
  p.world.garden.plots[0] = { seed: 'grass', plantedAt: 0, readyAt: 1 }
  harvestHerb(p, 0, 2, () => 0.9)
  assert.equal(p.props.qingyuan, 3)
  harvestHerb(p, 0, 2)
  assert.equal(p.props.qingyuan, 3)
  setAutomation(p, 'cultivate')
  for (let i = 0; i < 30; i++) cultivateTick(p)
  assert.equal(p.props.qingyuan, 5)
  setAutomation(p, 'idle')
  p.world.opportunity = { kind: 'meeting', npc: 'yao', mapId: 'wutan', level: 8 }
  resolveOpportunity(p, 'clue')
  assert.equal(p.props.qingyuan, 8)
})

test('情缘补给只能领取一次，升级受境界、材料和战斗约束，未同行升级不增加人物属性', () => {
  const p = makePlayer(9)
  initializeWorld(p)
  assert.equal(claimBondStarter(p), '')
  const initial = p.props.qingyuan
  assert.ok(claimBondStarter(p))
  assert.equal(p.props.qingyuan, initial)
  const item = addPartner(p, '小医仙', 0)
  assert.equal(partnerUpgradeCost(item), 8)
  const attack = p.attack
  assert.equal(upgradePartner(p, item.name), '')
  assert.equal(item.level, 1)
  assert.equal(p.props.qingyuan, initial - 8)
  assert.equal(p.attack, attack)
  p.world.encounter = { name: '战斗中' }
  const snapshot = JSON.stringify(p)
  assert.ok(upgradePartner(p, item.name))
  assert.equal(JSON.stringify(p), snapshot)
})

test('多位伴侣可同时结伴、三位同行按主位和支援计算，反复切换和读档不叠加属性或回血', () => {
  const p = makePlayer(63)
  initializeWorld(p)
  for (const id of ['xuner', 'yun', 'nalan', 'medusa']) {
    meetNpc(p, id).affinity = 1000
    assert.equal(formBond(p, id), '')
  }
  assert.equal(partnerRows(p).length, 4)
  assert.equal(setPartnerTeam(p, ['古薰儿', '云韵', '纳兰嫣然']), '')
  const bonus = partnerContribution(p)
  const base = baseAttributes(p.level)
  assert.ok(bonus.attack <= Math.ceil(base.attack * 0.18))
  assert.ok(bonus.health <= Math.ceil(base.health * 0.22))
  const snapshot = { attack: p.attack, defense: p.defense, maxHealth: p.maxHealth }
  p.health = 10
  for (let i = 0; i < 50; i++) {
    assert.equal(setPartnerTeam(p, ['云韵', '纳兰嫣然', '古薰儿']), '')
    assert.equal(setPartnerTeam(p, ['古薰儿', '云韵', '纳兰嫣然']), '')
    initializeWorld(p)
  }
  assert.deepEqual({ attack: p.attack, defense: p.defense, maxHealth: p.maxHealth }, snapshot)
  assert.equal(p.health, 10)
  assert.equal(partnerRows(p).length, 4)
  assert.ok(setPartnerTeam(p, ['古薰儿', '云韵', '纳兰嫣然', '美杜莎']))
  assert.ok(setPartnerTeam(p, ['古薰儿', '古薰儿']))
})

test('十位可结缘故人均能通过野外事件结识，只有选中的三位提供道侣属性与羁绊加成', () => {
  const p = makePlayer(63)
  initializeWorld(p)
  const candidates = worldNpcs.filter(npc => npc.romantic)
  assert.equal(candidates.length, 10)
  const kinds = Object.keys(wildEventTypes).filter(id => !wildEventTypes[id].map)
  const before = p.attack
  for (const [index, npc] of candidates.entries()) {
    const rolls = [(kinds.indexOf('rescue') + 0.5) / kinds.length, (index + 0.5) / candidates.length]
    createWildEvent(p, () => rolls.shift())
    assert.equal(p.world.opportunity.npc, npc.id)
    p.world.opportunity = null
    meetNpc(p, npc.id).affinity = 1000
    assert.equal(formBond(p, npc.id), '')
  }
  assert.equal(partnerRows(p).length, 10)
  assert.equal(p.attack, before)
  assert.equal(partnerCultivationBonus(p), 0)
  assert.equal(setPartnerTeam(p, ['古薰儿', '云韵', '纳兰嫣然']), '')
  const stats = { attack: p.attack, defense: p.defense, maxHealth: p.maxHealth, bonus: partnerContribution(p) }
  p.props.qingyuan = 1000
  for (const partner of p.wifes.filter(item => !p.world.bonds.team.includes(item.name))) {
    partner.level = 0
    partner.bondExperience = 80
    assert.equal(upgradePartner(p, partner.name), '')
    assert.equal(interactPartner(p, partner.name, 'chat', 100000), '')
  }
  assert.equal(partnerCultivationBonus(p), 0)
  assert.deepEqual({ attack: p.attack, defense: p.defense, maxHealth: p.maxHealth, bonus: partnerContribution(p) }, stats)
  initializeWorld(p)
  assert.equal(partnerRows(p).length, 10)
  assert.deepEqual(p.world.bonds.team, ['古薰儿', '云韵', '纳兰嫣然'])
  const snapshot = JSON.stringify(p)
  assert.ok(setPartnerTeam(p, ['古薰儿', '云韵', '纳兰嫣然', '美杜莎']))
  assert.equal(JSON.stringify(p), snapshot)
})

test('结缘十位上限计入主位和旧道侣，满员失败不改好感与资源，旧档超额记录完整保留', () => {
  const p = makePlayer(63)
  p.wife = applyCompanionBalance({ name: '旧主位', level: 0 })
  for (let i = 0; i < 8; i++) addPartner(p, `旧道侣${i}`, 0)
  initializeWorld(p)
  meetNpc(p, 'xuner').affinity = 1000
  assert.equal(formBond(p, 'xuner'), '')
  assert.equal(partnerRows(p).length, 10)
  meetNpc(p, 'yun').affinity = 1000
  const snapshot = JSON.stringify(p)
  assert.match(formBond(p, 'yun'), /最多.*10/)
  assert.equal(JSON.stringify(p), snapshot)
  assert.equal(formBond(p, 'xuner'), '你们已经结为伴侣')
  addPartner(p, '额外旧道侣', 0)
  initializeWorld(p)
  assert.equal(partnerRows(p).length, 11)
  assert.match(formBond(p, 'yun'), /最多.*10/)
  assert.equal(setPartnerTeam(p, ['旧主位', '旧道侣0', '额外旧道侣']), '')
  assert.equal(partnerRows(p).length, 11)
})

test('旧单道侣加成迁移不重复，旧NPC支持赠礼；共同互动有冷却、羁绊上限且可培养支援', () => {
  const p = makePlayer(18)
  const wife = applyCompanionBalance({ name: '旧日道侣', level: 9 })
  p.wife = wife
  for (const key of ['attack', 'defense', 'critical', 'dodge']) p[key] += wife[key]
  p.maxHealth += wife.health
  const before = p.attack
  initializeWorld(p)
  assert.equal(p.attack, before)
  assert.deepEqual(p.world.bonds.team, [wife.name])
  assert.equal(partnerRows(p)[0].name, wife.name)
  p.props.money = 1000
  assert.equal(giveNpcGift(p, 'legacy:旧日道侣', 'money', 100000), '')
  assert.equal(interactPartner(p, wife.name, 'chat', 100000), '')
  const points = p.props.qingyuan
  assert.ok(interactPartner(p, wife.name, 'chat', 100001))
  assert.equal(p.props.qingyuan, points)
  for (let i = 1; i < 30; i++) interactPartner(p, wife.name, 'chat', 100000 + i * 300000)
  assert.equal(partnerRows(p)[0].bondLevel, 5)
  assert.ok(p.world.bonds.gifts.tea >= 0)
})

test('转生保留多道侣、礼物、情缘、装备属性与解锁进度，不能在机缘/战斗未结束时执行', () => {
  const p = makePlayer(102)
  initializeWorld(p)
  p.points = 0
  p.taskNum = 100
  claimBondStarter(p)
  addPartner(p, '古薰儿', 90)
  setPartnerTeam(p, ['古薰儿'])
  p.world.opportunity = { kind: 'meeting' }
  assert.ok(performReincarnation(p))
  assert.equal(p.level, 102)
  p.world.opportunity = null
  const before = { attack: p.attack, capacity: p.backpackCapacity, qingyuan: p.props.qingyuan, gifts: { ...p.world.bonds.gifts } }
  assert.equal(performReincarnation(p), '')
  assert.equal(p.level, 0)
  assert.equal(p.reincarnation, 1)
  assert.equal(p.attack, before.attack)
  assert.equal(p.backpackCapacity, before.capacity + 50)
  assert.equal(p.props.qingyuan, before.qingyuan)
  assert.deepEqual(p.world.bonds.gifts, before.gifts)
  initializeBonds(p)
  assert.equal(p.attack, before.attack)
  assert.equal(p.world.mapId, 'wutan')
})

test('各境界极端资质三人同行仍受预算限制，支援升级准确更新差额、专属礼物不能错送', () => {
  for (let level = 0; level <= 102; level++) {
    const p = makePlayer(level)
    initializeWorld(p)
    for (const name of ['古薰儿', '云韵', '美杜莎']) {
      const partner = addPartner(p, name)
      partner.rootBone = 100000
    }
    setPartnerTeam(p, ['古薰儿', '云韵', '美杜莎'])
    const bonus = partnerContribution(p), base = baseAttributes(level)
    assert.ok(bonus.attack <= Math.ceil(base.attack * 0.18))
    assert.ok(bonus.defense <= Math.ceil(base.defense * 0.18))
    assert.ok(bonus.health <= Math.ceil(base.health * 0.22))
    assert.ok(bonus.critical <= 0.01 && bonus.dodge <= 0.01)
  }
  const p = makePlayer(18)
  initializeWorld(p)
  addPartner(p, '古薰儿', 9)
  const support = addPartner(p, '云韵', 9)
  setPartnerTeam(p, ['古薰儿', '云韵'])
  p.props.qingyuan = 1000
  const before = p.attack, oldBonus = partnerContribution(p).attack
  assert.equal(upgradePartner(p, support.name), '')
  assert.equal(p.attack - before, partnerContribution(p).attack - oldBonus)
  meetNpc(p, 'yao')
  p.world.bonds.gifts['xuner-token'] = 1
  const snapshot = JSON.stringify(p)
  assert.ok(giveNpcGift(p, 'yao', 'xuner-token', 100000))
  assert.equal(JSON.stringify(p), snapshot)
})

test('已通关副本专属礼物补发一次，首通奖励不双发，后续仍需概率掉落', () => {
  const p = makePlayer(63)
  p.world.trialClears['fallen-trial'] = 1
  initializeWorld(p)
  assert.equal(p.world.bonds.gifts['yun-token'], 1)
  initializeWorld(p)
  assert.equal(p.world.bonds.gifts['yun-token'], 1)
  rewardTrialGift(p, 'fallen-trial', false, () => 0.99)
  assert.equal(p.world.bonds.gifts['yun-token'], 1)
  rewardTrialGift(p, 'fallen-trial', false, () => 0)
  assert.equal(p.world.bonds.gifts['yun-token'], 2)
})

test('自由行走结识的同名NPC沿用好感与礼物偏好，可直接结伴，伴侣负面互动读档不回满', () => {
  const p = makePlayer(27)
  initializeWorld(p)
  p.npcs = [{ name: '古薰儿', favorability: 1000 }, { name: '药尘', favorability: 300 }]
  assert.equal(knownNpcRows(p).find(npc => npc.id === 'xuner').affinity, 1000)
  assert.equal(formBond(p, 'xuner'), '')
  assert.equal(partnerRows(p).length, 1)
  assert.ok(formBond(p, 'xuner'))
  claimBondStarter(p)
  assert.equal(giveNpcGift(p, 'yao', 'tea', 100000), '')
  assert.equal(p.props.qingyuan, 34)
  changeAffinity(p, 'xuner', -6)
  initializeWorld(p)
  assert.equal(knownNpcRows(p).find(npc => npc.id === 'xuner').affinity, 994)
})

test('旧档中主位与背包有同名道侣时保留较高培养进度，不用低级同名记录覆盖主位', () => {
  const p = makePlayer(63)
  p.wife = applyCompanionBalance({ name: '旧日道侣', level: 49 })
  p.wifes = [applyCompanionBalance({ name: '旧日道侣', level: 0 })]
  for (const key of ['attack', 'defense', 'critical', 'dodge']) p[key] += p.wife[key]
  p.maxHealth += p.wife.health
  const before = p.attack
  initializeWorld(p)
  assert.equal(p.attack, before)
  assert.equal(partnerRows(p)[0].level, 49)
  assert.equal(p.wife.level, 49)
  assert.equal(partnerRows(p).length, 1)
  assert.equal(p.wifes.length, 0)
})
