<template>
  <div class="equipment-craft">
    <h3>分解旧物，定向铸器</h3>
    <p class="muted">在洞府分解闲置装备获取炼器石。选择部位与品质，必定获得当前境界的普通装备，名称和小幅属性浮动随机。专属四件套无法打造。</p>
    <p>灵石 {{ player.props.money.toLocaleString() }} · 炼器石 {{ player.props.strengtheningStone.toLocaleString() }}</p>
    <div class="craft-options">
      <label>装备部位<el-select v-model="type" aria-label="打造装备部位"><el-option v-for="(name, id) in genre" :key="id" :value="id" :label="name" /></el-select></label>
      <label>打造品质<el-select v-model="quality" aria-label="打造装备品质"><el-option v-for="recipe in craftingQualities" :key="recipe.quality" :value="recipe.quality" :label="levels[recipe.quality] + (recipe.quality === 'danger' ? '（红色）' : '') + ' · ' + levelNames(recipe.min) + '解锁'" :disabled="player.level < recipe.min" /></el-select></label>
    </div>
    <div class="craft-recipe">
      <p>成品：{{ levelNames(Math.max(1, player.level)) }} · {{ levels[quality] }}{{ genre[type] }} · 强化 +0</p>
      <p>消耗 {{ cost.money }} 灵石、{{ cost.essence }} 炼器石、{{ cost.count }} 枚{{ cost.stone.name }}（拥有 {{ player.props[cost.stone.key] }}）</p>
      <el-button type="primary" @click="craft">定向打造一件</el-button>
      <p role="status">{{ feedback }}</p>
    </div>
    <ExclusiveRedeem />
  </div>
</template>
<script setup>
  import { computed, ref } from 'vue'
  import { useMainStore } from '@/plugins/store'
  import { craftingQualities } from '@/plugins/equipmentContent'
  import { craftCost, craftEquipment } from '@/plugins/equipmentGrowth'
  import { genre, levels, levelNames } from '@/plugins/game'
  import ExclusiveRedeem from './ExclusiveRedeem.vue'
  const player = useMainStore().player
  const type = ref('weapon')
  const quality = ref('info')
  const feedback = ref('')
  const cost = computed(() => craftCost(player, quality.value))
  const craft = () => { feedback.value = craftEquipment(player, type.value, quality.value) || '打造成功：「' + player.inventory.at(-1).name + '」已存入行囊。' }
</script>
<style scoped>
  .equipment-craft { max-width: 800px; padding: 12px 0; }
  .equipment-craft p { line-height: 1.8; }
  .craft-options { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 24px 0; }
  .craft-options label { display: grid; gap: 8px; font-size: 14px; }
  .craft-recipe { border-left: 3px solid var(--el-color-primary); background: var(--el-fill-color-light); padding: 12px 20px; }
  .craft-recipe [role='status'] { color: var(--el-color-primary); min-height: 24px; }
  @media (max-width: 600px) { .craft-options { grid-template-columns: 1fr; gap: 12px; } }
</style>
