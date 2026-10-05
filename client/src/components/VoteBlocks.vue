<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(defineProps<{ filled: number; total: number; stagger?: boolean }>(), {
  stagger: false,
});

// One block per person while the crowd is small: "5 of 11" reads at a
// glance, where a smooth 45% bar would hide how few votes that is.
const MAX_BLOCKS = 20;
const blocks = computed(() =>
  props.total <= MAX_BLOCKS ? Array.from({ length: props.total }, (_, i) => i < props.filled) : null,
);
const pct = computed(() => (props.total ? (props.filled / props.total) * 100 : 0));
</script>

<template>
  <div
    v-if="blocks"
    class="flex gap-1.5 max-sm:gap-1"
    role="img"
    :aria-label="`${filled} of ${total} votes`"
  >
    <span
      v-for="(on, i) in blocks"
      :key="i"
      class="h-[15px] flex-1 rounded-[3px] transition-colors duration-300"
      :class="[on ? 'bg-mustard' : 'bg-tomato-dim', stagger && on && 'animate-rise']"
      :style="stagger && on ? { animationDelay: `${300 + i * 140}ms` } : undefined"
    />
  </div>
  <div v-else class="h-[15px] overflow-hidden rounded bg-tomato-dim" role="img" :aria-label="`${Math.round(pct)}%`">
    <span class="block h-full bg-mustard transition-[width] duration-500" :style="{ width: `${pct}%` }" />
  </div>
</template>
