<template>
  <el-button plain @click="open = true">一键分解</el-button>
  <el-dialog v-model="open" title="一键分解装备" width="min(440px, 92vw)" append-to-body>
    <label for="salvage-cutoff">分解此品质以下的装备</label>
    <el-select id="salvage-cutoff" v-model="quality" aria-label="分解品质界限" class="salvage-select">
      <el-option v-for="entry in salvageQualities.slice(1)" :key="entry.quality" :value="entry.quality" :label="entry.name + '以下（不含' + entry.name + '）'" />
    </el-select>
    <p class="muted">保留所选品质、锁定装备、已穿戴装备和专属四件套。</p>
    <p>可分解 <b>{{ preview.items.length }}</b> 件 · 炼器石 {{ preview.stones }} · 灵石 {{ preview.money }}</p>
    <p role="status">{{ feedback }}</p>
    <template #footer><el-button @click="open = false">取消</el-button><el-button type="danger" :disabled="!preview.items.length" @click="salvage">确认分解 {{ preview.items.length }} 件</el-button></template>
  </el-dialog>
</template>
<script setup>
  import { ref, computed } from 'vue'
  import { useMainStore } from '@/plugins/store'
  import { salvageQualities, salvagePreview, salvageBelow } from '@/plugins/equipmentGrowth'
  import { operationFeedback } from '@/plugins/feedback'
  const player = useMainStore().player
  const open = ref(false), quality = ref('primary'), feedback = ref('')
  const preview = computed(() => salvagePreview(player, quality.value))
  const salvage = () => {
    const count = preview.value.items.length
    feedback.value = operationFeedback(salvageBelow(player, quality.value), `已分解 ${count} 件装备，材料已存入背包。`)
  }
</script>
<style scoped>
  .salvage-select { width: 100%; margin-top: 12px; }
  p { line-height: 1.8; }
</style>
