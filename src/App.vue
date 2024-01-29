<template>
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/about">About</RouterLink>
    <RouterView />
</template>

<script setup>
  import { inject } from 'vue';

  const router = inject('router location');
  function clickPath(path) {
    router.push(path);
  }
</script>
