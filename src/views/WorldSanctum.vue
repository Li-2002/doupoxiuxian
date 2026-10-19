<template>
  <main class="sanctum-page">
    <div class="page-intro"><div><p class="place-label">天地之灵，万火之尊</p><h1>异火与炼器</h1><p class="muted">每一道异火，都是一段不同的机缘。</p></div><span class="realm-badge">灵石 {{ player.props.money.toLocaleString() }}</span></div>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="异火图鉴" name="flames">
        <div class="sanctum-summary"><div><h3>异火榜</h3><p>已寻获 {{ world.flames.length }} / 23 · 已炼化 {{ profile.parts.length }} 道，全部协同附伤</p></div><span>当前总附伤 +{{ (profile.total * 100).toFixed(1) }}%</span></div>
        <p class="muted">图鉴记载每道异火的获取方式。随机机缘、副本首通、药圃、伴侣与野外首领各有路径。炼化后的每道异火都随攻击触发，按同一次命中伤害附加，收益递减，总增幅低于 55%。</p>
        <p class="sanctum-feedback" role="status">{{ feedback }}</p>
        <div class="flame-grid">
          <article v-for="fire in heavenlyFlames" :key="fire.id" class="flame-card" :class="{ owned: ownedFire(fire.id), active: ownedFire(fire.id)?.refined }" :style="{ '--fire-color': fire.color }">
            <div class="flame-card-top"><span class="flame-rank">榜 {{ fire.rank }}</span><span>{{ ownedFire(fire.id)?.refined ? '已炼化 · 协同附伤' : ownedFire(fire.id) ? '已获火种' : '待寻获' }}</span></div>
            <div class="fire-glyph" aria-hidden="true">♨</div><h3>{{ fire.name }}</h3><p class="acquisition-type">{{ sourceNames[fire.source.type] }}</p><p class="flame-source">{{ fire.source.text }}</p>
            <p>炼化：{{ levelNames(fire.min) }} · {{ fire.cost }} 灵石</p><p class="flame-effect">基础附伤 {{ (fire.attack * 100).toFixed(2) }}%<br>修炼基础加成 {{ (fire.cultivation * 100).toFixed(1) }}%</p>
            <div class="flame-card-actions"><el-button v-if="!ownedFire(fire.id)?.refined" :disabled="!ownedFire(fire.id) || player.level < fire.min || player.props.money < fire.cost" @click="refine(fire.id)">{{ ownedFire(fire.id) ? '炼化异火' : '尚未寻获' }}</el-button><span v-else class="refined-note">已自动参与每次攻击</span><router-link class="quiet-link" :to="sourceLink(fire)">查看获取地点</router-link></div>
          </article>
        </div>
      </el-tab-pane>
      <el-tab-pane label="炼器坊" name="forge">
        <p class="muted">所有神兵、护甲、法器与灵宝均可强化至 +30。每级增加初始主属性的 4%，前五次必成；之后失败保留装备和等级。战斗中请先退回营地整备。</p>
        <div class="stone-wallet"><span v-for="stone in stoneTiers" :key="stone.key" :style="{ color: stone.color }">{{ stone.name }} <b>{{ player.props[stone.key] }}</b></span></div>
        <div class="workshop-layout"><div class="workshop-items"><h3>选择装备</h3><p v-if="!allEquipment.length" class="muted">去大陆历练获得战利品，或领取洞府新手礼包。</p><button v-for="entry in allEquipment" :key="entry.item.id" class="workshop-item" :class="{ selected: selectedItem === entry.item }" @click="selectedItem = entry.item"><tag :type="entry.item.quality">{{ entry.item.name }} +{{ entry.item.strengthen || 0 }}</tag><small>{{ entry.worn ? '已穿戴' : '行囊' }} · {{ genre[entry.item.type] }}</small></button></div><Transition name="activity" mode="out-in"><ForgePanel v-if="selectedItem" :key="selectedItem.id" :item="selectedItem" /><p v-else class="forge-placeholder muted">选择一件装备，查看材料和强化效果。</p></Transition></div>
      </el-tab-pane>
      <el-tab-pane label="好感度表" name="npcs"><AffinityBoard /></el-tab-pane>
    </el-tabs>
  </main>
</template>
<script setup>
  import { ref, computed } from 'vue'
  import { useMainStore } from '@/plugins/store'
  import { heavenlyFlames, stoneTiers } from '@/plugins/douqiWorld'
  import { refineFlame } from '@/plugins/douqi'
  import { flameDamageProfile } from '@/plugins/balance'
  import { levelNames, genre } from '@/plugins/game'
  import ForgePanel from '@/components/ForgePanel.vue'
  import AffinityBoard from '@/components/AffinityBoard.vue'
  import tag from '@/components/tag.vue'
  const player = useMainStore().player
  const world = player.world
  const activeTab = ref('flames')
  const selectedItem = ref(null)
  const feedback = ref('')
  const ownedFire = id => world.flames.find(fire => fire.id === id)
  const profile = computed(() => flameDamageProfile(player))
  const sourceNames = { wild: '野外随机机缘', trial: '多关副本首通', garden: '药圃奇遇', bond: '伴侣赠礼', boss: '稀有野外首领' }
  const sourceLink = fire => fire.source.type === 'trial' ? { path: '/adventures', query: { tab: fire.source.trial === 'danta' ? 'danta' : 'trials' } } : fire.source.type === 'garden' ? '/adventures?tab=garden' : fire.source.type === 'bond' ? '/adventures?tab=affinity' : '/map'
  const allEquipment = computed(() => [...Object.values(player.equipment).filter(item => item?.name).map(item => ({ item, worn: true })), ...player.inventory.map(item => ({ item, worn: false }))])
  const refine = id => { feedback.value = refineFlame(player, id) || '炼化成功，已加入协同附伤。' }
</script>
