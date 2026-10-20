<template>
  <div class="forge-panel" v-if="item?.name">
    <div class="forge-item-name"><tag :type="item.quality">{{ item.name }} +{{ item.strengthen || 0 }}</tag></div>
    <p>{{ genre[item.type] }} · {{ levelNames(item.level) }}</p>
    <p v-if="isExclusiveEquipment(item)" class="muted">异火共鸣 {{ item.flameCount || 0 }} 道 · 成长 +{{ (exclusiveFlameBonus(item.flameCount) * 100).toFixed(1) }}%（上限 11.5%）</p>
    <div class="forge-stats">
      <span>攻击 <b>{{ item.attack }}</b></span><span>防御 <b>{{ item.defense }}</b></span>
      <span>气血 <b>{{ item.health }}</b></span><span>评分 <b>{{ item.score }}</b></span>
    </div>
    <template v-if="(item.strengthen || 0) < 30">
      <p :style="{ color: cost.stone.color }">{{ cost.stone.name }} {{ cost.count }} 枚 / 拥有 {{ player.props[cost.stone.key] }}</p>
      <p>灵石 {{ cost.money }} / 拥有 {{ player.props.money }}</p>
      <p>成功率 {{ (cost.rate * 100).toFixed(1) }}% · 每次成功增加初始主属性的 4%</p>
      <p class="muted">失败仅消耗本次材料，装备与等级保留。炼器石可替代黄阶强化石。</p>
      <el-button type="primary" size="large" @click="enhance">强化至 +{{ (item.strengthen || 0) + 1 }}</el-button>
    </template>
    <p v-else>已达到强化上限 +30</p>
    <section v-if="isExclusiveEquipment(item)" class="growth-section">
      <h3>装备境界提升</h3>
      <template v-if="item.level < ascent.target">
        <p>提升至 {{ levelNames(ascent.target) }}，保留品质、强化与专属身份。</p>
        <p>{{ ascent.money }} 灵石 · {{ ascent.essence }} 炼器石 · {{ ascent.count }} 枚{{ ascent.stone.name }}</p>
        <el-button @click="ascend">提升至当前境界</el-button>
      </template>
      <p v-else class="muted">已达到当前境界。突破后可继续提升。</p>
    </section>
    <section class="growth-section">
      <h3>强化传承</h3>
      <p class="muted">选择同部位、强化更高且未锁定的来源。强化等级直接移动，来源归零，双方装备保留。</p>
      <el-select v-model="sourceId" aria-label="强化传承来源" placeholder="选择来源装备" :disabled="!sources.length"><el-option v-for="source in sources" :key="source.id" :value="source.id" :label="source.name + ' +' + source.strengthen" /></el-select>
      <p v-if="source">来源 +{{ source.strengthen }} → 本装备；消耗 {{ transfer.money }} 灵石、{{ transfer.essence }} 炼器石。</p>
      <p v-else-if="!sources.length" class="muted">暂无可用来源，可先在行囊解锁旧装备。</p>
      <el-button :disabled="!source" @click="inherit">传承强化</el-button>
    </section>
    <p role="status" class="forge-feedback">{{ feedback }}</p>
  </div>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import tag from './tag.vue'
  import { useMainStore } from '@/plugins/store'
  import { enhancementCost, strengthenEquipment } from '@/plugins/douqi'
  import { genre, levelNames } from '@/plugins/game'
  import { isExclusiveEquipment } from '@/plugins/equipmentContent'
  import { exclusiveFlameBonus } from '@/plugins/balance'
  import { ascendEquipment, ascensionCost, transferEnhancement, transferCost } from '@/plugins/equipmentGrowth'
  import { operationFeedback } from '@/plugins/feedback'
  const props = defineProps({ item: Object })
  const player = useMainStore().player
  const feedback = ref('')
  const cost = computed(() => enhancementCost(props.item))
  const sourceId = ref('')
  const ascent = computed(() => ascensionCost(player, props.item))
  const sources = computed(() => [...Object.values(player.equipment), ...player.inventory].filter(item => item?.name && item !== props.item && item.type === props.item.type && !item.lock && (item.strengthen || 0) > (props.item.strengthen || 0)))
  const source = computed(() => sources.value.find(item => item.id === sourceId.value))
  const transfer = computed(() => transferCost(props.item, source.value))
  watch(() => props.item, () => { feedback.value = ''; sourceId.value = '' })
  const enhance = () => { feedback.value = operationFeedback(strengthenEquipment(player, props.item), '强化成功') }
  const ascend = () => { feedback.value = operationFeedback(ascendEquipment(player, props.item), '境界提升成功，属性已重新计算。') }
  const inherit = () => {
    const error = transferEnhancement(player, props.item, source.value)
    feedback.value = operationFeedback(error, '传承成功，来源装备强化已归零。')
    if (!error) sourceId.value = ''
  }
</script>

<style scoped>
  .forge-panel { padding: 20px 0; text-align: center; }
  .forge-item-name { margin-bottom: 16px; }
  .forge-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 20px; background: var(--el-fill-color-light); }
  .forge-stats span { display: flex; justify-content: space-between; gap: 12px; }
  .forge-feedback { color: var(--el-color-primary); min-height: 24px; }
  .growth-section { border-top: 1px solid var(--el-border-color); padding-top: 16px; margin-top: 24px; }
  .growth-section p { font-size: 14px; line-height: 1.8; }
  .growth-section .el-select { max-width: 100%; width: 300px; margin-bottom: 12px; }
</style>
