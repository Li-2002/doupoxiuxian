<template>
  <el-dialog v-model="open" :title="'赠礼 · ' + (current?.name || '')" width="min(600px, 94vw)" append-to-body>
    <template v-if="current">
      <p>好感 {{ current.affinity }} / 1000 · 情缘 {{ player.props.qingyuan }} · 灵石 {{ player.props.money }}</p>
      <p class="muted">可向所有已结识故人赠礼。满好感仍获得情缘，伴侣还会积累羁绊。</p>
      <div class="simple-gifts"><el-button :disabled="remaining > 0" @click="send('money')">灵石赠礼 · {{ npcGiftCost(player) }}（情缘 +2）</el-button><el-button :disabled="remaining > 0" @click="send('herbs')">赠 2 份药草（情缘 +3）</el-button></div>
      <article v-for="gift in choices" :key="gift.id" class="gift-choice">
        <div><strong>{{ gift.name }}</strong><span v-if="gift.favorites?.includes(current.id)" class="favorite">合心意</span><small>现有 {{ gifts[gift.id] || 0 }} 份 · 情缘 +{{ gift.qingyuan + (gift.favorites?.includes(current.id) ? 1 : 0) }} · 好感 +{{ gift.affinity + (gift.favorites?.includes(current.id) ? 2 : 0) }}</small></div>
        <div><el-button v-if="gift.price" size="small" @click="purchase(gift)">购买 · {{ gift.price }}</el-button><el-button size="small" type="primary" :disabled="remaining > 0 || !gifts[gift.id]" :aria-label="current.name + '赠送' + gift.name" @click="send(gift.id)">赠送</el-button></div>
      </article>
      <p class="muted">{{ remaining ? `下次赠礼还需 ${remaining} 秒` : '每位故人每 60 秒可赠礼一次。' }}</p>
      <p role="status" class="activity-feedback">{{ feedback }}</p>
    </template>
  </el-dialog>
</template>
<script setup>
  import { computed, ref, onMounted, onUnmounted } from 'vue'
  import { useMainStore } from '@/plugins/store'
  import { giftCatalog } from '@/plugins/partnerContent'
  import { buyGift } from '@/plugins/partners'
  import { knownNpcRows, giveNpcGift, giftCooldownRemaining, npcGiftCost } from '@/plugins/worldActivities'
  import { operationFeedback } from '@/plugins/feedback'
  const open = defineModel({ type: Boolean, default: false })
  const props = defineProps({ npc: { type: Object, default: null } })
  const player = useMainStore().player
  const current = computed(() => knownNpcRows(player).find(npc => npc.id === props.npc?.id))
  const gifts = computed(() => player.world.bonds.gifts)
  const choices = computed(() => giftCatalog.filter(gift => !gift.recipient || gift.recipient === current.value?.id))
  const now = ref(Date.now()), feedback = ref('')
  const remaining = computed(() => giftCooldownRemaining(player.world.social[current.value?.id] || {}, now.value))
  let timer
  onMounted(() => { timer = setInterval(() => { now.value = Date.now() }, 1000) })
  onUnmounted(() => clearInterval(timer))
  const send = kind => {
    const before = player.props.qingyuan
    const error = giveNpcGift(player, current.value.id, kind)
    now.value = Date.now()
    feedback.value = operationFeedback(error, `赠礼完成，情缘 +${player.props.qingyuan - before}，传送符 +1。`)
  }
  const purchase = gift => { feedback.value = operationFeedback(buyGift(player, gift.id), '已购入' + gift.name) }
</script>
<style scoped>
  p { line-height: 1.8; } .simple-gifts { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; } .simple-gifts .el-button { margin: 0; }
  .gift-choice { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; padding: 16px 0; border-bottom: 1px solid var(--el-border-color); }
  small { display: block; margin-top: 8px; font-size: 12px; color: var(--el-text-color-secondary); }
  .favorite { font-size: 11px; color: #a28048; margin-left: 12px; }
</style>
