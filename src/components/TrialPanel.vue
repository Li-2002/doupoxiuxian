<template>
  <div class="trial-panel">
    <p class="muted">{{ group === 'danta' ? '丹塔的星域试炼共六关，首通获得三千焱炎火。' : '焚天火域分为三条试炼，每条均有多关，首通获得对应异火。' }} 关间仅恢复 10% 气血，试炼期间暂停修炼和野外挂机，不能换装或使用药草。</p>
    <div class="trial-selector">
      <button v-for="definition in definitions" :key="definition.id" class="trial-card" :class="{ selected: selected === definition.id }" @click="selected = definition.id">
        <small>{{ definition.rooms }} 重关隘 · {{ clears[definition.id] ? '已通关' : '尚未通关' }}</small>
        <h3>{{ definition.name }}</h3><p>{{ definition.desc }}</p><strong>{{ levelNames(definition.min) }}起</strong><span>首通：{{ fireName(definition.fire) }}</span>
      </button>
    </div>
    <div v-if="!hasActiveTrial(player)" class="trial-entry">
      <div><h3>{{ chosen.name }}</h3><p class="muted">守关首领：{{ chosen.boss }} · {{ trialEnemy(chosen.id, chosen.rooms - 1).health.toLocaleString() }} 气血 · {{ trialEnemy(chosen.id, chosen.rooms - 1).attack.toLocaleString() }} 攻击 · {{ trialEnemy(chosen.id, chosen.rooms - 1).defense.toLocaleString() }} 防御</p></div>
      <el-button type="primary" :disabled="player.level < chosen.min" @click="begin">{{ player.level < chosen.min ? '境界尚未达到' : '进入试炼' }}</el-button>
    </div>
    <section v-if="run" class="trial-arena" :class="run.status">
      <div class="section-title"><h3>{{ trials.find(item => item.id === run.id).name }}</h3><span>{{ statusNames[run.status] }} · 第 {{ run.stage + 1 }} / {{ trials.find(item => item.id === run.id).rooms }} 关</span></div>
      <div class="stage-path" aria-label="关卡进度"><span v-for="step in trials.find(item => item.id === run.id).rooms" :key="step" :class="{ passed: step <= run.stage || run.status === 'cleared', current: step === run.stage + 1 }">{{ step }}</span></div>
      <div class="arena-fighters"><div><small>你的气血</small><strong>{{ Math.floor(player.health).toLocaleString() }} / {{ player.maxHealth.toLocaleString() }}</strong><el-progress :percentage="Math.max(0, player.health / player.maxHealth * 100)" :show-text="false" color="#669b80" /><p>攻击 {{ player.attack }} · 防御 {{ player.defense }}</p></div><div><small>{{ run.enemy.name }}{{ run.enemy.boss ? ' · 守关首领' : '' }}</small><strong>{{ run.enemy.health.toLocaleString() }} / {{ run.enemy.maxHealth.toLocaleString() }}</strong><el-progress :percentage="run.enemy.health / run.enemy.maxHealth * 100" :show-text="false" color="#bc7f67" /><p>第 {{ run.enemy.rounds }} 回合 · 攻击 {{ run.enemy.attack }} · 防御 {{ run.enemy.defense }}</p></div></div>
      <CombatBreakdown :attack="run.lastAttack" />
      <div class="activity-actions" v-if="hasActiveTrial(player)"><el-button v-if="run.status === 'fighting'" type="primary" :disabled="run.auto" @click="trialStep(player)">施展斗技</el-button><el-button v-if="run.status === 'ready'" type="primary" :disabled="run.auto" @click="nextTrialStage(player)">进入下一关</el-button><el-button @click="run.auto = !run.auto">{{ run.auto ? '暂停自动战斗' : '自动战斗' }}</el-button><el-button @click="leaveTrial(player)">退出试炼</el-button></div>
      <p v-else class="muted">{{ run.status === 'cleared' ? '试炼完成，异火火种和通关奖励已存入存档。' : '可回营疗伤，调整装备与斗技后重新挑战。' }}</p>
    </section>
    <div class="activity-actions"><el-button @click="feedback = operationFeedback(restAtCamp(player), '恢复了 20% 气血')">营地疗伤</el-button><router-link class="quiet-link" to="/sanctum">查看异火图鉴与强化</router-link></div>
    <p role="status" class="activity-feedback">{{ feedback }}</p>
  </div>
</template>
<script setup>
  import { computed, ref } from 'vue'
  import { useMainStore } from '@/plugins/store'
  import { trials } from '@/plugins/worldContent'
  import { heavenlyFlames } from '@/plugins/douqiWorld'
  import { levelNames } from '@/plugins/game'
  import { startTrial, trialStep, nextTrialStage, leaveTrial, hasActiveTrial, trialEnemy, restAtCamp } from '@/plugins/worldActivities'
  import CombatBreakdown from './CombatBreakdown.vue'
  import { operationFeedback } from '@/plugins/feedback'
  const props = defineProps({ group: String })
  const player = useMainStore().player
  const world = player.world
  const definitions = computed(() => trials.filter(item => props.group === 'danta' ? item.id === 'danta' : item.id !== 'danta'))
  const selected = ref(definitions.value.some(item => item.id === world.trial?.id) ? world.trial.id : props.group === 'danta' ? 'danta' : 'lotus-trial')
  const chosen = computed(() => definitions.value.find(item => item.id === selected.value) || definitions.value[0])
  const run = computed(() => world.trial)
  const clears = world.trialClears
  const feedback = ref('')
  const fireName = id => heavenlyFlames.find(fire => fire.id === id).name
  const statusNames = { fighting: '交战中', ready: '已通过本关', cleared: '通关', failed: '挑战失败', left: '已退出' }
  const begin = () => { feedback.value = operationFeedback(startTrial(player, chosen.value.id)) }
</script>
