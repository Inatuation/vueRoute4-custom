<template>
  <RouterLink @click="clickPath('/a')">A组件</RouterLink>
  <RouterLink @click="clickPath('/b')">B组件</RouterLink>
  <RouterView></RouterView>
</template>

<script setup>
import { inject } from 'vue';

const router = inject('router location');
function clickPath(path) {
  router.push(path);
}
</script>
