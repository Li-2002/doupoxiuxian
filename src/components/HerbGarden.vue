<template>
  <div class="garden-panel">
    <div class="activity-summary"><div><h3>三畦药圃</h3></div><strong>药草 {{ garden.herbs }} 份</strong></div>
    <p v-if="feedback" class="activity-feedback" role="status">{{ feedback }}</p>
    <div class="seed-options"><button v-for="seed in herbSeeds" :key="seed.id" :disabled="player.level < seed.min && !player.props[seed.key]" :class="{ selected: selectedSeed === seed.id }" @click="selectedSeed = seed.id"><strong>{{ seed.name }} · 持有 {{ player.props[seed.key] || 0 }} 份</strong><span>回复最大气血 {{ seed.heal * 100 }}%</span><span>{{ seed.seconds / 60 }} 分钟 · 收获 {{ seed.yield }} 份 · 种植 {{ seed.cost }} 灵石</span><small>{{ levelNames(seed.min) }}起</small></button></div>
    <div class="herb-plots"><article v-for="(plot, index) in garden.plots" :key="index" :class="{ ready: plot && plot.readyAt <= now }"><span class="herb-glyph" aria-hidden="true">{{ plot ? '艹' : '田' }}</span><h3>{{ plot ? herbSeeds.find(seed => seed.id === plot.seed).name : '空药畦' }}</h3><p>{{ plot ? plot.readyAt <= now ? '药草已成熟' : '还需 ' + Math.ceil((plot.readyAt - now) / 1000) + ' 秒' : '选择种苗后开始种植' }}</p><el-progress v-if="plot" :percentage="Math.max(0, Math.min(100, (now - plot.plantedAt) / (plot.readyAt - plot.plantedAt) * 100))" :show-text="false" color="#78a085" /><el-button v-if="plot" :disabled="plot.readyAt > now" @click="harvest(index)">收获药草</el-button><el-button v-else @click="act(() => plantHerb(player, index, selectedSeed), '已种下' + selected.name)">种植</el-button></article></div>
    <div class="activity-actions"><el-button v-if="!garden.helped" type="primary" @click="act(() => claimSeedlings(player), '三株凝血草已种下')">领取三株初始种苗</el-button><el-button :disabled="!player.props[selected.key]" @click="act(() => useHerbs(player, 'heal', selectedSeed), '已服用' + selected.name)">服用{{ selected.name }} · 回复 {{ selected.heal * 100 }}%</el-button><el-button :disabled="!player.props[selected.key]" @click="act(() => useHerbs(player, 'sell', selectedSeed), '出售成功')">出售{{ selected.name }} · 每份 {{ selected.sell }} 灵石</el-button></div>
    <p class="muted">自动打怪时，气血不高于 50% 会自动服药，间隔 6 秒。</p>
    <div v-if="garden.visitor" class="garden-visitor"><span class="encounter-seal">缘</span><div><small>药圃奇遇</small><h3>华农老人来访</h3><p>「愿用六份药草，换一次亲近生灵之焱的机缘吗？」</p><el-button type="primary" :disabled="garden.herbs < 6" @click="visit">接受草木考验 · 6 份药草</el-button></div></div>
  </div>
</template>
<script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { operationFeedback } from '@/plugins/feedback'
  import { useMainStore } from '@/plugins/store'
  import { herbSeeds } from '@/plugins/worldContent'
  import { levelNames } from '@/plugins/game'
  import { claimSeedlings, plantHerb, harvestHerb, helpGardenVisitor, useHerbs } from '@/plugins/worldActivities'
  const player = useMainStore().player
  const garden = player.world.garden
  const now = ref(Date.now())
  const selectedSeed = ref('grass')
  const selected = computed(() => herbSeeds.find(seed => seed.id === selectedSeed.value))
  const feedback = ref('')
  let timer
  onMounted(() => { timer = setInterval(() => { now.value = Date.now() }, 1000) })
  onUnmounted(() => clearInterval(timer))
  const act = (operation, success = '已完成') => {
    const error = operation()
    feedback.value = operationFeedback(error, success)
  }
  const harvest = index => {
    const seed = herbSeeds.find(seed => seed.id === garden.plots[index]?.seed)
    act(() => harvestHerb(player, index), `收获${seed?.name} ×${seed?.yield}，已存入背包`)
  }
  const visit = () => {
    const visitor = garden.visitor
    const message = helpGardenVisitor(player)
    feedback.value = operationFeedback(!visitor || garden.visitor ? message : '', message)
  }
</script>
