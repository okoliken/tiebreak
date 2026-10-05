<script setup lang="ts">
import { avatarUrl } from "@/lib/avatar";

withDefaults(defineProps<{ seed: string; name: string; size?: number; ring?: boolean }>(), {
  size: 32,
  ring: true,
});
</script>

<template>
  <img
    class="block flex-none rounded-full bg-sand"
    :class="{ 'border-2 border-ink': ring }"
    :src="avatarUrl(seed)"
    :alt="name"
    :title="name"
    :width="size"
    :height="size"
  />
</template>
