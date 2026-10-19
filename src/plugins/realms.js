const numbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九']
const stages = ['斗者', '斗师', '大斗师', '斗灵', '斗王', '斗皇', '斗宗', '斗尊']

export const realmNames = [
  ...numbers.map(n => `斗之气${n}段`),
  ...stages.flatMap(stage => numbers.map(n => `${n}星${stage}`)),
  ...numbers.map(n => `${n}转斗尊巅峰`),
  '初级半圣', '中级半圣', '高级半圣',
  ...numbers.map(n => `${n}星斗圣`),
  '斗帝'
]

export const maxLv = realmNames.length - 1
export const levelNames = level => realmNames[Math.max(0, Math.min(maxLv, Math.floor(Number(level) || 0)))]
export const cultivationCost = (level, reincarnation = 0) =>
  Math.floor((100 + level * 80 + level * level * 12) * (1 + reincarnation * 0.5))
