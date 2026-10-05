<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import { usingMock } from "@/api";

const route = useRoute();
// Voters and signed-out visitors get a bare page: no creator nav.
const creatorPage = computed(() => route.meta.creator === true);
</script>

<template>
  <AppHeader v-if="creatorPage" />
  <RouterView />
  <p
    v-if="usingMock"
    class="pointer-events-none fixed right-3 bottom-3 rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-paper opacity-60"
  >
    Mock data
  </p>
</template>
