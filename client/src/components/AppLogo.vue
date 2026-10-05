<script setup lang="ts">
import { RouterLink } from "vue-router";

withDefaults(defineProps<{ size?: "md" | "sm" }>(), { size: "md" });
</script>

<template>
  <RouterLink
    to="/"
    class="inline-flex items-center gap-2.5 font-display font-extrabold tracking-tight no-underline"
    :class="size === 'md' ? 'text-[26px]' : 'text-xl'"
    aria-label="tiebreak home"
  >
    <svg :width="size === 'md' ? 26 : 22" :height="size === 'md' ? 26 : 22" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="13" class="fill-tomato stroke-ink" stroke-width="3" />
      <path d="M10 16.5l4 4 8-9" fill="none" class="stroke-paper" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span>tiebreak</span>
  </RouterLink>
</template>
