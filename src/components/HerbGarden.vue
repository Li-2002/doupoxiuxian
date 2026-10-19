<template>
  <div class="garden-panel">
    <div class="activity-summary"><div><h3>三畦药圃</h3><p class="muted">收获草木，赠礼友人。成熟药草有时会引来华农老人。</p></div><strong>药草 {{ garden.herbs }} 份</strong></div>
    <div class="seed-options"><button v-for="seed in herbSeeds" :key="seed.id" :disabled="player.level < seed.min" :class="{ selected: selectedSeed === seed.id }" @click="selectedSeed = seed.id"><strong>{{ seed.name }}</strong><span>{{ seed.seconds / 60 }} 分钟 · {{ seed.yield }} 份 · {{ seed.cost }} 灵石</span><small>{{ levelNames(seed.min) }}起</small></button></div>
    <div class="herb-plots"><article v-for="(plot, index) in garden.plots" :key="index" :class="{ ready: plot && plot.readyAt <= now }"><span class="herb-glyph" aria-hidden="true">{{ plot ? '艹' : '田' }}</span><h3>{{ plot ? herbSeeds.find(seed => seed.id === plot.seed).name : '空药畦' }}</h3><p>{{ plot ? plot.readyAt <= now ? '药草已成熟' : '还需 ' + Math.ceil((plot.readyAt - now) / 1000) + ' 秒' : '选择种苗后开始种植' }}</p><el-progress v-if="plot" :percentage="Math.max(0, Math.min(100, (now - plot.plantedAt) / (plot.readyAt - plot.plantedAt) * 100))" :show-text="false" color="#78a085" /><el-button v-if="plot" :disabled="plot.readyAt > now" @click="act(() => harvestHerb(player, index))">收获药草</el-button><el-button v-else @click="act(() => plantHerb(player, index, selectedSeed))">种植</el-button></article></div>
    <div class="activity-actions"><el-button v-if="!garden.helped" type="primary" @click="act(() => claimSeedlings(player))">领取三株初始种苗</el-button><el-button :disabled="garden.herbs < 1" @click="act(() => useHerbs(player, 'heal'))">消耗 1 份疗伤</el-button><el-button :disabled="garden.herbs < 1" @click="act(() => useHerbs(player, 'sell'))">出售至多 5 份 · 每份 8 灵石</el-button></div>
    <div v-if="garden.visitor" class="garden-visitor"><span class="encounter-seal">缘</span><div><small>药圃奇遇</small><h3>华农老人来访</h3><p>「愿用六份药草，换一次亲近生灵之焱的机缘吗？」</p><p class="muted">考验消耗 6 份药草，18% 几率获赠火种。未获火种时得到 60 灵石。</p><el-button type="primary" :disabled="garden.herbs < 6" @click="feedback = helpGardenVisitor(player)">接受草木考验</el-button></div></div>
    <p class="muted">药草离线也会生长。每次成熟收获有 12% 几率引来老人，来访保留至你完成考验；战斗期间不能用药草疗伤。</p>
    <p class="activity-feedback" role="status">{{ feedback }}</p>
  </div>
</template>
<script setup>
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useMainStore } from '@/plugins/store'
  import { herbSeeds } from '@/plugins/worldContent'
  import { levelNames } from '@/plugins/game'
  import { claimSeedlings, plantHerb, harvestHerb, helpGardenVisitor, useHerbs } from '@/plugins/worldActivities'
  const player = useMainStore().player
  const garden = player.world.garden
  const now = ref(Date.now())
  const selectedSeed = ref('grass')
  const feedback = ref('')
  let timer
  onMounted(() => { timer = setInterval(() => { now.value = Date.now() }, 1000) })
  onUnmounted(() => clearInterval(timer))
  const act = operation => { feedback.value = operation() || '已完成' }
</script>
