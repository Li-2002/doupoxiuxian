export const giftCatalog = [
  { id: 'tea', name: '清心茶', price: 12, affinity: 4, qingyuan: 3, favorites: ['yao', 'hai', 'elder', 'alchemist'], source: '12 灵石购买；历练掉落' },
  { id: 'sachet', name: '百草香囊', price: 24, affinity: 5, qingyuan: 4, favorites: ['doctor', 'huanong', 'xuner', 'qinglin', 'hanxue'], source: '24 灵石购买；收获药草可能获得' },
  { id: 'scroll', name: '修行手札', price: 36, affinity: 5, qingyuan: 4, favorites: ['yun', 'nalan', 'merchant', 'medusa', 'xiaoyu', 'hanyue'], source: '36 灵石购买；历练掉落' },
  { id: 'xuner-token', name: '薰风玉佩', recipient: 'xuner', affinity: 12, qingyuan: 20, source: '妖火幻境首通；再次通关有 10% 几率获得' },
  { id: 'yun-token', name: '云岚玉簪', recipient: 'yun', affinity: 12, qingyuan: 20, source: '心炎深渊首通；再次通关有 10% 几率获得' },
  { id: 'nalan-token', name: '云纹剑穗', recipient: 'nalan', affinity: 12, qingyuan: 20, source: '丹塔试炼首通；再次通关有 10% 几率获得' },
  { id: 'medusa-token', name: '蛇纹玉玦', recipient: 'medusa', affinity: 12, qingyuan: 20, source: '地心莲境首通；再次通关有 10% 几率获得' }
]

export const MAX_PARTNERS = 10
export const MAX_PARTNER_TEAM = 3
export const PARTNER_INTERACTION_COOLDOWN = 5 * 60 * 1000
export const trialGiftRewards = { 'lotus-trial': 'medusa-token', 'fallen-trial': 'yun-token', 'purelotus-trial': 'xuner-token', danta: 'nalan-token' }
