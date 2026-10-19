import { flameAcquisition } from './worldContent.js'

export const stoneTiers = [
  { key: 'yellowStone', name: '黄阶强化石', color: '#8e9d9c' },
  { key: 'blackStone', name: '玄阶强化石', color: '#4caa87' },
  { key: 'earthStone', name: '地阶强化石', color: '#508eb8' },
  { key: 'heavenStone', name: '天阶强化石', color: '#a07aca' },
  { key: 'saintStone', name: '圣阶强化石', color: '#d29b42' },
  { key: 'emperorStone', name: '帝阶强化石', color: '#d66f59' }
]

export const worldMaps = [
  { id: 'wutan', name: '乌坦城后山', area: '加玛帝国', min: 0, max: 8, stone: 0, npc: 'yao', color: '#4d8879', symbol: '山', desc: '山风拂过药圃，少年从这里踏上斗气之路。', monsters: ['赤尾狐', '铁皮野猪', '青木狼'], fires: ['xuanhuang'] },
  { id: 'mountains', name: '魔兽山脉', area: '加玛帝国', min: 9, max: 17, stone: 0, npc: 'doctor', color: '#487b65', symbol: '林', desc: '密林藏着佣兵的足迹，也藏着魔兽守护的洞府。', monsters: ['青风鹰', '岩蛇', '紫晶幼狮'], fires: ['beasts', 'dragonphoenix'] },
  { id: 'desert', name: '塔戈尔沙漠', area: '蛇人领地', min: 18, max: 26, stone: 1, npc: 'hai', color: '#b98a4b', symbol: '沙', desc: '循着残图深入沙海，地底青莲静候有缘之人。', monsters: ['沙漠毒蝎', '双头火灵蛇', '沙铁蜥'], fires: ['lotus', 'winddragon'] },
  { id: 'blackcorner', name: '黑角域', area: '西北大陆', min: 27, max: 35, stone: 1, npc: 'merchant', color: '#77718c', symbol: '域', desc: '商旅与强者交错，遗失的火种流转于黑市。', monsters: ['嗜血魔猿', '黑煞蝠', '幽冥狼'], fires: ['sea', 'volcano'] },
  { id: 'academy', name: '迦南学院', area: '西北大陆', min: 36, max: 44, stone: 2, npc: 'elder', color: '#4b8c9f', symbol: '塔', desc: '天焚炼气塔下，陨落心炎正悄然苏醒。', monsters: ['地底火蜥蜴', '焰尾巨蟒', '熔岩兽'], fires: ['fallen', 'turtle'] },
  { id: 'yunlan', name: '云岚山', area: '加玛帝国', min: 45, max: 53, stone: 2, npc: 'yao', color: '#6996a3', symbol: '岚', desc: '云海与石阶通向山巅，雷火锤炼修行者的斗气。', monsters: ['云翼鹤', '雷爪狮鹫', '风灵巨蟒'], fires: ['cloudwater', 'thunder'] },
  { id: 'ravine', name: '落神涧', area: '中州南域', min: 54, max: 62, stone: 3, npc: 'doctor', color: '#687a85', symbol: '涧', desc: '迷雾深处有毒瘴，更有寒焰与不灭的古老传承。', monsters: ['天毒蝎龙兽', '冰魂蟒', '幽骨魔蛛'], fires: ['bone', 'netherwind'] },
  { id: 'pill', name: '丹域星空', area: '中州丹塔', min: 63, max: 71, stone: 3, npc: 'alchemist', color: '#7772a4', symbol: '星', desc: '丹香汇入星海，三千焱炎火盘踞在星空深处。', monsters: ['星炎兽', '银翼丹兽', '丹雷傀儡'], fires: ['stars', 'redlotus', 'goldancestor'] },
  { id: 'beast', name: '远古兽域', area: '中州兽域', min: 72, max: 80, stone: 4, npc: 'elder', color: '#9c7755', symbol: '荒', desc: '远古血脉在荒原复苏，八荒烈焰吞吐天地。', monsters: ['远古天凰', '太虚古龙幻影', '荒古魔熊'], fires: ['wilderness', 'life'] },
  { id: 'ancient', name: '远古遗迹', area: '中州古界', min: 81, max: 92, stone: 4, npc: 'alchemist', color: '#9c8051', symbol: '古', desc: '九转凝练，半圣叩关。金色火焰映照古族石碑。', monsters: ['远古守卫', '九幽地冥蟒', '轮回傀儡'], fires: ['goldemperor', 'reincarnation'] },
  { id: 'emperor', name: '古帝洞府', area: '陀舍古帝遗藏', min: 93, max: 102, stone: 5, npc: 'yao', color: '#ad6751', symbol: '帝', desc: '二十三道火焰相呼应，斗帝的道路就在眼前。', monsters: ['吞炎魔影', '净莲火奴', '帝府石像'], fires: ['purelotus', 'void', 'emperor'] }
]

export const worldNpcs = [
  { id: 'yao', name: '药尘', title: '戒中药老', text: '斗气的根基，贵在日复一日的凝练。异火虽强，也要量力而行。' },
  { id: 'doctor', name: '小医仙', title: '采药行者', text: '前面的山谷有魔兽出没。这些药草，或许能助你走得更远。' },
  { id: 'hai', name: '海波东', title: '漠城隐者', text: '沙海之下的火焰，我曾在残图上见过它的位置。' },
  { id: 'merchant', name: '雅妃', title: '米特尔商会', text: '行走大陆，实力和眼光一样重要。来看看这批刚到的强化石。' },
  { id: 'elder', name: '苏千', title: '内院长老', text: '修行要张弛有度。若能守住本心，机缘自会来临。' },
  { id: 'alchemist', name: '玄空子', title: '丹塔前辈', text: '天地异火，各有灵性。先寻火种，再以斗气徐徐炼化。' }
  ,{ id: 'xuner', name: '古薰儿', title: '古族少女', romantic: true, min: 0, text: '相伴之人，不只看一时强弱，更看是否愿意守护彼此。' }
  ,{ id: 'huanong', name: '华农老人', title: '药圃隐士', min: 0, text: '草木也有灵性，用心照料，自会遇见生机。' }
  ,{ id: 'yun', name: '云韵', title: '云岚宗主', romantic: true, min: 45, text: '独行山海，也会有需要援手的时候。' }
  ,{ id: 'nalan', name: '纳兰嫣然', title: '历练剑客', romantic: true, min: 9, text: '今日承你相助，这份情谊我会记下。' }
  ,{ id: 'medusa', name: '美杜莎', title: '蛇人女王', romantic: true, min: 18, text: '沙海中的承诺，比一时的逞强更有分量。' }
]

// 寻获地图和炼化门槛为本游戏的玩法设定。
export const heavenlyFlames = [
  ['emperor', '帝炎', 1, 102, '#e4b05e'], ['void', '虚无吞炎', 2, 99, '#9a80bd'],
  ['purelotus', '净莲妖火', 3, 95, '#e6a5b6'], ['goldemperor', '金帝焚天炎', 4, 86, '#dfb44e'],
  ['life', '生灵之焱', 5, 77, '#67bc8c'], ['wilderness', '八荒破灭焱', 6, 73, '#c37c5e'],
  ['goldancestor', '九幽金祖火', 7, 69, '#caab64'], ['redlotus', '红莲业火', 8, 67, '#d6737d'],
  ['stars', '三千焱炎火', 9, 63, '#ad83ce'], ['netherwind', '九幽风炎', 10, 59, '#7296ae'],
  ['bone', '骨灵冷火', 11, 54, '#b1d8d5'], ['thunder', '九龙雷罡火', 12, 49, '#a78bcf'],
  ['turtle', '龟灵地火', 13, 40, '#a18f62'], ['fallen', '陨落心炎', 14, 36, '#83c4c0'],
  ['sea', '海心焰', 15, 27, '#649fc9'], ['cloudwater', '火云水炎', 16, 45, '#8ea8cf'],
  ['volcano', '火山石焰', 17, 30, '#c27e61'], ['winddragon', '风怒龙炎', 18, 22, '#cba967'],
  ['lotus', '青莲地心火', 19, 18, '#62b39c'], ['dragonphoenix', '龙凤焱', 20, 13, '#bd9c66'],
  ['reincarnation', '六道轮回炎', 21, 81, '#9d91bc'], ['beasts', '万兽灵火', 22, 9, '#c79b6c'],
  ['xuanhuang', '玄黄炎', 23, 0, '#d6af6c']
].map(([id, name, rank, min, color]) => {
  const source = flameAcquisition[id] || { type: 'wild', text: `在${worldMaps.find(map => map.fires.includes(id)).name}击败魔兽随机寻获；NPC 线索提高概率。` }
  min = source.min ?? min
  return { id, name, rank, min, color, source,
    attack: 0.012 + (24 - rank) * 0.0015,
    cultivation: id === 'fallen' ? 0.18 : 0.025 + (24 - rank) * 0.002,
    cost: 100 * (min + 1)
  }
})

for (const map of worldMaps) map.fires = map.fires.filter(id => !flameAcquisition[id])

export const createWorldState = () => ({
  version: 2, balanceVersion: 2, mapId: 'wutan', mode: 'idle', autoNpc: true, autoSalvage: true,
  lastTick: Date.now(), encounter: null, opportunity: null, resting: false,
  flames: [], activeFlame: '', clues: {}, pity: {}, relationships: {},
  kills: 0, sessions: { kills: 0, money: 0, stones: 0, equipment: 0, cultivation: 0 }, logs: [],
  skills: { palm: 1 }, skillId: 'palm', trial: null, trialClears: {},
  garden: { plots: [null, null, null], herbs: 0, harvests: 0, visitor: null, helped: false },
  social: {}, eventWins: 0, lastAttack: null, allocations: { attack: 0, defense: 0, health: 0 }
})
