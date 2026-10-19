<template>
  <section class="exclusive-redeem" aria-label="专属装备兑换">
    <h3>专属契印</h3>
    <p>文葬镰刀、监兵凶神、火链、人皇幡。仅兑换可得，每份存档限一套，领取后自动锁定。</p>
    <p class="muted">按当前境界领取；同境界标准红装主属性约高 10%，暴击与闪避不额外增加。可强化、提升境界，无额外套装倍率。</p>
    <div class="redeem-controls">
      <el-input v-model="code" aria-label="专属装备兑换码" placeholder="输入专属兑换码" :disabled="player.world.exclusiveRedeemed" @keyup.enter="redeem" />
      <el-button type="primary" :disabled="player.world.exclusiveRedeemed" @click="redeem">{{ player.world.exclusiveRedeemed ? '已兑换' : '兑换套装' }}</el-button>
    </div>
    <p class="redeem-feedback" role="status">{{ feedback || (player.world.exclusiveRedeemed ? '本存档已领取专属套装，可到行囊穿戴。' : '兑换后直接存入行囊，请预留四格空间。') }}</p>
  </section>
</template>
<script setup>
  import { ref } from 'vue'
  import { useMainStore } from '@/plugins/store'
  import { redeemExclusiveSet } from '@/plugins/equipmentGrowth'
  const player = useMainStore().player
  const code = ref('')
  const feedback = ref('')
  const redeem = () => {
    feedback.value = redeemExclusiveSet(player, code.value) || '兑换成功！四件专属装备已存入行囊并锁定。'
    if (player.world.exclusiveRedeemed) code.value = ''
  }
</script>
<style scoped>
  .exclusive-redeem { margin-top: 28px; padding: 20px 0 0; border-top: 1px solid var(--el-border-color); }
  .exclusive-redeem h3 { margin: 0 0 10px; }
  .exclusive-redeem p { line-height: 1.8; font-size: 14px; }
  .redeem-controls { display: flex; gap: 10px; }
  .redeem-controls .el-input { flex: 1; min-width: 0; }
  .redeem-controls .el-button { margin-left: 0; }
  .redeem-feedback { color: var(--el-color-primary); min-height: 24px; }
  @media (max-width: 480px) { .redeem-controls { flex-direction: column; } }
</style>
