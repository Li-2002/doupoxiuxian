<template>
  <section class="exclusive-redeem" aria-label="专属装备兑换">
    <div class="redeem-controls">
      <el-input v-model="code" aria-label="专属装备兑换码" placeholder="输入专属兑换码" :disabled="player.world.exclusiveRedeemed" @keyup.enter="redeem" />
      <el-button type="primary" :disabled="player.world.exclusiveRedeemed" @click="redeem">{{ player.world.exclusiveRedeemed ? '已兑换' : '兑换套装' }}</el-button>
    </div>
    <p v-if="feedback" class="redeem-feedback" role="status">{{ feedback }}</p>
  </section>
</template>
<script setup>
  import { ref } from 'vue'
  import { useMainStore } from '@/plugins/store'
  import { redeemExclusiveSet } from '@/plugins/equipmentGrowth'
  import { operationFeedback } from '@/plugins/feedback'
  const player = useMainStore().player
  const code = ref('')
  const feedback = ref('')
  const redeem = () => {
    feedback.value = operationFeedback(redeemExclusiveSet(player, code.value), '兑换成功！四件专属装备已存入行囊并锁定。')
    if (player.world.exclusiveRedeemed) code.value = ''
  }
</script>
<style scoped>
  .exclusive-redeem { margin-top: 20px; }
  .exclusive-redeem p { line-height: 1.8; font-size: 14px; }
  .redeem-controls { display: flex; gap: 10px; }
  .redeem-controls .el-input { flex: 1; min-width: 0; }
  .redeem-controls .el-button { margin-left: 0; }
  .redeem-feedback { color: var(--el-color-primary); min-height: 24px; }
  @media (max-width: 480px) { .redeem-controls { flex-direction: column; } }
</style>
