<template>
  <section class="cultivation-locations">
    <div class="section-title"><h3>修炼福地</h3><span>逐地解锁 · 境界与机缘并重</span></div>
    <p class="muted">当前在{{ map.name }}修炼，效率 {{ Math.round(efficiency * 100) }}%。境界超过当地上限后灵气渐薄，最低保留 5% 效率。</p>
    <div class="location-grid">
      <article v-for="region in worldMaps" :key="region.id" :class="{ current: region.id === map.id }">
        <div><h4>{{ region.name }}</h4><small>{{ levelNames(region.min) }}～{{ levelNames(region.max) }}</small></div>
        <p>{{ isRegionUnlocked(player, region.id) ? '修炼效率 ' + Math.round(cultivationEfficiency(player, region) * 100) + '%' : regionUnlockHint(player, region.id) }}</p>
        <el-button size="small" :disabled="region.id === map.id || player.level < region.min || (!isRegionUnlocked(player, region.id) && !isNext(region.id))" @click="act(region)">{{ region.id === map.id ? '当前地点' : isRegionUnlocked(player, region.id) ? '前往修炼' : regionRequirements[region.id]?.type === 'fight' ? '挑战解锁' : '尝试解锁' }}</el-button>
      </article>
    </div>
    <p v-if="player.world.encounter?.kind === 'pass'" class="muted">守关战已开始，请前往大陆历练完成战斗。<router-link to="/map">继续挑战 →</router-link></p>
  </section>
</template>
<script setup>
  import { computed } from 'vue'
  import { useMainStore } from '@/plugins/store'
  import { worldMaps } from '@/plugins/douqiWorld'
  import { currentMap, selectMap } from '@/plugins/douqi'
  import { cultivationEfficiency, isRegionUnlocked, regionUnlockHint, unlockRegion } from '@/plugins/journey'
  import { regionRequirements } from '@/plugins/worldContent'
  import { levelNames } from '@/plugins/realms'
  import { operationFeedback, notifyFailure } from '@/plugins/feedback'
  const player = useMainStore().player
  const map = computed(() => currentMap(player)), efficiency = computed(() => cultivationEfficiency(player))
  const isNext = id => worldMaps.findIndex(map => map.id === id) === player.world.journey.unlocked.length
  const act = region => {
    if (isRegionUnlocked(player, region.id)) {
      if (!selectMap(player, region.id)) notifyFailure('请先完成当前战斗或处理奇遇再移动')
    } else operationFeedback(unlockRegion(player, region.id))
  }
</script>
<style scoped>
  .cultivation-locations { margin: 30px 0; }
  .location-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; }
  article { padding: 18px; border: 1px solid var(--el-border-color); }
  article.current { border-color: #769e91; background: var(--el-fill-color-light); }
  h4 { margin: 0 0 8px; font: 21px 'KaiTi', serif; color: var(--el-color-primary); }
  small, article p { font-size: 12px; color: var(--el-text-color-secondary); line-height: 1.8; }
  article p { min-height: 44px; }
  @media (max-width: 480px) { .location-grid { grid-template-columns: 1fr 1fr; gap: 8px; } article { padding: 12px; } h4 { font-size: 18px; } }
</style>
