<script setup lang="ts">
import { computed } from "vue";
import type { Option } from "@/api/types";
import { percent } from "@/lib/results";
import VoterAvatar from "./VoterAvatar.vue";
import VoteBlocks from "./VoteBlocks.vue";

const props = defineProps<{
  option: Option;
  voterCount: number;
  /** Lead over second place. */
  margin: number;
  mine?: boolean;
}>();

const pct = computed(() => percent(props.option.votes, props.voterCount));
const unit = computed(() => (props.voterCount === 1 ? "vote" : "votes"));
</script>

<template>
  <section
    class="relative overflow-hidden rounded-card border-2 border-ink bg-tomato px-[30px] py-[26px] text-paper max-sm:px-5 max-sm:py-[22px]"
    :aria-label="`In the lead: ${option.label}`"
  >
    <div
      class="absolute top-[34px] -right-[62px] w-60 rotate-[34deg] border-y-2 border-ink bg-mustard py-[5px] text-center font-display text-[13px] font-extrabold tracking-[0.08em] text-ink uppercase max-sm:top-[22px] max-sm:-right-[78px] max-sm:text-[11px]"
      aria-hidden="true"
    >
      In the lead
    </div>

    <h2 class="max-w-[calc(100%-120px)] text-[28px] font-extrabold tracking-tight max-sm:max-w-[calc(100%-70px)] max-sm:text-[23px]">
      {{ option.label }}
    </h2>
    <p
      v-if="mine"
      class="mt-3 mr-2 inline-flex items-center rounded-full bg-mustard px-3 py-1 text-[11px] font-extrabold tracking-wide text-ink uppercase"
    >
      Your pick
    </p>
    <p
      v-if="option.suggestedBy"
      class="mt-3 inline-flex items-center gap-2.5 rounded-full bg-tomato-deep py-1 pr-3.5 pl-1 text-[13px] font-bold"
    >
      <VoterAvatar :seed="option.suggestedBy.avatarSeed" :name="option.suggestedBy.name" :size="24" :ring="false" />
      Suggested by {{ option.suggestedBy.name }}
    </p>

    <div class="mt-[18px] flex items-end justify-between gap-3 max-sm:flex-col max-sm:items-start">
      <p class="font-display text-[58px] leading-[0.95] font-extrabold tracking-tighter max-sm:text-5xl">
        {{ pct }}<span class="ml-0.5 align-top text-[22px]">%</span>
      </p>
      <p class="rounded-xl bg-tomato-deep px-3.5 py-2 text-[13px]">
        <strong class="text-sm">{{ option.votes }} of {{ voterCount }} {{ unit }}</strong>
 · ahead by {{ margin }}
      </p>
    </div>

    <VoteBlocks class="mt-[18px]" :filled="option.votes" :total="voterCount" />
  </section>
</template>
