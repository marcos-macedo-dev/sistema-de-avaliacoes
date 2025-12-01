<script setup>
import { useDark } from '@vueuse/core'

const isDark = useDark()
</script>

<template>
  <div :class="{ dark: isDark }">
    <router-view />
  </div>
</template>

<style scoped></style>
