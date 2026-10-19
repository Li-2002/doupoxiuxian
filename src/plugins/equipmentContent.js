export const exclusiveEquipment = [
  { id: 'wenzang', name: '文葬镰刀', type: 'weapon' },
  { id: 'jianbing', name: '监兵凶神', type: 'armor' },
  { id: 'huolian', name: '火链', type: 'accessory' },
  { id: 'renhuang', name: '人皇幡', type: 'sutra' }
]

export const isExclusiveEquipment = item => exclusiveEquipment.some(entry =>
  entry.id === item?.exclusiveId && entry.name === item.name && entry.type === item.type && item.quality === 'danger')

export const craftingQualities = [
  { quality: 'info', min: 0, tier: 0 },
  { quality: 'success', min: 9, tier: 0 },
  { quality: 'primary', min: 27, tier: 1 },
  { quality: 'purple', min: 36, tier: 2 },
  { quality: 'warning', min: 45, tier: 2 },
  { quality: 'danger', min: 63, tier: 3 }
]
