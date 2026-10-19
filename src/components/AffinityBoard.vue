<template>
  <div class="affinity-panel">
    <div class="activity-summary"><div><h3>山水故人</h3><p class="muted">已认识 {{ rows.length }} 人。相助、护送、采药和赠礼均能增加好感。</p></div><span>知己达 600：每人修炼 +2.5%，合计最多 +20%</span></div>
    <p class="muted">古薰儿可在野外机缘中结识，好感 1000 后结为伴侣会赠送金帝焚天炎火种。赠礼间隔 30 秒，救援事件必须战胜敌人才能获得额外好感。</p>
    <el-empty v-if="!rows.length" description="尚未结识故人，去大陆历练邂逅第一位 NPC。" />
    <div v-else class="affinity-table-wrap"><table class="affinity-table"><thead><tr><th>故人</th><th>好感</th><th>关系</th><th>互动</th></tr></thead><tbody><tr v-for="npc in rows" :key="npc.id"><td><strong>{{ npc.name }}</strong><small>{{ npc.title }}</small></td><td><el-progress :percentage="Math.min(100, npc.affinity / 10)" :show-text="false" color="#ac9363" /><span>{{ npc.affinity }} / 1000</span></td><td>{{ npc.partner ? '伴侣' : affinityLabel(npc.affinity) }}</td><td><template v-if="!npc.legacy"><el-button size="small" :disabled="npc.affinity >= 1000" @click="feedback = giveNpcGift(player, npc.id, 'money') || '赠礼成功'">灵石赠礼</el-button><el-button size="small" :disabled="garden.herbs < 2 || npc.affinity >= 1000" @click="feedback = giveNpcGift(player, npc.id, 'herbs') || '赠礼成功'">赠 2 份药草</el-button><el-button v-if="npc.romantic" size="small" :disabled="npc.partner || npc.affinity < 1000" @click="feedback = formBond(player, npc.id) || '已结为伴侣'">{{ npc.partner ? '已结为伴侣' : '结为伴侣' }}</el-button></template><span v-else class="muted">可在自由行走中互动</span></td></tr></tbody></table></div>
    <p class="muted">灵石赠礼每次消耗 {{ 30 * (1 + Math.floor(player.level / 9)) }}，好感 +20；药草赠礼好感 +35。原有道侣记录也会显示在表中。</p>
    <p class="activity-feedback" role="status">{{ feedback }}</p>
  </div>
</template>
<script setup>
  import { computed, ref } from 'vue'
  import { useMainStore } from '@/plugins/store'
  import { knownNpcRows, giveNpcGift, formBond, affinityLabel } from '@/plugins/worldActivities'
  const player = useMainStore().player
  const garden = player.world.garden
  const rows = computed(() => knownNpcRows(player))
  const feedback = ref('')
</script>
