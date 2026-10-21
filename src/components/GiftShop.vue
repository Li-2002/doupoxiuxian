<template>
  <section class="gift-shop">
    <div class="gift-heading"><div><h3>故人礼匣</h3><p class="muted">情缘 {{ player.props.qingyuan }} · 灵石 {{ player.props.money.toLocaleString() }}</p></div><el-button :disabled="player.world.bonds.starterClaimed" @click="act(() => claimBondStarter(player), '获得 30 情缘与三种普通礼物各一份')">{{ player.world.bonds.starterClaimed ? '入门补给已领取' : '领取情缘入门补给' }}</el-button></div>
    <p class="muted">历练胜利 +1 情缘，收获 +2，修炼每分钟 +2。友善奇遇、赠礼和相伴也可积累。</p>
    <div class="common-gifts"><article v-for="gift in common" :key="gift.id"><div><h4>{{ gift.name }}</h4><span>现有 {{ gifts[gift.id] || 0 }} 份</span></div><p>赠礼：情缘 +{{ gift.qingyuan }} · 好感 +{{ gift.affinity }}<br>合心意额外好感 +2、情缘 +1</p><div class="gift-buy"><el-button size="small" @click="act(() => buyGift(player, gift.id), '已购入' + gift.name)">购买 1 份 · {{ gift.price }} 灵石</el-button><el-button size="small" @click="act(() => buyGift(player, gift.id, 5), '已购入 5 份' + gift.name)">买 5 份</el-button></div><small>{{ gift.source }}</small></article></div>
    <details class="signature-gifts"><summary>专属礼物与获取途径</summary><p v-for="gift in signature" :key="gift.id"><b>{{ gift.name }}</b> ×{{ gifts[gift.id] || 0 }} · 赠予{{ worldNpcs.find(npc => npc.id === gift.recipient).name }}<br><small>{{ gift.source }}；赠礼情缘 +20，好感 +12。</small></p></details>
    <p v-if="feedback" class="activity-feedback" role="status">{{ feedback }}</p>
  </section>
</template>
<script setup>
  import { computed, ref } from 'vue'
  import { useMainStore } from '@/plugins/store'
  import { giftCatalog } from '@/plugins/partnerContent'
  import { buyGift, claimBondStarter, initializeBonds } from '@/plugins/partners'
  import { worldNpcs } from '@/plugins/douqiWorld'
  import { operationFeedback } from '@/plugins/feedback'
  const player = useMainStore().player
  initializeBonds(player)
  const gifts = computed(() => player.world.bonds.gifts)
  const common = giftCatalog.filter(gift => gift.price), signature = giftCatalog.filter(gift => gift.recipient)
  const feedback = ref('')
  const act = (action, success) => { feedback.value = operationFeedback(action(), success) }
</script>
<style scoped>
  .gift-shop { margin: 20px 0 28px; padding: 22px; background: var(--el-fill-color-light); border: 1px solid var(--el-border-color); text-align: left; }
  .gift-heading { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; align-items: center; }
  h3 { margin: 0; font: 25px 'KaiTi', serif; color: var(--el-color-primary); } h4 { margin: 0; font-size: 16px; }
  .common-gifts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
  article { padding: 16px; background: var(--el-bg-color); border: 1px solid var(--el-border-color); }
  article > div:first-child { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
  article span, article p, small { font-size: 12px; line-height: 1.8; color: var(--el-text-color-secondary); }
  .gift-buy { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; } .gift-buy .el-button { margin: 0; }
  .signature-gifts { margin-top: 18px; font-size: 13px; } summary { cursor: pointer; color: var(--el-color-primary); } .signature-gifts p { line-height: 1.8; }
  @media (max-width: 700px) { .common-gifts { grid-template-columns: 1fr; } .gift-shop { padding: 16px; } }
</style>
