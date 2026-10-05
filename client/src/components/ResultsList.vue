<script setup lang="ts">
import type { Option } from "@/api/types";
import { percent } from "@/lib/results";
import VoterAvatar from "./VoterAvatar.vue";
import AvatarStack from "./AvatarStack.vue";

const props = defineProps<{
  options: Option[];
  voterCount: number;
  leaderVotes: number;
  /** The viewer's own picks, highlighted. */
  mine?: string[];
}>();

// Bars are drawn against the leader, not against 100%: the hero card already
// shows the leader's share, so here the bars answer "how far behind?".
const width = (votes: number) => (props.leaderVotes ? (votes / props.leaderVotes) * 100 : 0);
</script>

<template>
  <ol class="card m-0 list-none p-0">
    <li
      v-for="o in options"
      :key="o.id"
      class="grid min-h-[72px] grid-cols-[1fr_200px_92px] items-center gap-[18px] px-7 py-[18px] border-t-2 border-dashed border-line first:border-t-0 max-sm:grid-cols-[1fr_auto] max-sm:gap-x-3.5 max-sm:gap-y-2.5 max-sm:px-[18px] max-sm:py-4"
    >
      <div class="max-sm:col-span-full">
        <p class="flex items-center gap-2 text-base font-bold tracking-[0.01em]">
          {{ o.label }}
          <span
            v-if="mine?.includes(o.id)"
            class="rounded-full bg-mustard px-2 py-0.5 text-[11px] font-extrabold tracking-wide uppercase"
          >
            Your pick
          </span>
        </p>
        <p v-if="o.suggestedBy" class="mt-1 flex items-center gap-2 text-[13px] text-muted">
          <VoterAvatar :seed="o.suggestedBy.avatarSeed" :name="o.suggestedBy.name" :size="20" />
          Suggested by {{ o.suggestedBy.name }}
        </p>
        <AvatarStack v-if="o.voters?.length" class="mt-2" :voters="o.voters" :max="6" :size="24" />
      </div>
      <div class="h-3 overflow-hidden rounded-full bg-track" aria-hidden="true">
        <span class="block h-full rounded-full bg-teal transition-[width] duration-500" :style="{ width: `${width(o.votes)}%` }" />
      </div>
      <p class="flex items-baseline justify-end gap-2 whitespace-nowrap">
        <strong class="font-display text-xl font-extrabold">{{ percent(o.votes, voterCount) }}%</strong>
        <span class="text-[13px] text-muted">{{ o.votes }} {{ o.votes === 1 ? "vote" : "votes" }}</span>
      </p>
    </li>
  </ol>
</template>
