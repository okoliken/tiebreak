<script setup lang="ts">
import type { Voter } from "@/api/types";
import VoterAvatar from "./VoterAvatar.vue";

withDefaults(defineProps<{ voters: Voter[]; max?: number; size?: number }>(), { max: 4, size: 32 });
</script>

<template>
  <div class="flex items-center">
    <VoterAvatar
      v-for="(v, i) in voters.slice(0, max)"
      :key="v.id"
      :seed="v.avatarSeed"
      :name="v.name"
      :size="size"
      :class="{ '-ml-2': i > 0 }"
    />
    <span
      v-if="voters.length > max"
      class="-ml-2 grid place-items-center rounded-full border-2 border-ink bg-sand text-xs font-bold"
      :style="{ width: `${size}px`, height: `${size}px` }"
    >
      +{{ voters.length - max }}
    </span>
  </div>
</template>
