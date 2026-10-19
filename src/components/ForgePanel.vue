<template>
  <div class="forge-panel" v-if="item?.name">
    <div class="forge-item-name"><tag :type="item.quality">{{ item.name }} +{{ item.strengthen || 0 }}</tag></div>
    <p>{{ genre[item.type] }} · {{ levelNames(item.level) }}</p>
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
    <p role="status" class="forge-feedback">{{ feedback }}</p>
  </div>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import tag from './tag.vue'
  import { useMainStore } from '@/plugins/store'
  import { enhancementCost, strengthenEquipment } from '@/plugins/douqi'
  import { genre, levelNames } from '@/plugins/game'
  const props = defineProps({ item: Object })
  const player = useMainStore().player
  const feedback = ref('')
  const cost = computed(() => enhancementCost(props.item))
  watch(() => props.item, () => { feedback.value = '' })
  const enhance = () => { feedback.value = strengthenEquipment(player, props.item) || '强化成功' }
</script>

<style scoped>
  .forge-panel { padding: 20px 0; text-align: center; }
  .forge-item-name { margin-bottom: 16px; }
  .forge-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 20px; background: var(--el-fill-color-light); }
  .forge-stats span { display: flex; justify-content: space-between; gap: 12px; }
  .forge-feedback { color: var(--el-color-primary); min-height: 24px; }
</style>
