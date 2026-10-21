<template>
  <main class="adventures-page">
    <div class="page-intro"><div><p class="place-label">火域叩关 · 草木结缘</p><h1>秘境与机缘</h1><p class="muted">强者在险境中磨砺，也在故人之间留下一段故事。</p></div><span class="realm-badge">{{ levelNames(player.level) }}</span></div>
    <el-tabs v-model="activeTab"><el-tab-pane v-for="tab in tabs" :key="tab.id" :name="tab.id" :label="tab.label" /></el-tabs>
    <Transition name="activity" mode="out-in"><component :is="component" :key="activeTab" v-bind="panelProps" /></Transition>
  </main>
</template>
<script setup>
  import { computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useMainStore } from '@/plugins/store'
  import { levelNames } from '@/plugins/game'
  import TrialPanel from '@/components/TrialPanel.vue'
  import HerbGarden from '@/components/HerbGarden.vue'
  import AffinityBoard from '@/components/AffinityBoard.vue'
  import SkillHall from '@/components/SkillHall.vue'
  import PartnerBoard from '@/components/PartnerBoard.vue'
  const player = useMainStore().player
  const route = useRoute()
  const router = useRouter()
  const tabs = [{ id: 'trials', label: '焚天火域' }, { id: 'danta', label: '丹塔试炼' }, { id: 'garden', label: '药草种植' }, { id: 'affinity', label: '好感度表' }, { id: 'partners', label: '道侣同行' }, { id: 'skills', label: '斗技修习' }]
  const activeTab = computed({ get: () => tabs.some(tab => tab.id === route.query.tab) ? route.query.tab : 'trials', set: value => router.replace({ query: { tab: value } }) })
  const component = computed(() => ({ trials: TrialPanel, danta: TrialPanel, garden: HerbGarden, affinity: AffinityBoard, partners: PartnerBoard, skills: SkillHall }[activeTab.value]))
  const panelProps = computed(() => ['trials', 'danta'].includes(activeTab.value) ? { group: activeTab.value === 'danta' ? 'danta' : 'fire' } : {})
</script>
