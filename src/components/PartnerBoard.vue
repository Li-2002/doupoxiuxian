<template>
  <section class="partner-board">
    <div class="activity-summary"><div><h3>同赴山海</h3><p class="muted">道侣 {{ rows.length }} / {{ MAX_PARTNERS }} 位 · 加成席位 {{ team.length }} / {{ MAX_PARTNER_TEAM }} · 情缘 {{ player.props.qingyuan }}</p></div><router-link class="quiet-link" to="/adventures?tab=affinity">结识故人、赠礼与结伴</router-link></div>
    <div class="partner-team"><div v-for="(label, index) in ['主位', '支援一', '支援二']" :key="label"><small>{{ label }}</small><strong>{{ team[index] || '待邀同行' }}</strong><span>{{ index ? '提供 25% 培养属性' : '提供完整培养属性' }}</span></div></div>
    <p class="muted">最多结为 {{ MAX_PARTNERS }} 位道侣，选 {{ MAX_PARTNER_TEAM }} 位同行提供属性与羁绊修炼加成；其余道侣仍可培养、赠礼、谈心和同游。全队加成有上限。</p>
    <p class="team-bonus">同行合计：攻击 +{{ bonus.attack }} · 防御 +{{ bonus.defense }} · 气血 +{{ bonus.health }}<span v-if="cultivationBonus"> · 羁绊修炼加成 +{{ Math.round(cultivationBonus * 100) }}%</span></p>
    <el-empty v-if="!rows.length" description="尚未结为道侣。先结识故人，将好感培养至 1000 后结伴。" />
    <div class="partner-grid"><article v-for="item in rows" :key="item.name" :class="{ following: item.teamIndex >= 0 }">
      <header><div><h4>{{ item.name }}</h4><small>{{ levelNames(item.level) }}</small></div><span>{{ item.teamIndex === 0 ? '主位' : item.teamIndex > 0 ? '支援' : '洞府修行' }}</span></header>
      <p>攻击 {{ item.attack }} · 防御 {{ item.defense }} · 气血 {{ item.health }}</p>
      <p>羁绊 {{ item.bondLevel }} / 5 重 · 相伴经验 {{ item.bondExperience || 0 }} / 80</p><el-progress :percentage="Math.min(100, (item.bondExperience || 0) / 80 * 100)" :show-text="false" color="#ac9363" />
      <div class="partner-actions"><el-button v-if="item.teamIndex < 0" size="small" :disabled="team.length >= MAX_PARTNER_TEAM" :aria-label="item.name + '加入同行'" @click="updateTeam([...team, item.name])">加入同行</el-button><el-button v-else size="small" @click="updateTeam(team.filter(name => name !== item.name))">退出同行</el-button><el-button size="small" :disabled="item.teamIndex === 0 || (item.teamIndex < 0 && team.length >= MAX_PARTNER_TEAM)" :aria-label="item.name + '设为主位'" @click="updateTeam([item.name, ...team.filter(name => name !== item.name)])">设为主位</el-button><el-button size="small" type="primary" :disabled="item.level >= player.level || item.level >= maxLv" :aria-label="item.name + '道侣升级'" @click="act(() => upgradePartner(player, item.name), item.name + '培养成功')">{{ item.level >= Math.min(player.level, maxLv) ? '已达当前境界' : '升级 · ' + partnerUpgradeCost(item) + ' 情缘' }}</el-button></div>
      <div class="partner-actions"><el-button size="small" :disabled="interactionRemaining(item, now) > 0" :aria-label="item.name + '谈心'" @click="act(() => interactPartner(player, item.name, 'chat'), '谈心完成：情缘 +8、羁绊经验 +4')">谈心</el-button><el-button size="small" :disabled="interactionRemaining(item, now) > 0" :aria-label="item.name + '同游'" @click="act(() => interactPartner(player, item.name, 'stroll'), '同游完成：情缘 +12、羁绊经验 +6')">同游 · 2 份药草</el-button><el-button size="small" :aria-label="item.name + '赠礼'" @click="openGift(item)">赠礼</el-button></div>
      <small>{{ interactionRemaining(item, now) ? '下次相伴：' + interactionRemaining(item, now) + ' 秒后' : '每位道侣每 5 分钟可谈心或同游一次。' }}</small>
    </article></div>
    <p v-if="feedback" role="status" class="activity-feedback">{{ feedback }}</p>
    <GiftShop />
    <GiftDialog v-model="giftOpen" :npc="giftNpc" />
  </section>
</template>
<script setup>
  import { computed, ref, onMounted, onUnmounted } from 'vue'
  import { useMainStore } from '@/plugins/store'
  import { partnerRows, initializeBonds, partnerContribution, partnerCultivationBonus, partnerUpgradeCost, setPartnerTeam, upgradePartner, interactPartner, interactionRemaining } from '@/plugins/partners'
  import { levelNames, maxLv } from '@/plugins/realms'
  import { MAX_PARTNERS, MAX_PARTNER_TEAM } from '@/plugins/partnerContent'
  import { knownNpcRows } from '@/plugins/worldActivities'
  import { operationFeedback } from '@/plugins/feedback'
  import GiftShop from './GiftShop.vue'
  import GiftDialog from './GiftDialog.vue'
  const player = useMainStore().player
  initializeBonds(player)
  const rows = computed(() => partnerRows(player)), team = computed(() => player.world.bonds.team)
  const bonus = computed(() => partnerContribution(player)), cultivationBonus = computed(() => partnerCultivationBonus(player))
  const feedback = ref(''), now = ref(Date.now()), giftOpen = ref(false), giftNpc = ref(null)
  let timer
  onMounted(() => { timer = setInterval(() => { now.value = Date.now() }, 1000) })
  onUnmounted(() => clearInterval(timer))
  const act = (action, success) => { feedback.value = operationFeedback(action(), success); now.value = Date.now() }
  const updateTeam = names => act(() => setPartnerTeam(player, names), '同行阵容已更新')
  const openGift = item => { giftNpc.value = knownNpcRows(player).find(npc => npc.id === item.npcId); giftOpen.value = true }
</script>
<style scoped>
  .partner-board { text-align: left; }
  .partner-team { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 20px 0; }
  .partner-team > div { padding: 18px; border: 1px solid var(--el-border-color); background: var(--el-fill-color-light); }
  .partner-team strong, .partner-team span { display: block; margin-top: 10px; } .partner-team strong { font: 23px 'KaiTi', serif; color: var(--el-color-primary); }
  small, .partner-team span { font-size: 12px; color: var(--el-text-color-secondary); line-height: 1.8; } .team-bonus { font-size: 13px; color: var(--el-color-primary); line-height: 1.8; }
  .partner-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin: 20px 0; }
  article { padding: 22px; border: 1px solid var(--el-border-color); } article.following { border-color: #80a399; }
  header { display: flex; justify-content: space-between; gap: 12px; align-items: start; } header span { font-size: 12px; color: #a28048; }
  h4 { margin: 0 0 8px; font: 25px 'KaiTi', serif; color: var(--el-color-primary); } article p { font-size: 12px; line-height: 1.8; }
  .partner-actions { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0; } .partner-actions .el-button { margin: 0; }
  @media (max-width: 480px) { .partner-team { gap: 6px; } .partner-team > div { padding: 12px 8px; } .partner-team strong { font-size: 19px; } .partner-grid { grid-template-columns: 1fr; } article { padding: 18px; } }
</style>
