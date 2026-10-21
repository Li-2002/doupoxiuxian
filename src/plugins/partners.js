import { giftCatalog, MAX_PARTNER_TEAM, PARTNER_INTERACTION_COOLDOWN, trialGiftRewards } from './partnerContent.js'
import { worldNpcs } from './douqiWorld.js'
import { applyCompanionBalance, baseAttributes, combatScore } from './balance.js'
import { addWorldLog } from './worldProgress.js'
import { spendHerbs } from './herbs.js'
import { maxLv, levelNames } from './realms.js'

const keys = ['attack', 'defense', 'health', 'critical', 'dodge']
const ownedPartners = player => {
  const unique = new Map()
  for (const item of [player.wife, ...(player.wifes || [])].filter(item => item?.name)) {
    const previous = unique.get(item.name)
    if (!previous || item.level > previous.level || (item.level === previous.level && (item.bondExperience || 0) > (previous.bondExperience || 0))) unique.set(item.name, item)
  }
  return [...unique.values()]
}
const busy = player => player.world.encounter || ['fighting', 'ready'].includes(player.world.trial?.status) ? '请先结束战斗或退出试炼' : ''

export const initializeBonds = player => {
  player.props.qingyuan ??= 0
  if (player.world.bonds) return player.world.bonds
  player.world.bonds = {
    team: player.wife?.name ? [player.wife.name] : [],
    applied: Object.fromEntries(keys.map(key => [key, player.wife?.[key] || 0])),
    gifts: Object.fromEntries(giftCatalog.map(gift => [gift.id, 0])),
    starterClaimed: false, battles: 0, cultivationTicks: 0
  }
  const all = ownedPartners(player), main = player.world.bonds.team[0]
  player.wife = all.find(item => item.name === main) || {}
  player.wifes = all.filter(item => item.name !== main)
  for (const [trial, gift] of Object.entries(trialGiftRewards)) {
    if (player.world.trialClears[trial]) player.world.bonds.gifts[gift] = 1
  }
  syncPartnerBonus(player)
  return player.world.bonds
}

export const partnerContribution = player => {
  const bonds = initializeBonds(player)
  const members = bonds.team.map(name => ownedPartners(player).find(item => item.name === name)).filter(Boolean).slice(0, MAX_PARTNER_TEAM)
  const budget = baseAttributes(Math.max(0, ...members.map(item => item.level)), Math.max(0, ...members.map(item => item.reincarnation || 0)))
  const caps = { attack: Math.ceil(budget.attack * 0.18), defense: Math.ceil(budget.defense * 0.18), health: Math.ceil(budget.health * 0.22), critical: 0.01, dodge: 0.01 }
  return Object.fromEntries(keys.map(key => [key, Math.min(caps[key], Number(members.reduce((sum, item, index) => sum + (item[key] || 0) * (index ? 0.25 : 1), 0).toFixed(key === 'critical' || key === 'dodge' ? 6 : 0)))]))
}

export const syncPartnerBonus = player => {
  if (!player.world.bonds) return initializeBonds(player)
  const bonds = player.world.bonds
  for (const item of ownedPartners(player)) applyCompanionBalance(item)
  const bonus = partnerContribution(player)
  for (const key of keys) {
    const stat = key === 'health' ? 'maxHealth' : key
    player[stat] = Number((player[stat] + bonus[key] - bonds.applied[key]).toFixed(6))
  }
  bonds.applied = bonus
  player.health = Math.min(player.health, player.maxHealth)
  player.score = combatScore(player)
}

export const partnerRows = player => {
  const bonds = initializeBonds(player)
  return ownedPartners(player).map(item => ({ ...item,
    npcId: worldNpcs.find(npc => npc.name === item.name)?.id || `legacy:${item.name}`,
    bondLevel: Math.min(5, 1 + Math.floor((item.bondExperience || 0) / 20)),
    teamIndex: bonds.team.indexOf(item.name)
  }))
}

export const partnerCultivationBonus = player => Math.min(0.1, partnerRows(player).filter(item => item.teamIndex >= 0).reduce((sum, item) => sum + (item.bondLevel - 1) * 0.01, 0))

export const gainBondExperience = (player, name, amount) => {
  const partner = ownedPartners(player).find(item => item.name === name)
  if (partner) partner.bondExperience = Math.min(80, (partner.bondExperience || 0) + amount)
}

export const addQingyuan = (player, amount) => {
  initializeBonds(player)
  player.props.qingyuan += amount
}

const addGift = (player, id) => {
  const bonds = initializeBonds(player)
  bonds.gifts[id] = (bonds.gifts[id] || 0) + 1
  addWorldLog(player, `获得礼物「${giftCatalog.find(gift => gift.id === id).name}」，已存入礼匣。`, 'loot')
}

export const rewardBattleBond = (player, random = Math.random) => {
  const bonds = initializeBonds(player)
  addQingyuan(player, 1)
  bonds.battles++
  if (bonds.battles % 5 === 0 || random() < 0.2) addGift(player, giftCatalog[Math.floor(random() * 3)].id)
}

export const rewardGardenBond = (player, random = Math.random) => {
  addQingyuan(player, 2)
  if (random() < 0.35) addGift(player, 'sachet')
}

export const rewardCultivationBond = player => {
  const bonds = initializeBonds(player)
  bonds.cultivationTicks++
  if (bonds.cultivationTicks % 30 === 0) addQingyuan(player, 2)
}

export const rewardTrialGift = (player, id, first, random = Math.random) => {
  addQingyuan(player, first ? 30 : 12)
  if (trialGiftRewards[id] && (first || random() < 0.1)) addGift(player, trialGiftRewards[id])
}

export const claimBondStarter = player => {
  const bonds = initializeBonds(player)
  if (bonds.starterClaimed) return '情缘入门补给已经领取过了'
  bonds.starterClaimed = true
  addQingyuan(player, 30)
  for (const id of ['tea', 'sachet', 'scroll']) addGift(player, id)
  return ''
}

export const buyGift = (player, id, quantity = 1) => {
  const gift = giftCatalog.find(item => item.id === id)
  if (!gift?.price) return '专属礼物需通过对应副本获得'
  if (![1, 5].includes(quantity)) return '请选择购买 1 份或 5 份'
  const cost = gift.price * quantity
  if (player.props.money < cost) return '灵石不足'
  const bonds = initializeBonds(player)
  player.props.money -= cost
  bonds.gifts[id] = (bonds.gifts[id] || 0) + quantity
  return ''
}

export const setPartnerTeam = (player, names) => {
  if (busy(player)) return busy(player)
  if (names.length > MAX_PARTNER_TEAM) return '最多选择 3 位道侣同行'
  if (new Set(names).size !== names.length) return '同一位道侣不能重复同行'
  const all = ownedPartners(player)
  if (names.some(name => !all.some(item => item.name === name))) return '请先与这位故人结为道侣'
  const bonds = initializeBonds(player)
  bonds.team = [...names]
  player.wife = all.find(item => item.name === names[0]) || {}
  player.wifes = all.filter(item => item.name !== names[0])
  syncPartnerBonus(player)
  return ''
}

export const partnerUpgradeCost = item => 8 + Math.max(0, item.level) * 2
export const upgradePartner = (player, name) => {
  if (busy(player)) return busy(player)
  const item = ownedPartners(player).find(item => item.name === name)
  if (!item) return '尚未与这位故人结为道侣'
  if (item.level >= Math.min(player.level, maxLv)) return '道侣已达到当前人物境界，先提升自身境界'
  const cost = partnerUpgradeCost(item)
  initializeBonds(player)
  if (player.props.qingyuan < cost) return `情缘点不足，需要 ${cost} 点；可通过历练、收获、修炼和互动获得`
  player.props.qingyuan -= cost
  item.level++
  applyCompanionBalance(item)
  syncPartnerBonus(player)
  addWorldLog(player, `${item.name}提升至${levelNames(item.level)}，消耗 ${cost} 情缘。`, 'npc')
  return ''
}

export const interactionRemaining = (item, now = Date.now()) => item.lastInteractAt ? Math.max(0, Math.ceil((item.lastInteractAt + PARTNER_INTERACTION_COOLDOWN - now) / 1000)) : 0
export const interactPartner = (player, name, action, now = Date.now(), random = Math.random) => {
  if (busy(player)) return busy(player)
  const item = ownedPartners(player).find(item => item.name === name)
  if (!item) return '请先结为道侣'
  if (!['chat', 'stroll'].includes(action)) return '请选择谈心或同游'
  if (item.lastInteractAt && interactionRemaining(item, now)) return '刚刚相伴过，请稍后再来（每位道侣间隔 5 分钟）'
  if (action === 'stroll' && !spendHerbs(player, 2)) return '同游准备需要 2 份药草'
  item.lastInteractAt = now
  addQingyuan(player, action === 'chat' ? 8 : 12)
  gainBondExperience(player, name, action === 'chat' ? 4 : 6)
  if (action === 'stroll' && random() < 0.25) addGift(player, 'tea')
  addWorldLog(player, `与${name}${action === 'chat' ? '谈心，情缘 +8，羁绊经验 +4' : '同游，情缘 +12，羁绊经验 +6'}。`, 'npc')
  return ''
}
