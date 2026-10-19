import map from '../views/mapExploration.vue'
import douqiMap from '../views/DouqiExploration.vue'
import sanctum from '../views/WorldSanctum.vue'
import adventures from '../views/WorldAdventures.vue'
import { useMainStore } from './store'
import { hasActiveTrial } from './worldActivities'
import boss from '../views/bossPage.vue'
import home from '../views/homePage.vue'
import index from '../views/indexPage.vue'
import explore from '../views/explorePage.vue'
import cultivate from '../views/cultivatePage.vue'
import endlesstower from '../views/endlessPage.vue'
import game from '../views/game/game.vue'
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/adventures', name: 'adventures', component: adventures },
  {
    path: '/',
    name: 'index',
    meta: {
      keepAlive: false
    },
    component: index
  },
  {
    path: '/home',
    name: 'home',
    meta: {
      keepAlive: false
    },
    component: home
  },
  {
    path: '/cultivate',
    name: 'cultivate',
    meta: {
      keepAlive: false
    },
    component: cultivate
  },
  {
    path: '/map',
    name: 'map',
    meta: {
      keepAlive: false
    },
    component: douqiMap
  },
  {
    path: '/wander',
    name: 'wander',
    component: map
  },
  {
    path: '/sanctum',
    name: 'sanctum',
    component: sanctum
  },
  {
    path: '/explore',
    name: 'explore',
    meta: {
      keepAlive: false
    },
    component: explore
  },
  {
    path: '/boss',
    name: 'boss',
    meta: {
      keepAlive: false
    },
    component: boss
  },
  {
    path: '/endlesstower',
    name: 'endlesstower',
    meta: {
      keepAlive: false
    },
    component: endlesstower
  },
  {
    path: '/game',
    name: 'game',
    meta: {
      keepAlive: false
    },
    component: game
  }
]
const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from) { return to.path !== from.path ? { top: 0 } : false }
})
router.beforeEach(to => {
  if (['/boss', '/explore', '/endlesstower', '/wander', '/game'].includes(to.path) && hasActiveTrial(useMainStore().player)) return '/adventures?tab=trials'
})

export default router
