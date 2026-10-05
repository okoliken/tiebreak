<script setup lang="ts">
import type { Suggestion } from "@/api/types";
import VoterAvatar from "./VoterAvatar.vue";

defineProps<{ suggestion: Suggestion; busy: boolean; full: boolean }>();
defineEmits<{ approve: []; decline: [] }>();
</script>

<template>
  <!-- before: = the speech-bubble tail pointing up at the results it would join -->
  <article
    class="card relative grid grid-cols-[auto_1fr_auto] items-center gap-[18px] px-6 py-[22px] before:absolute before:-top-[9px] before:left-[37px] before:size-4 before:rotate-45 before:border-t-2 before:border-l-2 before:border-ink before:bg-paper max-sm:grid-cols-[auto_1fr] max-sm:p-[18px]"
  >
    <VoterAvatar :seed="suggestion.voter.avatarSeed" :name="suggestion.voter.name" :size="50" />
    <div>
      <h3 class="font-body text-base leading-snug font-bold">
        {{ suggestion.voter.name }} suggested: “{{ suggestion.label }}”
      </h3>
      <p class="mt-1 max-w-[360px] text-[13px] text-muted">
        <template v-if="full">The poll already has 10 options, so there’s no room to add it.</template>
        <template v-else>Approve it and it joins with 0 votes — your call, house rules</template>
      </p>
    </div>
    <div class="flex items-center gap-2 max-sm:col-span-full">
      <button class="btn btn-teal max-sm:flex-1" :disabled="busy || full" @click="$emit('approve')">Add it</button>
      <button class="btn btn-ghost" :disabled="busy" @click="$emit('decline')">Not this time</button>
    </div>
  </article>
</template>
