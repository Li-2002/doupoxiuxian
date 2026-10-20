import { worldNpcs, stoneTiers } from './douqiWorld.js'
import { trials, herbSeeds, combatSkills, wildEventTypes } from './worldContent.js'
import { enemyAttributes, calculateStrike, applyCompanionBalance, clamp } from './balance.js'
import { addWorldLog, gainCultivation, currentMap, grantFlame } from './worldProgress.js'
import { levelNames, cultivationPerTick } from './realms.js'
import { addHerbs, spendHerbs, healWithHerb, initializeHerbs } from './herbs.js'
import { recordJourneyEvent, cultivationEfficiency } from './journey.js'

export const hasActiveTrial = player => ['fighting', 'ready'].includes(player.world.trial?.status)
export const meetNpc = (player, id) => {
  if (!worldNpcs.some(npc => npc.id === id)) return null
  player.world.social[id] ||= { affinity: player.world.relationships[id] || 0, metAt: Date.now(), partner: false, lastGiftAt: 0 }
  return player.world.social[id]
}
export const changeAffinity = (player, id, amount) => {
  const relation = meetNpc(player, id)
  if (!relation) return 0
  const current = knownNpcRows(player).find(npc => npc.id === id)?.affinity ?? relation.affinity
  relation.affinity = clamp(current + amount, 0, 1000)
  if (amount < 0) {
    for (const item of [...(player.npcs || []), ...(player.wifes || []), player.wife]) {
      if (item?.name === worldNpcs.find(npc => npc.id === id).name) item.favorability = relation.affinity
    }
  }
  player.world.relationships[id] = relation.affinity
  return relation.affinity
}
export const affinityLabel = affinity => affinity >= 1000 ? '生死相知' : affinity >= 600 ? '知己' : affinity >= 300 ? '信任' : affinity >= 100 ? '熟识' : '初识'

export const knownNpcRows = player => {
  const rows = worldNpcs.filter(npc => player.world.social[npc.id]).map(npc => ({ ...npc, ...player.world.social[npc.id], legacy: false }))
  const old = [...(player.npcs || []), ...(player.wifes || []), ...(player.wife?.name ? [player.wife] : [])]
  for (const npc of old) {
    if (!npc?.name) continue
    const row = rows.find(item => item.name === npc.name)
    const partner = player.wife?.name === npc.name || (player.wifes || []).some(wife => wife.name === npc.name)
    if (row) { row.affinity = Math.min(1000, Math.max(row.affinity, npc.favorability || 0)); row.partner ||= partner }
    else rows.push({ id: `legacy:${npc.name}`, name: npc.name, title: '旧日相识', affinity: Math.min(1000, npc.favorability || (partner ? 1000 : 0)), partner, legacy: true })
  }
  return rows.sort((a, b) => b.affinity - a.affinity)
}

export const GIFT_COOLDOWN = 60000
export const giftAffinity = { money: 4, herbs: 7 }
export const npcGiftCost = player => 30 * (1 + Math.floor(player.level / 9))
export const giftCooldownRemaining = (relation, now = Date.now()) =>
  relation.lastGiftAt ? Math.max(0, Math.ceil((GIFT_COOLDOWN - (now - relation.lastGiftAt)) / 1000)) : 0

export const giveNpcGift = (player, id, kind = 'money', now = Date.now()) => {
  const relation = player.world.social[id]
  if (!relation) return '尚未结识这位 NPC'
  if (!giftAffinity[kind]) return '请选择灵石或药草赠礼'
  if (hasActiveTrial(player)) return '请先退出试炼再赠礼'
  if (knownNpcRows(player).find(npc => npc.id === id)?.affinity >= 1000) return '好感已满'
  const remaining = giftCooldownRemaining(relation, now)
  if (remaining) return `刚刚赠过礼，请稍后再来（还需 ${remaining} 秒）`
  const cost = npcGiftCost(player)
  if (kind === 'herbs') {
    if (!spendHerbs(player, 2)) return '需要 2 份药草'
  } else {
    if (player.props.money < cost) return `需要 ${cost} 灵石`
    player.props.money -= cost
  }
  relation.lastGiftAt = now
  changeAffinity(player, id, giftAffinity[kind])
  addWorldLog(player, `赠礼${worldNpcs.find(npc => npc.id === id).name}，好感 +${giftAffinity[kind]}。`, 'npc')
  return ''
}

export const formBond = (player, id) => {
  if (hasActiveTrial(player) || player.world.encounter) return '请先结束战斗再结为伴侣'
  const npc = worldNpcs.find(item => item.id === id)
  const relation = player.world.social[id]
  if (!npc?.romantic || !relation) return '这位 NPC 无法结为伴侣'
  if (relation.partner) return '你们已经结为伴侣'
  if (relation.affinity < 1000) return '需要 1000 好感'
  if (player.level < (npc.min || 0)) return `需要达到${levelNames(npc.min)}`
  relation.partner = true
  if (player.wife?.name !== npc.name && !player.wifes.some(item => item.name === npc.name)) {
    player.wifes.push(applyCompanionBalance({ id: `partner-${id}`, name: npc.name, level: player.level, reincarnation: 0 }))
  }
  if (id === 'xuner') grantFlame(player, 'goldemperor', 'bond')
  addWorldLog(player, `与${npc.name}结为伴侣。可在洞府道侣页选择同行。${id === 'xuner' ? '她将金帝焚天炎火种交给了你。' : ''}`, 'npc')
  return ''
}

export const createWildEvent = (player, random = Math.random) => {
  const map = currentMap(player)
  const kinds = Object.keys(wildEventTypes).filter(id => !wildEventTypes[id].map || (wildEventTypes[id].map === map.id && player.level >= wildEventTypes[id].min))
  const kind = kinds[Math.floor(random() * kinds.length)]
  const candidates = worldNpcs.filter(npc => npc.romantic && player.level >= (npc.min || 0))
  const npc = kind === 'meeting' ? (random() < 0.35 ? worldNpcs.find(item => item.id === 'xuner') : worldNpcs.find(item => item.id === map.npc))
    : kind === 'rescue' ? candidates[Math.floor(random() * candidates.length)] : worldNpcs.find(item => item.id === map.npc)
  meetNpc(player, npc.id)
  player.world.opportunity = { kind, npc: npc.id, mapId: map.id, level: Math.min(map.max, Math.max(map.min, player.level)) }
  addWorldLog(player, `${wildEventTypes[kind].name}：遇见${npc.name}。${wildEventTypes[kind].text}`, 'npc')
}

export const opportunityChoices = player => {
  const kind = player.world.opportunity?.kind || 'meeting'
  const alternatives = [
    { id: 'bargain', label: '索取报酬', detail: '好感 −6；30% 几率得到 1～2 枚本区强化石，可能空手而归' },
    { id: 'leave', label: '暂不介入', detail: '好感不变，放弃这次机缘' }
  ]
  if (kind === 'insight' || kind === 'courier') return [
    { id: wildEventTypes[kind].choice, label: kind === 'insight' ? '静心参悟' : '代送家书', detail: kind === 'insight' ? '好感不变；可能得到修炼异火，参悟 5 次必得' : '好感 +3；30% 几率获得灵石酬谢' },
    ...alternatives
  ]
  if (kind === 'meeting') return [
    { id: 'learn', label: '请教修行', detail: '获得修为（随境界和地点变化），恢复 20% 气血，好感 +3' },
    { id: 'trade', label: '交易强化石', detail: '支付灵石换 4 枚强化石，好感 +3' },
    { id: 'clue', label: '打听异火', detail: '提高本区域随机异火概率，好感 +2' },
    ...alternatives
  ]
  return [
    { id: 'help', label: kind === 'rescue' ? '出手救援' : kind === 'escort' ? '护送商旅' : kind === 'herbs' ? '协助采药' : '并肩探险', detail: ['rescue', 'escort', 'ruins'].includes(kind) ? '需要战斗，获胜好感 +12～18' : '消耗 10% 气血，获得药草与好感 +7' },
    { id: 'pay', label: '赠资解困', detail: '支付灵石，好感 +5' },
    ...alternatives
  ]
}

export const resolveOpportunity = (player, choice, random = Math.random) => {
  const event = player.world.opportunity
  if (!event || !opportunityChoices(player).some(item => item.id === choice)) return false
  const npc = worldNpcs.find(item => item.id === event.npc)
  const cost = 30 * (event.level + 1)
  if (['trade', 'pay'].includes(choice) && player.props.money < cost) return false
  player.world.opportunity = null
  if (choice === 'leave') { addWorldLog(player, `与${npc.name}暂别，继续赶路。`, 'npc'); return true }
  if (choice === 'bargain') {
    changeAffinity(player, npc.id, -6)
    const count = random() < 0.3 ? 1 + Math.floor(random() * 2) : 0
    const stone = stoneTiers[currentMap(player).stone]
    player.props[stone.key] += count
    addWorldLog(player, `向${npc.name}索取报酬，好感 −6。${count ? `获得 ${count} 枚${stone.name}。` : '对方拒绝了，这次没有获得物品。'}`, 'npc')
    return true
  }
  recordJourneyEvent(player, event, choice)
  if (event.kind === 'courier' && choice === 'deliver') {
    changeAffinity(player, npc.id, 3)
    const money = random() < 0.3 ? 20 + event.level * 3 : 0
    player.props.money += money
    addWorldLog(player, `替${npc.name}送达家书，好感 +3。${money ? `获赠 ${money} 灵石。` : '这次没有额外酬谢。'}`, 'npc')
    return true
  }
  const special = wildEventTypes[event.kind]
  if (special?.fire && choice === special.choice) {
    player.world.opportunityProgress ||= {}
    const attempts = (player.world.opportunityProgress[special.fire] || 0) + 1
    player.world.opportunityProgress[special.fire] = attempts
    if ((random() < 0.2 || attempts >= 5) && grantFlame(player, special.fire, 'opportunity')) return true
    addWorldLog(player, `${special.name}完成，${player.world.flames.some(fire => fire.id === special.fire) ? '这道异火已经收集过了。' : `这次未获异火，机缘进度 ${attempts} / 5。`}`, 'npc')
    return true
  }
  if (choice === 'trade') {
    player.props.money -= cost
    player.props[stoneTiers[currentMap(player).stone].key] += 4
    changeAffinity(player, npc.id, 3)
  } else if (choice === 'pay') {
    player.props.money -= cost
    changeAffinity(player, npc.id, 5)
  } else if (choice === 'learn') {
    gainCultivation(player, Math.min(player.maxCultivation * 0.15, cultivationPerTick(player.level) * 15) * cultivationEfficiency(player))
    player.health = Math.min(player.maxHealth, player.health + Math.round(player.maxHealth * 0.2))
    changeAffinity(player, npc.id, 3)
  } else if (choice === 'clue') {
    player.world.clues[event.mapId] = (player.world.clues[event.mapId] || 0) + 3
    changeAffinity(player, npc.id, 2)
  } else if (event.kind === 'herbs') {
    player.health = Math.max(1, player.health - Math.round(player.maxHealth * 0.1))
    addHerbs(player, 'grass', 2)
    changeAffinity(player, npc.id, 7)
  } else {
    const favor = { rescue: 18, escort: 12, ruins: 15 }[event.kind] || 12
    player.world.encounter = { ...enemyAttributes(event.level, { health: 1.05, attack: 1, defense: 0.8 }),
      name: event.kind === 'rescue' ? '拦路恶徒' : event.kind === 'escort' ? '伏道魔兽' : '洞府守卫',
      rounds: 0, kind: 'event', event: { npc: npc.id, favor } }
    addWorldLog(player, `为${npc.name}挺身而出，战胜${player.world.encounter.name}才能化解危机。`, 'combat')
    return true
  }
  addWorldLog(player, `与${npc.name}完成${opportunityChoices({ world: { opportunity: event } }).find(item => item.id === choice)?.label || '机缘'}，好感提升。`, 'npc')
  return true
}

export const claimSeedlings = (player, now = Date.now()) => {
  const garden = player.world.garden
  if (garden.helped) return '初始种苗已经领取过了'
  if (garden.plots.some(Boolean)) return '请先收获当前药草'
  garden.helped = true
  garden.plots = [0, 1, 2].map(() => ({ seed: 'grass', plantedAt: now, readyAt: now + 60000 }))
  addWorldLog(player, '领取三株凝血草种苗，药圃已种满。', 'npc')
  return ''
}
export const plantHerb = (player, index, seedId, now = Date.now()) => {
  const seed = herbSeeds.find(item => item.id === seedId)
  const garden = player.world.garden
  if (!seed || index < 0 || index >= 3 || garden.plots[index]) return '此药畦无法种植'
  if (player.level < seed.min) return `需要达到${levelNames(seed.min)}`
  if (player.props.money < seed.cost) return '灵石不足'
  player.props.money -= seed.cost
  garden.plots[index] = { seed: seed.id, plantedAt: now, readyAt: now + seed.seconds * 1000 }
  return ''
}
export const harvestHerb = (player, index, now = Date.now(), random = Math.random) => {
  const garden = player.world.garden
  const plot = garden.plots[index]
  if (!plot || now < plot.readyAt) return '药草尚未成熟'
  const seed = herbSeeds.find(item => item.id === plot.seed)
  garden.plots[index] = null
  addHerbs(player, seed.id, seed.yield)
  garden.harvests++
  garden.pendingCultivation += Math.floor(Math.min(player.maxCultivation * 0.025, cultivationPerTick(player.level) * 3 * (herbSeeds.indexOf(seed) + 1)))
  settleGardenCultivation(player)
  if (!garden.visitor && random() < 0.12) {
    garden.visitor = { arrivedAt: now }
    meetNpc(player, 'huanong')
    addWorldLog(player, '药香引来华农老人。他愿以草木之道考验你的心性。', 'npc')
  }
  addWorldLog(player, `收获${seed.name}，获得 ${seed.yield} 份药草，已存入背包。`, 'loot')
  return ''
}
export const settleGardenCultivation = player => {
  if (hasActiveTrial(player) || player.world.encounter || !player.world.garden.pendingCultivation) return
  const amount = player.world.garden.pendingCultivation
  player.world.garden.pendingCultivation = 0
  gainCultivation(player, amount)
}
export const helpGardenVisitor = (player, random = Math.random) => {
  if (hasActiveTrial(player)) return '请先退出试炼再接受考验'
  const garden = player.world.garden
  if (!garden.visitor) return '华农老人尚未到访'
  if (!spendHerbs(player, 6)) return '需要 6 份药草完成考验'
  garden.visitor = null
  changeAffinity(player, 'huanong', 9)
  if (random() < 0.18 && grantFlame(player, 'life', 'garden')) return '华农老人认可了你的用心，赠予生灵之焱火种！'
  player.props.money += 60
  addWorldLog(player, '通过华农老人的考验，获赠 60 灵石；这次没有获得异火。', 'npc')
  return '考验完成，获得 60 灵石；这次没有获得异火。'
}
export const useHerbs = (player, action, id) => {
  if (hasActiveTrial(player) || player.world.encounter) return '战斗期间无法使用药草'
  if (action === 'heal') return healWithHerb(player, id)
  if (action !== 'sell') return '请选择使用或出售药草'
  initializeHerbs(player)
  const seed = id ? herbSeeds.find(item => item.id === id) : herbSeeds.find(item => player.props[item.key] > 0)
  const count = Math.min(5, seed ? player.props[seed.key] : 0)
  if (!count || !spendHerbs(player, count, seed.id)) return '药草不足'
  player.props.money += count * seed.sell
  return ''
}

export const trainSkill = (player, id) => {
  if (hasActiveTrial(player) || player.world.encounter) return '请先结束战斗再修习斗技'
  const skill = combatSkills.find(item => item.id === id)
  if (!skill || player.level < skill.min) return '境界不足'
  if (player.world.flames.filter(fire => fire.refined).length < (skill.flames || 0)) return '需要炼化两道异火'
  const level = player.world.skills[id] || 0
  if (level >= 5) return '斗技已修至五重'
  const cost = 20 * (skill.min + 1) * (level + 1)
  if (player.props.money < cost) return `需要 ${cost} 灵石`
  player.props.money -= cost
  player.world.skills[id] = level + 1
  if (!level) player.world.skillId = id
  return ''
}

export const trialEnemy = (trialId, stage) => {
  const trial = trials.find(item => item.id === trialId)
  const boss = stage === trial.rooms - 1
  const stats = enemyAttributes(trial.min, {
    health: (boss ? 2.4 : 1.1 + stage * 0.08) * trial.difficulty,
    attack: (boss ? 1.7 : 0.9 + stage * 0.035) * trial.difficulty,
    defense: (boss ? 1.2 : 0.8 + stage * 0.03) * trial.difficulty
  })
  return { ...stats, name: boss ? trial.boss : trial.enemies[stage], boss, rounds: 0 }
}
export const startTrial = (player, id) => {
  const trial = trials.find(item => item.id === id)
  if (!trial || player.level < trial.min) return `需要达到${levelNames(trial?.min || 0)}`
  if (hasActiveTrial(player)) return '请先完成或离开当前试炼'
  if (player.world.encounter || player.world.opportunity) return '请先结束当前野外战斗或机缘'
  if (player.health < player.maxHealth * 0.5) return '气血不足一半，请先回营疗伤'
  player.world.mode = 'idle'
  player.world.trial = { id, stage: 0, status: 'fighting', enemy: trialEnemy(id, 0), auto: false, lastAttack: null }
  player.world.lastTick = Date.now()
  addWorldLog(player, `进入${trial.name}。连续 ${trial.rooms} 关，关间仅恢复 10% 气血。`, 'system')
  return ''
}
export const nextTrialStage = player => {
  const run = player.world.trial
  if (run?.status !== 'ready') return false
  run.stage++
  run.enemy = trialEnemy(run.id, run.stage)
  run.status = 'fighting'
  return true
}
export const trialStep = (player, random = Math.random) => {
  const run = player.world.trial
  if (!run) return false
  if (run.status === 'ready') return run.auto ? nextTrialStage(player) : false
  if (run.status !== 'fighting') return false
  const enemy = run.enemy
  enemy.rounds++
  const attack = calculateStrike(player, enemy, { round: enemy.rounds, random })
  enemy.health = Math.max(0, enemy.health - attack.damage)
  run.lastAttack = attack
  player.world.lastAttack = attack
  if (enemy.health <= 0) {
    const definition = trials.find(item => item.id === run.id)
    if (run.stage === definition.rooms - 1) {
      const first = !player.world.trialClears[run.id]
      player.world.trialClears[run.id] = (player.world.trialClears[run.id] || 0) + 1
      run.status = 'cleared'
      run.auto = false
      if (first) grantFlame(player, definition.fire, 'trial')
      player.props.money += (definition.min + 1) * (first ? 60 : 12)
      player.props[stoneTiers[Math.min(5, Math.floor(definition.min / 18))].key] += first ? 8 : 2
      gainCultivation(player, player.maxCultivation * (first ? 0.5 : 0.1))
      addWorldLog(player, `${definition.name}通关！${first ? '首通获得专属异火火种。' : '获得再次通关奖励，异火不重复发放。'}`, 'flame')
    } else {
      run.status = 'ready'
      player.health = Math.min(player.maxHealth, player.health + Math.round(player.maxHealth * 0.1))
      addWorldLog(player, `试炼第 ${run.stage + 1} 关通过，恢复 10% 气血。`, 'combat')
    }
    return true
  }
  enemy.skillCoefficient = enemy.boss && enemy.rounds % 4 === 0 ? 1.3 : 1
  const counter = calculateStrike(enemy, player, { round: enemy.rounds, random })
  player.health = Math.max(0, player.health - counter.damage)
  if (player.health <= 0 || enemy.rounds >= 40) {
    run.status = 'failed'
    run.auto = false
    addWorldLog(player, `在试炼第 ${run.stage + 1} 关${player.health <= 0 ? '落败' : '久战未胜'}。本次关卡进度重置，已得装备保留。`, 'system')
  }
  return true
}
export const leaveTrial = player => {
  if (!player.world.trial) return
  player.world.trial.status = 'left'
  player.world.trial.auto = false
  addWorldLog(player, '退出试炼。本次关卡进度不保留，可整备后重新挑战。', 'system')
}
export const restAtCamp = player => {
  if (hasActiveTrial(player) || player.world.encounter) return '请先退出战斗或试炼'
  player.health = Math.min(player.maxHealth, player.health + Math.max(20, Math.round(player.maxHealth * 0.2)))
  return ''
}
