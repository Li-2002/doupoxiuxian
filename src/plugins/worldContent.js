export const trials = [
  { id: 'lotus-trial', name: '焚天火域 · 地心莲境', min: 31, rooms: 5, difficulty: 1, fire: 'lotus', boss: '青莲火灵', enemies: ['熔岩守卫', '双首炎蛇', '地火傀儡', '青莲护卫'], desc: '深入地心五重关，击败青莲火灵。五星大斗师只是入场资格。' },
  { id: 'fallen-trial', name: '焚天火域 · 心炎深渊', min: 49, rooms: 5, difficulty: 1.16, fire: 'fallen', boss: '无形心炎兽', enemies: ['心魔幻影', '火蜥长老', '炎塔守卫', '心火分身'], desc: '连续五关考验续航与伤害，首通获得陨落心炎，炼化后加快修炼。' },
  { id: 'purelotus-trial', name: '焚天火域 · 妖火幻境', min: 76, rooms: 7, difficulty: 1.3, fire: 'purelotus', boss: '净莲火灵', enemies: ['火奴', '幻境守卫', '妖火战将', '净莲幻身', '红莲魔将', '妖火圣卫'], desc: '七重幻境逐层增强，五星斗尊也需高阶装备和斗技才能应对。' },
  { id: 'danta', name: '丹塔 · 星域试炼', min: 63, rooms: 6, difficulty: 1.22, fire: 'stars', boss: '三千星空炎龙', enemies: ['丹雷傀儡', '星域守卫', '银翼丹兽', '星火幻灵', '炎龙护卫'], desc: '通过丹塔六重试炼，在星域收服三千焱炎火。' }
]

export const flameAcquisition = {
  lotus: { type: 'trial', trial: 'lotus-trial', min: 31, text: '五星大斗师起，通关焚天火域·地心莲境五关，首通获得。' },
  fallen: { type: 'trial', trial: 'fallen-trial', min: 49, text: '五星斗王起，通关焚天火域·心炎深渊五关，首通获得；炼化后加快修炼。' },
  purelotus: { type: 'trial', trial: 'purelotus-trial', min: 76, text: '五星斗尊起，通关焚天火域·妖火幻境七关，首通获得。' },
  stars: { type: 'trial', trial: 'danta', min: 63, text: '一星斗宗起，通关丹塔·星域试炼六关，首通获得。' },
  life: { type: 'garden', min: 36, text: '成熟药草收获时有 12% 几率遇见华农老人；接受考验有 18% 几率获赠火种。' },
  goldemperor: { type: 'bond', min: 27, text: '结识古薰儿，好感达到 1000 后结为伴侣，由她赠送火种。' },
  void: { type: 'boss', min: 72, text: '斗尊起，野外每次寻敌有 1.5% 几率遇见吞炎魔影；战胜后有 25% 几率获得。' },
  serenity: { type: 'opportunity', min: 9, text: '魔兽山脉「古碑悟道」中，手动选择静心参悟，20% 几率获赠；累计参悟 5 次必得。炼化后帮助修炼。' }
}

export const combatSkills = [
  { id: 'palm', name: '斗气掌', min: 0, coefficient: 1.25, cooldown: 2, desc: '稳固基础，每隔两次普攻施展一次掌力。' },
  { id: 'crash', name: '八极崩', min: 9, coefficient: 1.5, cooldown: 3, desc: '劲力叠发，适合稳定输出。' },
  { id: 'wave', name: '焰分噬浪尺', min: 27, coefficient: 1.75, cooldown: 4, desc: '重尺裂浪，以更长蓄力换取爆发。' },
  { id: 'seal', name: '帝印诀', min: 45, coefficient: 1.95, cooldown: 5, desc: '凝练斗气成印，攻守之间抓住破绽。' },
  { id: 'fire-lotus', name: '佛怒火莲', min: 63, coefficient: 2.15, cooldown: 6, flames: 2, desc: '需要炼化两道异火；异火依然按同一基础伤害附加，不再次乘算。' }
]

export const herbSeeds = [
  { id: 'grass', key: 'bloodGrass', name: '凝血草', heal: 0.15, min: 0, seconds: 60, cost: 12, yield: 3, sell: 8 },
  { id: 'lotus-herb', key: 'iceFlameGrass', name: '冰灵焰草', heal: 0.25, min: 18, seconds: 180, cost: 45, yield: 5, sell: 16 },
  { id: 'soul', key: 'soulDew', name: '养魂涎', heal: 0.35, min: 45, seconds: 360, cost: 100, yield: 8, sell: 25 }
]

export const wildEventTypes = {
  meeting: { name: '萍水相逢', text: '山道旁，一位熟悉的身影向你招手。' },
  rescue: { name: '仗义相助', text: '你听见争执声，一伙恶徒正在围堵独行的旅人。' },
  escort: { name: '商旅护送', text: '商队被魔兽困在山谷，正寻找愿意同行的护卫。' },
  herbs: { name: '山中采药', text: '一位采药人受了轻伤，请你帮忙采集峭壁上的药草。' },
  ruins: { name: '残图寻踪', text: '散落的残图指向一处洞府，对方邀你一同探寻。' },
  insight: { name: '古碑悟道', text: '古碑前的隐士邀你静心观火，也愿用灵石换取你的一缕感悟。', map: 'mountains', min: 9, fire: 'serenity', choice: 'meditate' },
  courier: { name: '失落家书', text: '旅人托你将一封家书送到驿站，也允许你留下信中附带的盘缠。', map: 'blackcorner', min: 27, choice: 'deliver' }
}

export const regionRequirements = {
  mountains: { type: 'fight', text: '击败山脉守关兽' },
  desert: { type: 'herbs', seed: 'grass', count: 10, text: '提交 10 份凝血草' },
  blackcorner: { type: 'event', kind: 'meeting', choice: 'clue', text: '在塔戈尔沙漠遇见 NPC，选择打听异火' },
  academy: { type: 'fight', text: '通过内院守卫考验' },
  yunlan: { type: 'herbs', seed: 'lotus-herb', count: 10, text: '提交 10 份冰灵焰草' },
  ravine: { type: 'event', kind: 'herbs', choice: 'help', text: '在云岚山完成一次协助采药奇遇' },
  pill: { type: 'herbs', seed: 'soul', count: 12, text: '提交 12 份养魂涎' },
  beast: { type: 'fight', text: '击败兽域守关兽' },
  ancient: { type: 'event', kind: 'meeting', choice: 'learn', text: '在远古兽域遇见 NPC，选择请教修行' },
  emperor: { type: 'fight', text: '击败帝府守关石像' }
}
