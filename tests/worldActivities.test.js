import test from 'node:test'
import assert from 'node:assert/strict'
import { makePlayer, makeItem, wearSet, seededRandom } from './fixtures.js'
import { heavenlyFlames, worldMaps } from '../src/plugins/douqiWorld.js'
import { trials } from '../src/plugins/worldContent.js'
import { calculateStrike, flameDamageProfile, baseAttributes, applyCompanionBalance } from '../src/plugins/balance.js'
import { initializeWorld, seekFlame, explorationStep, rewardMonster, setAutomation, advanceWorld, refineFlame, flameBonuses, cultivateTick } from '../src/plugins/douqi.js'
import { grantFlame } from '../src/plugins/worldProgress.js'
import { startTrial, trialStep, nextTrialStage, leaveTrial, hasActiveTrial, restAtCamp, claimSeedlings, plantHerb,
  harvestHerb, helpGardenVisitor, useHerbs, meetNpc, changeAffinity, giveNpcGift, formBond, knownNpcRows,
  resolveOpportunity, trainSkill, createWildEvent } from '../src/plugins/worldActivities.js'

const finishTrial = (player, seed = 1) => {
  const random = seededRandom(seed)
  for (let i = 0; i < 500 && hasActiveTrial(player); i++) {
    if (player.world.trial.status === 'ready') nextTrialStage(player)
    else trialStep(player, random)
  }
  return player.world.trial.status === 'cleared'
}

test('陨落心炎由心炎深渊首通获得，炼化后加快每次修炼且不重复叠加', () => {
  const p = wearSet(makePlayer(49), 'danger', 15)
  p.world.mapId = 'yunlan'
  p.props.money = 100000
  initializeWorld(p)
  p.world.skills.wave = 3
  p.world.skillId = 'wave'
  assert.equal(startTrial(p, 'fallen-trial'), '')
  assert.equal(finishTrial(p), true)
  assert.equal(p.world.bonds.gifts['yun-token'], 1)
  assert.equal(p.world.flames.filter(fire => fire.id === 'fallen').length, 1)
  assert.equal(flameBonuses(p).cultivation, 0)
  const before = p.cultivation
  cultivateTick(p)
  const ordinary = p.cultivation - before
  assert.equal(refineFlame(p, 'fallen'), '')
  const bonus = flameBonuses(p).cultivation
  assert.ok(bonus > 0.14 && bonus < 0.15)
  const after = p.cultivation
  cultivateTick(p)
  assert.ok(p.cultivation - after > ordinary)
  assert.ok(refineFlame(p, 'fallen'))
  initializeWorld(p)
  assert.equal(flameBonuses(p).cultivation, bonus)
})

test('所有专属异火不会从普通野外掉落，图鉴 24 道均有有效获取路径', () => {
  const p = makePlayer(102)
  for (const map of worldMaps) {
    for (let i = 0; i < 30; i++) seekFlame(p, map, () => 0)
  }
  assert.equal(p.world.flames.length, 16)
  for (const fire of heavenlyFlames) {
    assert.ok(fire.source.text.length > 10)
    if (fire.source.type !== 'wild') assert.ok(!p.world.flames.some(owned => owned.id === fire.id))
  }
  assert.equal(grantFlame(p, 'life', 'wild'), false)
})

test('三条火域门槛严格为五星大斗师、五星斗王、五星斗尊，丹塔为一星斗宗', () => {
  assert.deepEqual(trials.map(item => item.min), [31, 49, 76, 63])
  for (const trial of trials) {
    const p = makePlayer(trial.min - 1)
    assert.match(startTrial(p, trial.id), /需要达到/)
    assert.equal(p.world.trial, null)
    p.level++
    assert.equal(startTrial(p, trial.id), '')
    assert.equal(p.world.trial.stage, 0)
  }
})

test('1600 场固定种子整段副本模拟：达到门槛的裸装不能通关，高品质强化装备可通关', () => {
  for (const trial of trials) {
    const results = {}
    for (const quality of ['bare', 'info', 'purple', 'danger']) {
      let wins = 0
      for (let seed = 1; seed <= 100; seed++) {
        const p = makePlayer(trial.min)
        if (quality !== 'bare') wearSet(p, quality, quality === 'danger' ? 15 : quality === 'purple' ? 5 : 0)
        p.world.skills = { palm: 1, wave: 3, seal: 3, 'fire-lotus': 3 }
        p.world.skillId = trial.min >= 63 ? 'fire-lotus' : trial.min >= 45 ? 'seal' : 'wave'
        p.world.flames = [{ id: 'xuanhuang', refined: true }, { id: 'beasts', refined: true }]
        assert.equal(startTrial(p, trial.id), '')
        wins += Number(finishTrial(p, seed))
      }
      results[quality] = wins
    }
    assert.equal(results.bare, 0, trial.id)
    assert.equal(results.info, 0, trial.id)
    assert.ok(results.danger >= 90, trial.id)
    console.log(trial.id, results)
  }
})

test('首通专属异火只发一次，重试从第一关开始，退出不保留关内进度', () => {
  const p = wearSet(makePlayer(49), 'danger', 15)
  assert.equal(startTrial(p, 'lotus-trial'), '')
  assert.equal(finishTrial(p), true)
  assert.equal(p.world.flames.filter(item => item.id === 'lotus').length, 1)
  p.health = p.maxHealth
  startTrial(p, 'lotus-trial')
  assert.equal(finishTrial(p), true)
  assert.equal(p.world.flames.filter(item => item.id === 'lotus').length, 1)
  assert.equal(p.world.trialClears['lotus-trial'], 2)
  p.health = p.maxHealth
  startTrial(p, 'fallen-trial')
  leaveTrial(p)
  assert.equal(hasActiveTrial(p), false)
  startTrial(p, 'fallen-trial')
  assert.equal(p.world.trial.stage, 0)
})

test('试炼期间挂机、营地、药草和斗技修习不会额外治疗或增长属性', () => {
  const p = makePlayer(31)
  startTrial(p, 'lotus-trial')
  p.health -= 500
  const before = { health: p.health, cultivation: p.cultivation, attack: p.attack }
  setAutomation(p, 'hunt')
  setAutomation(p, 'cultivate')
  p.world.lastTick = 1000
  advanceWorld(p, 21000)
  assert.deepEqual({ health: p.health, cultivation: p.cultivation, attack: p.attack }, before)
  assert.equal(p.world.mode, 'idle')
  assert.match(restAtCamp(p), /先退出/)
  p.world.garden.herbs = 20
  assert.match(useHerbs(p, 'heal'), /战斗/)
  assert.match(trainSkill(p, 'wave'), /先结束/)
  p.world.garden.plots[0] = { seed: 'grass', plantedAt: 0, readyAt: 1 }
  assert.equal(harvestHerb(p, 0, 2, () => 0.9), '')
  assert.equal(p.world.garden.herbs, 23)
  assert.ok(p.world.garden.pendingCultivation > 0)
  assert.deepEqual({ health: p.health, cultivation: p.cultivation, attack: p.attack }, before)
})

test('斗尊之前绝不遭遇吞炎魔影；达到斗尊仍需随机遭遇且战胜后随机获得', () => {
  const before = makePlayer(71)
  explorationStep(before, () => 0)
  assert.notEqual(before.world.encounter?.kind, 'wildBoss')
  const p = makePlayer(72)
  explorationStep(p, () => 0)
  assert.equal(p.world.encounter.kind, 'wildBoss')
  assert.equal(p.world.flames.length, 0)
  rewardMonster(p, () => 0.9)
  assert.ok(!p.world.flames.some(item => item.id === 'void'))
  explorationStep(p, () => 0)
  rewardMonster(p, () => 0.1)
  assert.ok(p.world.flames.some(item => item.id === 'void'))
})

test('药圃真实成熟后方可收获，扣费和收获只进行一次，离线时间可自然成熟', () => {
  const p = makePlayer()
  assert.equal(claimSeedlings(p, 1000), '')
  assert.match(claimSeedlings(p, 1000), /已经/)
  assert.equal(harvestHerb(p, 0, 60999), '药草尚未成熟')
  assert.equal(harvestHerb(p, 0, 61000, () => 0.9), '')
  assert.equal(p.world.garden.herbs, 3)
  assert.equal(harvestHerb(p, 0, 62000), '药草尚未成熟')
  assert.equal(plantHerb(p, 0, 'grass', 62000), '灵石不足')
  p.props.money = 12
  assert.equal(plantHerb(p, 0, 'grass', 62000), '')
  assert.equal(p.props.money, 0)
  assert.equal(harvestHerb(p, 0, 1000000, () => 0.9), '')
  assert.equal(p.world.garden.herbs, 6)
})

test('收获引来华农老人，只有通过随机考验可获生灵之焱，不能重复领取', () => {
  const p = makePlayer()
  claimSeedlings(p, 0)
  harvestHerb(p, 0, 60000, () => 0)
  assert.ok(p.world.garden.visitor)
  assert.equal(helpGardenVisitor(p, () => 0), '需要 6 份药草完成考验')
  harvestHerb(p, 1, 60000, () => 0.9)
  assert.match(helpGardenVisitor(p, () => 0), /生灵之焱/)
  assert.ok(p.world.flames.some(item => item.id === 'life'))
  assert.equal(p.world.garden.herbs, 0)
  assert.equal(helpGardenVisitor(p, () => 0), '华农老人尚未到访')
  assert.equal(p.world.flames.length, 1)
})

test('古薰儿需认识且好感 1000 方能结伴赠火，伴侣保存在原道侣系统中', () => {
  const p = makePlayer(27)
  assert.match(formBond(p, 'xuner'), /无法/)
  meetNpc(p, 'xuner')
  assert.equal(formBond(p, 'xuner'), '需要 1000 好感')
  changeAffinity(p, 'xuner', 1000)
  assert.equal(formBond(p, 'xuner'), '')
  assert.ok(p.world.flames.some(fire => fire.id === 'goldemperor'))
  assert.ok(p.wifes.some(wife => wife.name === '古薰儿'))
  assert.equal(formBond(p, 'xuner'), '你们已经结为伴侣')
  assert.equal(p.wifes.length, 1)
})

test('野外救援须战胜才能增加额外好感，失利不发放奖励', () => {
  const p = makePlayer(9)
  meetNpc(p, 'xuner')
  p.world.opportunity = { kind: 'rescue', npc: 'xuner', mapId: 'mountains', level: 9 }
  assert.equal(resolveOpportunity(p, 'help'), true)
  assert.equal(p.world.social.xuner.affinity, 0)
  assert.equal(p.world.encounter.name, '拦路恶徒')
  p.attack = 9999
  explorationStep(p, () => 0.5)
  assert.equal(p.world.social.xuner.affinity, 18)
  assert.equal(p.world.eventWins, 1)
  p.world.opportunity = { kind: 'escort', npc: 'xuner', mapId: 'mountains', level: 9 }
  resolveOpportunity(p, 'help')
  p.world.encounter.attack = 999999
  p.attack = 1
  explorationStep(p, () => 0.5)
  assert.equal(p.world.social.xuner.affinity, 18)
})

test('五种野外事件均可生成，赠礼有冷却且认识的旧 NPC 全部进入好感表', () => {
  const p = makePlayer(49)
  const kinds = new Set()
  for (const roll of [0, 0.21, 0.41, 0.61, 0.81]) { createWildEvent(p, () => roll); kinds.add(p.world.opportunity.kind) }
  assert.equal(kinds.size, 5)
  meetNpc(p, 'xuner')
  p.props.money = 1000
  assert.equal(giveNpcGift(p, 'xuner', 'money', 40000), '')
  const money = p.props.money
  assert.match(giveNpcGift(p, 'xuner', 'money', 41000), /稍后/)
  assert.equal(p.props.money, money)
  p.npcs.push({ name: '旧相识', favorability: 450 })
  const rows = knownNpcRows(p)
  assert.ok(rows.some(row => row.name === '古薰儿' && row.affinity === 4))
  assert.ok(rows.some(row => row.name === '旧相识' && row.affinity === 450))
})

test('每道炼化异火独立附伤，24 火总增幅有界且不会二次暴击或递归叠乘', () => {
  const p = makePlayer(102)
  p.attack = 10000
  p.world.skillId = 'palm'
  p.critical = 0
  const target = { defense: 0, dodge: 0 }
  let previous = 0
  for (const fire of heavenlyFlames) {
    p.world.flames.push({ id: fire.id, refined: true })
    const profile = flameDamageProfile(p)
    const hit = calculateStrike(p, target, { random: () => 0.5 })
    assert.equal(hit.flames.length, p.world.flames.length)
    assert.ok(profile.total > previous && profile.total < 0.55)
    assert.equal(hit.damage, hit.baseDamage + hit.flames.reduce((sum, part) => sum + part.damage, 0))
    assert.ok(hit.damage <= hit.baseDamage * 1.55)
    previous = profile.total
  }
  p.attack = 1
  assert.ok(calculateStrike(p, target, { random: () => 0.5 }).damage <= 2)
})

test('统一防御与技能公式：高防仍能被击伤，冷却间隙普攻，暴击闪避概率有上限', () => {
  const p = makePlayer(45)
  p.world.skills.seal = 1
  p.world.skillId = 'seal'
  const target = { defense: 9999999, dodge: 0 }
  const hit = calculateStrike(p, target, { random: () => 0.5, round: 1 })
  assert.equal(hit.skill, '帝印诀')
  assert.ok(hit.baseDamage > p.attack * 0.2)
  assert.equal(calculateStrike(p, target, { random: () => 0.5, round: 2 }).skill, '普通攻击')
  target.dodge = 999
  p.critical = 999
  assert.equal(calculateStrike(p, target, { random: () => 0.6 }).isHit, true)
  assert.equal(calculateStrike(p, target, { random: () => 0.6 }).isCritical, false)
})

test('装备与灵宠成长有界，低级极品不会压过高境界基础，旧档迁移不丢收集', () => {
  const small = makeItem('weapon', 1, 'pink', 30)
  assert.ok(small.attack < baseAttributes(31).attack)
  const companion = { name: '灵宠', level: 1, rootBone: 50 }
  for (let level = 1; level <= 102; level++) {
    companion.level = level
    applyCompanionBalance(companion)
    assert.ok(companion.attack <= baseAttributes(level).attack * 0.13 + 1)
  }
  const p = makePlayer(31)
  p.world.version = 1
  delete p.world.balanceVersion
  p.attack = 99999999
  p.world.flames = [{ id: 'lotus', refined: true }]
  p.world.relationships = { yao: 75 }
  p.inventory = [makeItem('weapon', 31, 'purple', 10)]
  initializeWorld(p)
  assert.ok(p.attack < 1000)
  assert.equal(p.inventory[0].strengthen, 10)
  assert.equal(p.world.flames[0].id, 'lotus')
  assert.equal(p.world.social.yao.affinity, 750)
  const snapshot = JSON.stringify(p)
  initializeWorld(p)
  assert.equal(JSON.stringify(p), snapshot)
})
