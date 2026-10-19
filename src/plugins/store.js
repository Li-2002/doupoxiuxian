import { defineStore } from 'pinia'
import crypto from '@/plugins/crypto'
import { createWorldState } from './douqiWorld.js'
import { initializeWorld } from './douqi.js'
import { enemyAttributes } from './balance.js'

export const useMainStore = defineStore('main', {
  state: () => ({
    // boss属性
    boss: {
      name: '',
      text: '',
      time: 0,
      desc: '',
      level: 0,
      dodge: 0.03,
      attack: 0,
      health: 0,
      conquer: false,
      defense: 0,
      critical: 0,
      maxhealth: 0
    },
    // 玩家属性
    player: {
      zc: false,
      age: 1,
      pet: {},
      time: 0,
      name: '玩家',
      world: createWorldState(),
      dark: false,
      npcs: [],
      wife: {},
      pets: [],
      wifes: [],
      props: {
        money: 0,
        flying: 0,
        qingyuan: 0,
        rootBone: 0,
        currency: 0,
        cultivateDan: 0,
        strengtheningStone: 0
      },
      score: 0,
      level: 0,
      dodge: 0.03,
      points: 0,
      attack: 24,
      health: 240,
      critical: 0.05,
      defense: 12,
      taskNum: 0,
      version: 0.8,
      currency: 0,
      maxHealth: 240,
      inventory: [],
      isNewbie: false,
      shopData: [],
      equipment: {
        sutra: {},
        armor: {},
        weapon: {},
        accessory: {}
      },
      achievement: {
        pet: [],
        monster: [],
        equipment: []
      },
      script: '',
      cultivation: 0,
      currentTitle: null,
      reincarnation: 0,
      maxCultivation: 100,
      backpackCapacity: 50,
      sellingEquipmentData: [],
      highestTowerFloor: 1,
      rewardedTowerFloors: [],
      nextGameTimes: {
        rps: null,
        dice: null,
        fortune: null,
        secretrealm: 0,
        gamblingStone: null
      },
      gameWins: 0,
      gameLosses: 0,
      checkinDays: 0,
      checkinStreak: 0,
      lastCheckinDate: null,
      fortuneTellingDate: null,
      checkedInToday: false
    },
    // 怪物信息
    monster: {
      name: '',
      // 气血
      health: 0,
      // 攻击
      attack: 0,
      // 防御
      defense: 0,
      // 闪避率
      dodge: 0,
      // 暴击
      critical: 0
    },
    mapData: {
      y: 0,
      x: 0,
      map: []
    },
    mapScroll: 0,
    fishingMap: []
  }),
  persist: {
    key: 'vuex',
    paths: ['boss', 'player'],
    storage: localStorage,
    serializer: {
      serialize: state => {
        return JSON.stringify({
          boss: crypto.encryption(state.boss),
          player: crypto.encryption(state.player)
        })
      },
      deserialize: value => {
        const state = JSON.parse(value)
        const player = crypto.decryption(state.player)
        if (!player.world && !localStorage.getItem('vuex-before-douqi')) {
          localStorage.setItem('vuex-before-douqi', value)
        }
        if (player.world?.balanceVersion !== 2 && !localStorage.getItem('vuex-before-balance2')) {
          localStorage.setItem('vuex-before-balance2', value)
        }
        initializeWorld(player)
        const boss = crypto.decryption(state.boss)
        if (boss.name && boss.balanceVersion !== 2) {
          const healthRatio = Math.max(0, Math.min(1, boss.health / (boss.maxhealth || boss.health || 1)))
          Object.assign(boss, enemyAttributes(Math.min(102, boss.level), { health: 3.5, attack: 1.8, defense: 1.3 }), { balanceVersion: 2 })
          boss.health = Math.round(boss.maxhealth * healthRatio)
        }
        return {
          boss,
          player
        }
      }
    }
  }
})
