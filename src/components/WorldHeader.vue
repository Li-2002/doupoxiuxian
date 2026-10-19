<template>
  <header class="world-header">
    <router-link to="/home" class="world-brand"><span class="brand-seal">斗</span><span>斗破修仙世界<small>斗气大陆 · 从乌坦城启程</small></span></router-link>
    <nav aria-label="主要导航">
      <router-link to="/home">洞府行囊</router-link><router-link to="/map">大陆历练</router-link>
      <router-link to="/cultivate">斗气修炼</router-link><router-link to="/sanctum">异火与炼器</router-link>
      <router-link to="/adventures">秘境与机缘</router-link>
    </nav>
  </header>
  <div class="world-status" v-if="player.world.mode !== 'idle'">
    <span role="status"><i class="status-dot" />{{ automationStatus(player, paused) }} · {{ levelNames(player.level) }}</span>
    <button class="text-button" @click="setAutomation(player, 'idle')">停止挂机</button>
  </div>
  <div class="world-status" v-if="player.world.trial && ['fighting', 'ready'].includes(player.world.trial.status)"><span>试炼进行中 · 第 {{ player.world.trial.stage + 1 }} 关 · {{ player.world.trial.auto ? '自动战斗' : '等待操作' }}</span><router-link :to="player.world.trial.id === 'danta' ? '/adventures?tab=danta' : '/adventures?tab=trials'">返回试炼</router-link></div>
</template>
<script setup>
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { useMainStore } from '@/plugins/store'
  import { setAutomation, automationStatus } from '@/plugins/douqi'
  import { levelNames } from '@/plugins/game'
  const player = useMainStore().player
  const route = useRoute()
  const paused = computed(() => ['/explore', '/boss', '/endlesstower', '/wander', '/game'].includes(route.path) && player.world.mode !== 'cultivate')
</script>
