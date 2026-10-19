import test from 'node:test'
import assert from 'node:assert/strict'
import { makePlayer, makeItem, seededRandom } from './fixtures.js'
import { applyEquipmentBalance, equipmentAttributes, combatScore, calculateStrike, syncExclusiveEquipment, exclusiveFlameBonus } from '../src/plugins/balance.js'
import { initializeWorld, strengthenEquipment } from '../src/plugins/douqi.js'
import equip from '../src/plugins/equip.js'
import equipAll from '../src/plugins/equipAll.js'
import { heavenlyFlames } from '../src/plugins/douqiWorld.js'
import { grantFlame } from '../src/plugins/worldProgress.js'
import { exclusiveEquipment, isExclusiveEquipment } from '../src/plugins/equipmentContent.js'
import { createStarterPack, claimStarterPack, redeemExclusiveSet, craftEquipment, craftCost,
  ascendEquipment, ascensionCost, transferEnhancement, transferCost } from '../src/plugins/equipmentGrowth.js'

const funded = (level = 63) => {
  const p = makePlayer(level)
  for (const key of Object.keys(p.props)) p.props[key] = 10000000
  return p
}

test('新手红色刷新始终四槽齐全且至少两件红装，不混入专属装备', () => {
  const random = seededRandom(123)
  for (let i = 0; i < 500; i++) {
    const pack = createStarterPack('red', random)
    assert.equal(new Set(pack.map(item => item.type)).size, 4)
    assert.ok(pack.filter(item => item.quality === 'danger').length >= 2)
    assert.ok(pack.every(item => item.level === 1 && !isExclusiveEquipment(item)))
  }
  const p = makePlayer()
  p.backpackCapacity = 3
  assert.match(claimStarterPack(p, createStarterPack()), /空间/)
  assert.equal(p.inventory.length, 0)
  assert.equal(p.isNewbie, undefined)
  p.backpackCapacity = 50
  assert.equal(claimStarterPack(p, createStarterPack()), '')
  assert.match(claimStarterPack(p, createStarterPack()), /领取/)
  assert.equal(p.inventory.length, 4)
})

test('兑换码准确校验、一次领取、背包不足不消耗机会，已领新手礼包仍可兑换', () => {
  const p = makePlayer(45)
  p.isNewbie = true
  assert.match(redeemExclusiveSet(p, 'invalid'), /兑换码/)
  p.backpackCapacity = 3
  assert.match(redeemExclusiveSet(p, 'dwdldhsglqfkssjqd'), /空间/)
  assert.equal(p.world.exclusiveRedeemed, false)
  p.backpackCapacity = 50
  assert.equal(redeemExclusiveSet(p, ' dwdldhsglqfkssjqd '), '')
  assert.deepEqual(p.inventory.map(item => item.name), ['文葬镰刀', '监兵凶神', '火链', '人皇幡'])
  assert.ok(p.inventory.every(item => item.lock && item.level === 45 && isExclusiveEquipment(item)))
  initializeWorld(p)
  assert.match(redeemExclusiveSet(p, 'dwdldhsglqfkssjqd'), /兑换过/)
  assert.equal(p.inventory.length, 4)
})

test('所有境界与强化级别：专属只在标准红装主属性上加10%，重算不累计，暴击闪避不放大', () => {
  const p = funded()
  redeemExclusiveSet(p, 'dwdldhsglqfkssjqd')
  for (let level = 1; level <= 102; level++) {
    for (const item of p.inventory) {
      item.level = level
      const normal = { ...item, exclusiveId: undefined, id: 'n' }
      const standard = equipmentAttributes(normal) // 'n' 的词条浮动为 1.00
      for (const n of [0, 5, 15, 30]) {
        item.strengthen = n
        applyEquipmentBalance(item)
        for (const key of ['attack', 'defense', 'health']) {
          assert.ok(Math.abs(item.initial[key] - standard[key] * 1.1) <= 1.1)
          assert.equal(item[key], Math.round(item.initial[key] * (1 + n * 0.04)))
        }
        assert.equal(item.critical, standard.critical)
        assert.equal(item.dodge, standard.dodge)
        const before = JSON.stringify(item)
        for (let i = 0; i < 10; i++) applyEquipmentBalance(item)
        assert.equal(JSON.stringify(item), before)
      }
    }
  }
})

test('随机掉落、强制红装和普通图鉴均无专属名称，伪造名称无专属倍率', () => {
  const names = new Set(exclusiveEquipment.map(item => item.name))
  for (const generator of ['equip_Weapons', 'equip_Armors', 'equip_Accessorys', 'equip_Sutras']) {
    for (let i = 0; i < 100; i++) assert.ok(!names.has(equip[generator](63, false, 'danger').name))
  }
  assert.ok(equipAll.drawPrize(63).every(group => group.data.every(item => !names.has(item.name))))
  const item = makeItem()
  item.name = '文葬镰刀'
  assert.equal(isExclusiveEquipment(item), false)
})

test('四件专属同时穿戴仍为逐件相加，人物属性与实际伤害不出现四次10%连乘', () => {
  for (const level of [1, 9, 31, 49, 76, 102]) {
    for (const strengthen of [0, 15, 30]) {
      const special = makePlayer(level)
      const ordinary = makePlayer(level)
      redeemExclusiveSet(special, 'dwdldhsglqfkssjqd')
      for (const item of special.inventory) {
        item.strengthen = strengthen
        applyEquipmentBalance(item)
        const normal = applyEquipmentBalance({ ...item, exclusiveId: undefined, id: 'n' })
        for (const key of ['attack', 'defense', 'critical', 'dodge']) {
          special[key] += item[key]
          ordinary[key] += normal[key]
        }
        special.maxHealth += item.health
        ordinary.maxHealth += normal.health
      }
      for (const key of ['attack', 'defense', 'maxHealth']) assert.ok(special[key] <= ordinary[key] * 1.1 + 1)
      const defender = { defense: ordinary.defense, dodge: 0 }
      const normalHit = calculateStrike(ordinary, defender, { random: () => 0.9 })
      const specialHit = calculateStrike(special, defender, { random: () => 0.9 })
      assert.ok(specialHit.damage <= normalHit.damage * 1.1 + 1)
    }
  }
})

test('定向打造受境界、材料和背包约束，只得到普通零强化装备', () => {
  const p = funded(62)
  const before = JSON.stringify(p)
  assert.match(craftEquipment(p, 'weapon', 'danger'), /境界/)
  assert.equal(JSON.stringify(p), before)
  p.level = 63
  const cost = craftCost(p, 'danger')
  const money = p.props.money
  assert.equal(craftEquipment(p, 'weapon', 'danger'), '')
  assert.equal(p.props.money, money - cost.money)
  assert.equal(p.inventory[0].quality, 'danger')
  assert.equal(p.inventory[0].strengthen, 0)
  assert.equal(p.inventory[0].level, 63)
  assert.equal(isExclusiveEquipment(p.inventory[0]), false)
  p.props.strengtheningStone = 0
  const snapshot = JSON.stringify(p)
  assert.match(craftEquipment(p, 'armor', 'info'), /不足/)
  assert.equal(JSON.stringify(p), snapshot)
  assert.match(craftEquipment(p, 'weapon', 'pink'), /品质/)
})

test('境界提升按目标公式重算，专属保留10%且不超人物境界，不重复扣费', () => {
  const p = funded(9)
  redeemExclusiveSet(p, 'dwdldhsglqfkssjqd')
  const item = p.inventory[0]
  item.strengthen = 12
  applyEquipmentBalance(item)
  p.level = 49
  const cost = ascensionCost(p, item)
  const money = p.props.money
  assert.equal(ascendEquipment(p, item), '')
  assert.equal(item.level, 49)
  assert.equal(item.strengthen, 12)
  assert.equal(isExclusiveEquipment(item), true)
  assert.equal(p.props.money, money - cost.money)
  const snapshot = JSON.stringify(p)
  assert.match(ascendEquipment(p, item), /已达到/)
  assert.equal(JSON.stringify(p), snapshot)
  assert.equal(ascendEquipment(p, { ...item, level: 1 }), '装备不存在')
})

test('强化传承是移动而非相加，材料准确扣除，穿戴属性只计算差额，不回复生命', () => {
  const p = funded(63)
  const source = makeItem('armor', 20, 'purple', 30)
  const target = makeItem('armor', 63, 'danger', 5)
  p.inventory.push(source)
  p.equipment.armor = target
  p.defense += target.defense
  p.maxHealth += target.health
  p.health = 50
  const beforeDefense = p.defense - target.defense
  const beforeMaxHealth = p.maxHealth - target.health
  const cost = transferCost(target, source)
  const money = p.props.money
  assert.equal(transferEnhancement(p, target, source), '')
  assert.equal(source.strengthen, 0)
  assert.equal(target.strengthen, 30)
  assert.equal(p.props.money, money - cost.money)
  assert.equal(p.defense, beforeDefense + target.defense)
  assert.equal(p.maxHealth, beforeMaxHealth + target.health)
  assert.equal(p.health, 50)
  assert.equal(p.score, combatScore(p))
  assert.match(transferEnhancement(p, target, source), /更高/)
})

test('专属可正常强化；战斗、锁定传承来源、类型不符与材料不足不会改变任何状态', () => {
  const p = funded(63)
  redeemExclusiveSet(p, 'dwdldhsglqfkssjqd')
  const item = p.inventory[0]
  assert.equal(strengthenEquipment(p, item, () => 0), '')
  assert.equal(item.strengthen, 1)
  const source = makeItem('weapon', 30, 'danger', 20)
  source.lock = true
  p.inventory.push(source)
  assert.match(transferEnhancement(p, item, source), /锁定/)
  p.world.encounter = { health: 100 }
  const snapshot = JSON.stringify(p)
  assert.match(ascendEquipment(p, item), /战斗/)
  assert.match(craftEquipment(p, 'weapon', 'danger'), /战斗/)
  assert.match(redeemExclusiveSet(p, 'dwdldhsglqfkssjqd'), /战斗/)
  assert.match(transferEnhancement(p, item, source), /战斗/)
  assert.equal(JSON.stringify(p), snapshot)
})

test('失败操作原子性：升境、传承材料不足及异槽传承均不扣费，背包满不打造', () => {
  const p = funded(63)
  const source = makeItem('weapon', 1, 'danger', 20)
  redeemExclusiveSet(p, 'dwdldhsglqfkssjqd')
  const target = p.inventory[0]
  target.level = 1
  applyEquipmentBalance(target)
  const armor = makeItem('armor', 1, 'danger', 30)
  p.inventory = [source, target, armor]
  const original = JSON.stringify(p)
  assert.match(transferEnhancement(p, target, armor), /同部位/)
  assert.equal(JSON.stringify(p), original)
  p.props.strengtheningStone = 0
  const noMaterials = JSON.stringify(p)
  assert.match(ascendEquipment(p, target), /不足/)
  assert.match(transferEnhancement(p, target, source), /不足/)
  assert.equal(JSON.stringify(p), noMaterials)
  p.backpackCapacity = 3
  const full = JSON.stringify(p)
  assert.match(craftEquipment(p, 'weapon', 'danger'), /空间/)
  assert.equal(JSON.stringify(p), full)
})

test('100次往返传承与穿戴升境不叠加属性、不制造强化等级或治疗', () => {
  const p = funded(63)
  const source = makeItem('armor', 63, 'danger', 30)
  redeemExclusiveSet(p, 'dwdldhsglqfkssjqd')
  const target = p.inventory.find(item => item.type === 'armor')
  p.inventory = p.inventory.filter(item => item !== target)
  target.level = 1
  target.lock = false
  applyEquipmentBalance(target)
  p.equipment.armor = target
  p.defense += target.defense
  p.maxHealth += target.health
  p.inventory.push(source)
  p.health = 20
  assert.equal(ascendEquipment(p, target), '')
  const snapshot = { defense: p.defense, maxHealth: p.maxHealth, health: p.health }
  for (let i = 0; i < 100; i++) {
    assert.equal(transferEnhancement(p, i % 2 ? source : target, i % 2 ? target : source), '')
    assert.equal(source.strengthen + target.strengthen, 30)
  }
  assert.deepEqual({ defense: p.defense, maxHealth: p.maxHealth, health: p.health }, snapshot)
  const saved = JSON.parse(JSON.stringify(p))
  initializeWorld(saved)
  assert.deepEqual({ defense: saved.defense, maxHealth: saved.maxHealth, health: saved.health }, snapshot)
})

test('普通装备只有强化成长，不接受境界提升且不随异火变化；失败不扣资源', () => {
  const p = funded(63)
  const item = makeItem('weapon', 1, 'danger', 15)
  p.inventory.push(item)
  const before = JSON.stringify(p)
  assert.match(ascendEquipment(p, item), /普通装备仅可强化/)
  assert.equal(JSON.stringify(p), before)
  const attrs = JSON.stringify(item)
  p.world.flames = heavenlyFlames.map(fire => ({ id: fire.id, refined: true }))
  syncExclusiveEquipment(p)
  assert.equal(JSON.stringify(item), attrs)
})

test('获得异火即同步穿戴和背包专属成长，重复火种不叠加、无额外治疗、重新载入幂等', () => {
  const p = funded(63)
  redeemExclusiveSet(p, 'dwdldhsglqfkssjqd')
  const weapon = p.inventory.shift()
  p.equipment.weapon = weapon
  p.attack += weapon.attack
  p.critical += weapon.critical
  p.health = 100
  const initialAttack = p.attack
  assert.equal(grantFlame(p, 'xuanhuang', 'wild'), true)
  assert.equal(weapon.flameCount, 1)
  assert.ok(p.attack > initialAttack)
  assert.ok(p.inventory.every(item => item.flameCount === 1))
  assert.equal(p.health, 100)
  const snapshot = JSON.stringify(p)
  assert.equal(grantFlame(p, 'xuanhuang', 'wild'), false)
  assert.equal(JSON.stringify(p), snapshot)
  for (let i = 0; i < 100; i++) syncExclusiveEquipment(p)
  assert.equal(JSON.stringify(p), snapshot)
  const saved = JSON.parse(snapshot)
  initializeWorld(saved)
  assert.equal(saved.attack, p.attack)
  assert.equal(saved.equipment.weapon.attack, weapon.attack)
})

test('102个境界、0至23道异火：专属成长线性有界，暴击闪避不成长，强化仍封顶30', () => {
  for (let level = 1; level <= 102; level++) {
    for (const entry of exclusiveEquipment) {
      const item = { ...entry, id: entry.id, exclusiveId: entry.id, level, quality: 'danger', strengthen: 30 }
      const ordinary = equipmentAttributes({ ...item, exclusiveId: undefined, id: 'n' })
      let previous = { attack: 0, defense: 0, health: 0 }
      for (let count = 0; count <= 23; count++) {
        item.flameCount = count
        applyEquipmentBalance(item)
        const ratio = 1.1 + count * 0.005
        for (const key of ['attack','defense','health']) {
          assert.ok(Math.abs(item.initial[key] - ordinary[key] * ratio) <= 1.2)
          assert.ok(item[key] >= previous[key])
          assert.equal(item[key], Math.round(item.initial[key] * 2.2))
        }
        assert.equal(item.critical, ordinary.critical)
        assert.equal(item.dodge, ordinary.dodge)
        previous = { ...item }
      }
      const capped = item.attack
      item.flameCount = 100000
      item.strengthen = 100000
      applyEquipmentBalance(item)
      assert.equal(item.attack, capped)
      assert.equal(item.strengthen, 30)
    }
  }
  assert.equal(exclusiveFlameBonus(23), 0.115)
  const p = funded(63)
  p.world.flames = [{ id:'xuanhuang' }, { id:'xuanhuang' }, { id:'invalid' }]
  redeemExclusiveSet(p, 'dwdldhsglqfkssjqd')
  assert.ok(p.inventory.every(item => item.flameCount === 1))
})
