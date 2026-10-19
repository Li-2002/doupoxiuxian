import App from './App.vue'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'element-plus/dist/index.css'
import router from '@/plugins/router'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import ElementPlus from 'element-plus'
import { useMainStore } from '@/plugins/store'
import { initializeWorld, advanceWorld, MAX_OFFLINE_TICKS, addWorldLog } from '@/plugins/douqi'
import './assets/douqi.css'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
const player = useMainStore().player
initializeWorld(player)
if (['fighting', 'ready'].includes(player.world.trial?.status)) {
  player.world.trial.auto = false
  player.world.mode = 'idle'
  player.world.lastTick = Date.now()
}
if (player.world.mode !== 'idle') {
  const ticks = advanceWorld(player, Date.now(), true, MAX_OFFLINE_TICKS)
  if (ticks > 30) addWorldLog(player, `离线历练已结算 ${Math.floor(ticks * 2 / 60)} 分钟（最多 4 小时）。`, 'system')
}

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.use(ElementPlus)
app.mount('#app')
