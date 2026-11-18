<script setup lang="ts">
defineProps<{ items: readonly string[] }>();
</script>

<template>
  <aside class="legal-pending">
    <h3>Not yet published</h3>
    <ul>
      <li v-for="item in items" :key="item">{{ item }}</li>
    </ul>
  </aside>
</template>
