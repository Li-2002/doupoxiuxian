<template>
  <div class="affinity-panel">
    <div class="activity-summary"><div><h3>山水故人</h3><p class="muted">已认识 {{ rows.length }} 人</p></div><span>灵石 {{ player.props.money.toLocaleString() }} · 药草 {{ garden.herbs }} 份</span></div>
    <el-empty v-if="!rows.length" description="尚未结识故人，去大陆历练邂逅第一位 NPC。" />
    <div v-else class="affinity-table-wrap"><table class="affinity-table"><thead><tr><th>故人</th><th>好感</th><th>关系</th><th>互动</th></tr></thead><tbody><tr v-for="npc in rows" :key="npc.id"><td><strong>{{ npc.name }}</strong><small>{{ npc.title }}</small></td><td><el-progress :percentage="Math.min(100, npc.affinity / 10)" :show-text="false" color="#ac9363" /><span>{{ npc.affinity }} / 1000</span></td><td>{{ npc.partner ? '伴侣' : affinityLabel(npc.affinity) }}</td><td><template v-if="!npc.legacy"><el-button size="small" :aria-label="npc.name + '灵石赠礼'" :disabled="npc.affinity >= 1000 || giftCooldownRemaining(npc, now) > 0" @click="gift(npc, 'money')">灵石赠礼 · {{ npcGiftCost(player) }}</el-button><el-button size="small" :aria-label="npc.name + '赠两份药草'" :disabled="npc.affinity >= 1000 || giftCooldownRemaining(npc, now) > 0" @click="gift(npc, 'herbs')">赠 2 份药草</el-button><el-button v-if="npc.romantic" size="small" :disabled="npc.partner || npc.affinity < 1000" @click="bond(npc)">{{ npc.partner ? '已结为伴侣' : '结为伴侣' }}</el-button><small v-if="giftCooldownRemaining(npc, now)">下次赠礼：{{ giftCooldownRemaining(npc, now) }} 秒后</small><p v-if="feedback[npc.id]" class="activity-feedback" role="status">{{ feedback[npc.id] }}</p></template><span v-else class="muted">可在自由行走中互动</span></td></tr></tbody></table></div>
  </div>
</template>
<script setup>
  import { computed, ref, onMounted, onUnmounted } from 'vue'
  import { operationFeedback } from '@/plugins/feedback'
  import { useMainStore } from '@/plugins/store'
  import { knownNpcRows, giveNpcGift, formBond, affinityLabel, npcGiftCost, giftCooldownRemaining } from '@/plugins/worldActivities'
  const player = useMainStore().player
  const garden = player.world.garden
  const rows = computed(() => knownNpcRows(player))
  const feedback = ref({})
  const now = ref(Date.now())
  let timer
  onMounted(() => { timer = setInterval(() => { now.value = Date.now() }, 1000) })
  onUnmounted(() => clearInterval(timer))
  const gift = (npc, kind) => {
    const error = giveNpcGift(player, npc.id, kind)
    now.value = Date.now()
    const gain = player.world.social[npc.id].affinity - npc.affinity
    feedback.value[npc.id] = operationFeedback(error, `已赠${kind === 'herbs' ? ' 2 份药草' : npcGiftCost(player) + ' 灵石'}，好感 +${gain}`)
  }
  const bond = npc => {
    const error = formBond(player, npc.id)
    feedback.value[npc.id] = operationFeedback(error, '已结为伴侣')
  }
</script>
