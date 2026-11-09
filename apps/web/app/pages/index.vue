<script setup lang="ts">
import { homepageSeo } from '#shared/site';

useSiteSeo({ ...homepageSeo, path: '/' });
</script>

<template>
  <!-- The persistent default layout supplies the homepage. -->
  <div />
</template>
