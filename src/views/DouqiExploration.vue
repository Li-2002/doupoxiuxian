<template>
  <main class="expedition-page">
    <div class="page-intro"><div><p class="place-label">{{ map.area }}</p><h1>行历斗气大陆</h1><p class="muted">入山猎兽，寻一缕天地异火。</p></div><router-link class="quiet-link" to="/wander">自由行走 · NPC 与垂钓</router-link></div>
    <div class="expedition-layout">
      <aside class="region-list" aria-label="历练地图">
        <div class="region-heading">大陆舆图 <span>{{ unlocked }} / {{ worldMaps.length }}</span></div>
        <button v-for="region in worldMaps" :key="region.id" class="region-option" :class="{ selected: map.id === region.id }" :disabled="player.level < region.min" @click="selectMap(player, region.id)">
          <span class="region-symbol" :style="{ color: region.color }">{{ region.symbol }}</span>
          <span><strong>{{ region.name }}</strong><small>{{ levelNames(region.min) }}起</small></span>
          <span class="region-lock">{{ player.level < region.min ? '未开放' : map.id === region.id ? '当前' : '前往' }}</span>
        </button>
      </aside>
      <div class="expedition-main">
        <section class="landscape" :style="{ '--region-color': map.color }">
          <svg class="mountain-art" viewBox="0 0 800 270" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <circle cx="636" cy="64" r="41" fill="currentColor" opacity=".16" />
            <path d="M0 240 125 95 206 167 310 37 432 171 526 87 680 205 752 130 800 178V270H0Z" fill="currentColor" opacity=".10" />
            <path d="m0 260 97-90 92 40L330 104l80 62 57-42 113 125 87-72 133 70v23H0Z" fill="currentColor" opacity=".15" />
            <path d="m0 264 115-35 135 21 126-66 128 55 110-27 186 43v15H0Z" fill="currentColor" opacity=".24" />
            <path d="M554 220v-38h36v38m-45-38 27-14 27 14m-39-9v-28h24v28m-32-28 20-12 20 12m-20-12v-12" fill="none" stroke="currentColor" stroke-width="3" opacity=".5" />
            <path d="M450 270q95-15 23-40t6-32" fill="none" stroke="currentColor" opacity=".23" stroke-width="4" />
          </svg>
          <div class="landscape-copy"><span class="map-stamp">{{ map.symbol }}</span><h2>{{ map.name }}</h2><p>{{ map.desc }}</p><div class="map-drops"><span>{{ stoneTiers[map.stone].name }}</span><span>装备与法宝</span><span>{{ worldNpcs.find(n => n.id === map.npc).name }}的机缘</span></div></div>
        </section>
        <section class="travel-panel">
          <div class="travel-top"><div><h3>{{ world.resting ? '营地疗伤' : world.encounter ? `交战 · ${world.encounter.name}` : '整装待发' }}</h3><p class="muted">{{ world.resting ? '恢复至满血后自动继续，战败不会损失装备。' : world.encounter ? `${levelNames(world.encounter.level)} · 第 ${world.encounter.rounds} 回合` : '每 2 秒推进一次历练，遇敌自动战斗，低血量自动回营。' }}</p></div><span class="realm-badge">{{ levelNames(player.level) }}</span></div>
          <div class="vital-bars"><div><span>你的气血 <b>{{ number(player.health) }} / {{ number(player.maxHealth) }}</b></span><el-progress :percentage="healthPercent" :show-text="false" color="#669b80" /></div><div v-if="world.encounter"><span>{{ world.encounter.name }} <b>{{ number(world.encounter.health) }} / {{ number(world.encounter.maxHealth) }}</b></span><el-progress :percentage="world.encounter.health / world.encounter.maxHealth * 100" :show-text="false" color="#c48164" /></div><div v-else><span>修为进度 <b>{{ cultivationPercent.toFixed(1) }}%</b></span><el-progress :percentage="cultivationPercent" :show-text="false" color="#b28e4c" /></div></div>
          <CombatBreakdown :attack="world.lastAttack" /><div class="automation-controls"><el-radio-group :model-value="world.mode" @update:model-value="mode => operationFeedback(setAutomation(player, mode))"><el-radio-button value="idle">手动</el-radio-button><el-radio-button value="hunt">自动打怪</el-radio-button><el-radio-button value="cultivate">自动修炼</el-radio-button></el-radio-group><el-button type="primary" :disabled="hasActiveTrial(player) || world.mode !== 'idle'" @click="manualExplore">{{ world.resting ? '营地疗伤' : '历练一场' }}</el-button></div>
          <p class="automation-state" :class="{ active: world.mode !== 'idle' }">{{ automationStatus(player) }}</p>
          <div class="automation-options"><el-checkbox v-model="world.autoNpc">挂机时自动处理野外事件</el-checkbox><el-checkbox v-model="world.autoSalvage">背包满时分解新掉落</el-checkbox></div>
          <p class="muted travel-note">药草 {{ world.garden.herbs }} 份 · 自动打怪时，气血不高于 50% 自动服药，间隔 6 秒。</p>
        </section>
        <section class="opportunity-panel" v-if="opportunityNpc">
          <span class="encounter-seal">缘</span><div><small>{{ opportunityNpc.title }} · {{ wildEventTypes[world.opportunity.kind || 'meeting'].name }}</small><h3>路遇 {{ opportunityNpc.name }}</h3><p>{{ wildEventTypes[world.opportunity.kind || 'meeting'].text }}</p><div class="opportunity-actions"><el-button v-for="choice in opportunityChoices(player)" :key="choice.id" :disabled="['trade', 'pay'].includes(choice.id) && player.props.money < tradeCost" @click="resolveOpportunity(player, choice.id)">{{ choice.label }} · {{ choice.detail }}{{ ['trade', 'pay'].includes(choice.id) ? '（' + tradeCost + ' 灵石）' : '' }}</el-button><router-link class="quiet-link" to="/adventures?tab=affinity">查看好感度</router-link></div></div>
        </section>
        <div class="exploration-links"><router-link to="/adventures?tab=trials">焚天火域与丹塔</router-link><router-link to="/adventures?tab=garden">药草种植</router-link><router-link to="/adventures?tab=affinity">好感度表</router-link><router-link to="/adventures?tab=skills">斗技修习</router-link></div><section class="journey-rewards" aria-label="挂机累计收益"><div><small>击败魔兽</small><strong>{{ world.sessions.kills }}<em>只</em></strong></div><div><small>获得灵石</small><strong>{{ number(world.sessions.money) }}</strong></div><div><small>强化石</small><strong>{{ world.sessions.stones }}<em>枚</em></strong></div><div><small>拾取装备</small><strong>{{ world.sessions.equipment }}<em>件</em></strong></div></section>
        <section class="journal"><div class="section-title"><h3>行旅纪事</h3><span>最近 80 条 · 自动保存</span></div><div class="journal-entries" role="log" aria-label="历练日志"><p v-if="!world.logs.length" class="muted">山川辽阔，第一段故事正等你落笔。选择手动历练或开启挂机。</p><div v-for="(entry, index) in world.logs" :key="index" class="journal-entry" :class="entry.type"><time>{{ new Date(entry.time).toLocaleTimeString('zh-CN', { hour12: false }) }}</time><span>{{ entry.text }}</span></div></div></section>
      </div>
    </div>
  </main>
</template>

<script setup>
  import { computed } from 'vue'
  import { useMainStore } from '@/plugins/store'
  import { worldMaps, stoneTiers, worldNpcs } from '@/plugins/douqiWorld'
  import { currentMap, selectMap, setAutomation, explorationStep, resolveOpportunity, automationStatus } from '@/plugins/douqi'
  import { opportunityChoices, hasActiveTrial } from '@/plugins/worldActivities'
  import { wildEventTypes } from '@/plugins/worldContent'
  import CombatBreakdown from '@/components/CombatBreakdown.vue'
  import { operationFeedback } from '@/plugins/feedback'
  import { levelNames, maxLv } from '@/plugins/game'
  const player = useMainStore().player
  const world = player.world
  const map = computed(() => currentMap(player))
  const unlocked = computed(() => worldMaps.filter(region => player.level >= region.min).length)
  const healthPercent = computed(() => Math.max(0, Math.min(100, player.health / player.maxHealth * 100)))
  const cultivationPercent = computed(() => player.level >= maxLv ? 100 : Math.min(100, player.cultivation / player.maxCultivation * 100))
  const opportunityNpc = computed(() => worldNpcs.find(npc => npc.id === world.opportunity?.npc))
  const tradeCost = computed(() => 30 * ((world.opportunity?.level ?? map.value.min) + 1))
  const number = value => Math.floor(value).toLocaleString('zh-CN')
  const manualExplore = () => {
    explorationStep(player)
    for (let i = 0; i < 41 && world.encounter; i++) explorationStep(player)
  }
</script>
