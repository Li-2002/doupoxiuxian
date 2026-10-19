<template>
  <div v-if="attack" class="combat-breakdown" role="status">
    <div><strong>{{ attack.skill }}</strong><span>{{ attack.isHit ? `基础 ${attack.baseDamage}${attack.isCritical ? ' · 暴击' : ''}` : '本次攻击被闪避' }}</span><b>合计 {{ attack.damage }}</b></div>
    <div v-if="attack.flames.length" class="flame-hits"><span v-for="fire in attack.flames" :key="fire.id">{{ fire.name }} <b>+{{ fire.damage }}</b></span></div>
  </div>
</template>
<script setup>
  defineProps({ attack: Object })
</script>
