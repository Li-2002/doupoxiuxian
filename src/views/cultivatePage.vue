<template>
  <main class="cultivation-page">
    <div class="page-intro"><div><p class="place-label">凝气入体 · 百炼成帝</p><h1>斗气修炼</h1><p class="muted">让每一次吐纳，都向更高的境界迈进一步。</p></div><span class="realm-badge">{{ player.reincarnation }} 转</span></div>
    <section class="meditation-panel">
      <div class="meditation-emblem" aria-hidden="true">气</div>
      <p class="muted">当前境界</p><h2>{{ levelNames(player.level) }}</h2>
      <p>{{ player.level >= maxLv ? '已至斗帝之境' : '下一境界：' + levelNames(player.level + 1) }}</p>
      <el-progress :percentage="percentage" :format="value => value.toFixed(1) + '%'" :stroke-width="12" color="#9e8b55" />
      <p class="muted">修为 {{ Math.floor(player.cultivation).toLocaleString() }} / {{ player.maxCultivation.toLocaleString() }}</p>
      <p class="muted">每 2 秒吐纳一次，自动突破获得属性、3 点境界点与 50 格行囊。境界越高，突破越慢。</p>
      <p>当前地点：{{ currentMap(player).name }} · 效率 {{ Math.round(cultivationEfficiency(player) * 100) }}%</p>
      <p v-if="flame.count" class="flame-cultivation">{{ flame.count }} 道异火护体 · 修炼收益 +{{ Math.round(flame.cultivation * 100) }}%</p>
      <div class="meditation-actions"><el-button type="primary" size="large" :disabled="player.level >= maxLv || world.mode === 'cultivate'" @click="operationFeedback(setAutomation(player, 'cultivate'))">挂机修炼</el-button><el-button size="large" :disabled="world.mode === 'idle'" @click="setAutomation(player, 'idle')">停止挂机</el-button><el-button size="large" @click="reincarnate">转生突破</el-button></div>
      <p class="automation-state" :class="{ active: world.mode !== 'idle' }">{{ automationStatus(player) }}</p>
    </section>
    <section class="reincarnation-benefits">
      <h3>转生之后</h3>
      <p>装备、异火、道侣、礼物、情缘与已获得属性保留，行囊再增加 50 格。重新突破仍获得属性、境界点和每级 50 格容量。</p>
      <p>下次转生后基础成长系数 ×{{ (1 + Math.min(10, player.reincarnation + 1) * 0.12).toFixed(2) }}（最多计算 10 转），并非直接乘算当前全部属性。</p>
      <p class="muted">代价：境界与修为归零、返回乌坦城；升级需求系数 ×{{ (1 + (player.reincarnation + 1) * 0.5).toFixed(2) }}，普通野怪也随转生增强。</p>
    </section>
    <CultivationLocations />
    <div class="realm-road"><span v-for="stage in stages" :key="stage.name" :class="{ reached: player.level >= stage.level }"><b>{{ stage.name }}</b><small>{{ player.level >= stage.level ? '已踏入' : levelNames(stage.level) }}</small></span></div>
    <section class="journal"><div class="section-title"><h3>修行札记</h3><router-link class="quiet-link" to="/map">前往大陆历练</router-link></div><div class="journal-entries" role="log"><p v-if="!logs.length" class="muted">开启挂机修炼，静候斗气突破。</p><div v-for="(entry, i) in logs" :key="i" class="journal-entry" :class="entry.type"><time>{{ new Date(entry.time).toLocaleTimeString('zh-CN', { hour12: false }) }}</time><span>{{ entry.text }}</span></div></div></section>
  </main>
</template>
<script setup>
  import { computed } from 'vue'
  import { ElMessageBox } from 'element-plus'
  import { operationFeedback, notifyFailure } from '@/plugins/feedback'
  import { useMainStore } from '@/plugins/store'
  import { levelNames, maxLv } from '@/plugins/game'
  import { setAutomation, flameBonuses, automationStatus, currentMap } from '@/plugins/douqi'
  import { reincarnationError, performReincarnation } from '@/plugins/worldProgress'
  import { cultivationEfficiency } from '@/plugins/journey'
  import CultivationLocations from '@/components/CultivationLocations.vue'
  import { flameDamageProfile } from '@/plugins/balance'
  const player = useMainStore().player
  const world = player.world
  const percentage = computed(() => player.level >= maxLv ? 100 : Math.min(100, player.cultivation / player.maxCultivation * 100))
  const flame = computed(() => ({ count: flameDamageProfile(player).parts.length, cultivation: flameBonuses(player).cultivation }))
  const logs = computed(() => world.logs.filter(entry => ['realm', 'npc', 'flame', 'system'].includes(entry.type)))
  const stages = [{ name: '斗之气', level: 0 }, { name: '斗者', level: 9 }, { name: '斗师', level: 18 }, { name: '大斗师', level: 27 }, { name: '斗灵', level: 36 }, { name: '斗王', level: 45 }, { name: '斗皇', level: 54 }, { name: '斗宗', level: 63 }, { name: '斗尊', level: 72 }, { name: '九转斗尊', level: 81 }, { name: '半圣', level: 90 }, { name: '斗圣', level: 93 }, { name: '斗帝', level: 102 }]
  const reincarnate = async () => {
    const error = reincarnationError(player)
    if (error) return notifyFailure(error)
    try {
      await ElMessageBox.confirm('转生会重置境界与修为，返回乌坦城，行囊增加 50 格。装备、异火、道侣、礼物和已得属性保留；重走境界可继续成长，升级需求和野怪也会增强。', '转生突破', { confirmButtonText: '确认转生', cancelButtonText: '继续修行' })
      operationFeedback(performReincarnation(player))
    } catch (error) {
      if (error !== 'cancel' && error !== 'close') throw error
    }
  }
</script>
<style scoped>
  .cultivation-page { text-align: left; }
  .meditation-panel { padding: 35px; max-width: 700px; margin: auto; text-align: center; background: var(--el-fill-color-light); }
  .meditation-emblem { margin: 0 auto 18px; width: 92px; height: 92px; border: 1px solid #ae9869; border-radius: 50%; outline: 1px solid var(--el-border-color); outline-offset: 8px; color: #9c8859; font: 52px/92px 'KaiTi', serif; }
  .meditation-panel h2 { font: 32px 'KaiTi', serif; color: var(--el-color-primary); margin: 12px 0; }
  .meditation-panel > p { font-size: 13px; }
  .meditation-panel .el-progress { max-width: 460px; margin: 25px auto 12px; }
  .meditation-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin: 25px 0 15px; }
  .meditation-actions .el-button { margin: 0; }
  .flame-cultivation { color: #a27a45; }
  .reincarnation-benefits { padding: 20px 24px; margin: 24px 0; border: 1px solid var(--el-border-color); line-height: 1.9; font-size: 13px; }
  .reincarnation-benefits h3 { font: 24px 'KaiTi', serif; color: var(--el-color-primary); margin: 0 0 12px; }
  .realm-road { display: flex; flex-wrap: wrap; justify-content: center; margin: 30px 0; gap: 10px; }
  .realm-road span { padding: 12px 16px; text-align: center; border: 1px solid var(--el-border-color); color: var(--el-text-color-secondary); }
  .realm-road .reached { color: var(--el-color-primary); border-color: #9dbab0; background: var(--el-fill-color-light); }
  .realm-road b { display: block; font-size: 13px; font-weight: 500; }.realm-road small { display: block; font-size: 10px; margin-top: 7px; }
  @media (max-width: 480px) { .meditation-panel { padding: 28px 16px; }.meditation-actions .el-button { flex: 1 1 40%; font-size: 13px; }.realm-road span { padding: 10px; } }
</style>
