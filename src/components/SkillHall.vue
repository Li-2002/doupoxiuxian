<template>
  <div class="skill-panel">
    <div class="activity-summary"><div><h3>斗技修习</h3><p class="muted">选择一门主修斗技，战斗时依冷却自动施展，间隔回合使用普攻。</p></div><span>附伤 {{ (profile.total * 100).toFixed(1) }}% · {{ profile.parts.length }} 道异火</span></div>
    <div class="skill-grid"><article v-for="skill in combatSkills" :key="skill.id" :class="{ selected: world.skillId === skill.id }"><small>{{ levelNames(skill.min) }}起 · {{ world.skills[skill.id] || 0 }} / 5 重</small><h3>{{ skill.name }}</h3><p>{{ skill.desc }}</p><div class="skill-values"><strong>{{ Math.round((skill.coefficient + Math.max(0, (world.skills[skill.id] || 1) - 1) * 0.04) * 100) }}% 攻击倍率</strong><span>每 {{ skill.cooldown + 1 }} 回合施展</span></div><p v-if="skill.flames" class="muted">至少炼化 {{ skill.flames }} 道异火</p><div class="activity-actions"><el-button :disabled="player.level < skill.min || (world.skills[skill.id] || 0) >= 5" @click="feedback = trainSkill(player, skill.id) || '修习成功'">{{ world.skills[skill.id] ? '修习下一重' : '学习斗技' }} · {{ 20 * (skill.min + 1) * ((world.skills[skill.id] || 0) + 1) }} 灵石</el-button><el-button v-if="world.skills[skill.id]" :disabled="world.skillId === skill.id || busy" @click="world.skillId = skill.id">{{ world.skillId === skill.id ? '正在主修' : '设为主修' }}</el-button></div></article></div>
    <div class="balance-rules"><h3>伤害规则</h3><p>攻击先乘斗技倍率，再计算防御减伤与暴击。每道已炼化异火按该次命中的基础伤害附加一段火焰伤害；所有异火相加后递减，总增幅低于 55%，不会彼此乘算。</p><p>斗技倍率最高 250%，暴击为 150% 伤害，实际暴击率最高 50%，闪避率最高 35%，防御减伤最高 75%。低伤害附伤不足 1 点时取整，避免靠火焰数量堆出固定高伤。</p><p>装备强化每级增加初始主属性的 4%，+30 时为初始的 220%。品质、境界点、灵宠和道侣采用有限成长。</p></div>
    <p class="activity-feedback" role="status">{{ feedback }}</p>
  </div>
</template>
<script setup>
  import { computed, ref } from 'vue'
  import { useMainStore } from '@/plugins/store'
  import { combatSkills } from '@/plugins/worldContent'
  import { flameDamageProfile } from '@/plugins/balance'
  import { trainSkill, hasActiveTrial } from '@/plugins/worldActivities'
  import { levelNames } from '@/plugins/game'
  const player = useMainStore().player
  const world = player.world
  const profile = computed(() => flameDamageProfile(player))
  const busy = computed(() => hasActiveTrial(player) || !!world.encounter)
  const feedback = ref('')
</script>
