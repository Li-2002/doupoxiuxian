import { ElNotification } from 'element-plus'

export { maxLv, levelNames } from './realms.js'

export const gameNotifys = data => {
  ElNotification.closeAll()
  ElNotification(data)
}

export const dropdownTypeObject = {
  id: '时间',
  level: '境界',
  score: '评分',
  health: '气血',
  attack: '攻击',
  defense: '防御',
  critical: '暴击',
  dodge: '闪避'
}
export const dropdownType = Object.entries(dropdownTypeObject).map(([type, name]) => ({ type, name }))

export const genre = {
  sutra: '法器',
  armor: '护甲',
  weapon: '神兵',
  accessory: '灵宝'
}

export const isAPP = location.host == 'appassets.androidplatform.net'

export const levels = {
  info: '黄阶',
  pink: '仙阶',
  danger: '神阶',
  purple: '天阶',
  primary: '地阶',
  success: '玄阶',
  warning: '帝阶'
}

export const propItemNames = {
  money: { name: '灵石', desc: '可以通过分解获得装备获得' },
  flying: { name: '传送符', desc: '可以通过赠送礼物给NPC获得' },
  rootBone: { name: '悟性丹', desc: '可以通过击败世界BOSS获得' },
  qingyuan: { name: '情缘', desc: '历练每胜1场+1，收获药草+2，修炼每分钟+2；友善奇遇、相伴互动和向任何已结识NPC赠礼也可获得，用于培养道侣' },
  currency: { name: '鸿蒙石', desc: '可以通过击败世界BOSS获得' },
  cultivateDan: { name: '培养丹', desc: '可以通过探索获得' },
  strengtheningStone: { name: '炼器石', desc: '分解装备获得，可替代黄阶强化石' },
  yellowStone: { name: '黄阶强化石', desc: '乌坦城、魔兽山脉掉落，用于 +0 至 +4 强化' },
  blackStone: { name: '玄阶强化石', desc: '塔戈尔沙漠、黑角域掉落，用于 +5 至 +9 强化' },
  earthStone: { name: '地阶强化石', desc: '迦南学院、云岚山掉落，用于 +10 至 +14 强化' },
  heavenStone: { name: '天阶强化石', desc: '落神涧、丹域星空掉落，用于 +15 至 +19 强化' },
  saintStone: { name: '圣阶强化石', desc: '远古兽域、远古遗迹掉落，用于 +20 至 +24 强化' },
  emperorStone: { name: '帝阶强化石', desc: '古帝洞府掉落，用于 +25 至 +29 强化' },
  bloodGrass: { name: '凝血草', desc: '回复最大气血的15%；自动打怪时低血量自动服用，也可在药圃使用' },
  iceFlameGrass: { name: '冰灵焰草', desc: '回复最大气血的25%；自动打怪时低血量自动服用，也可在药圃使用' },
  soulDew: { name: '养魂涎', desc: '回复最大气血的35%；自动打怪时低血量自动服用，也可在药圃使用' }
}

export const formatNumberToChineseUnit = number => {
  number = number > 0 ? Math.floor(number) : 0
  const units = ['', '万', '亿', '兆', '京', '垓', '秭', '穰', '沟', '涧', '正', '载', '极']
  const bigTenThousand = window.BigInt(10000)
  let num = window.BigInt(number)
  let unitIndex = 0
  let additionalUnits = ''
  while (num >= bigTenThousand) {
    num /= bigTenThousand
    unitIndex++
    if (unitIndex >= units.length - 1) {
      additionalUnits += '极'
      unitIndex = 0
    }
  }
  return num.toString() + units[unitIndex] + additionalUnits
}

export const smoothScrollToBottom = element => {
  const start = element.scrollTop
  const end = element.scrollHeight
  const duration = 300
  const startTime = performance.now()
  const scroll = () => {
    const currentTime = performance.now()
    const timeElapsed = currentTime - startTime
    const progress = Math.min(timeElapsed / duration, 1)
    element.scrollTop = start + (end - start) * easeInOutCubic(progress)
    if (progress < 1) window.requestAnimationFrame(scroll)
  }
  const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  window.requestAnimationFrame(scroll)
}
