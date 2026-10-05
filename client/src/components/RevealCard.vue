<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { Poll, Voter } from "@/api/types";
import { percent, standing } from "@/lib/results";
import AvatarStack from "./AvatarStack.vue";
import VoteBlocks from "./VoteBlocks.vue";

// manage: show the creator's reopen buttons (only the manage page handles them).
const props = defineProps<{ poll: Poll; myPicks?: string[]; manage?: boolean }>();
defineEmits<{ reopen: [] }>();

const race = computed(() => standing(props.poll));
const winner = computed(() => {
  const r = race.value;
  return r.kind === "close" || r.kind === "clear" ? { ...r.leader, margin: r.margin } : null;
});

// Count the percentage up rather than printing it: the reveal is a moment.
const shown = ref(0);
onMounted(() => {
  const target = winner.value ? percent(winner.value.votes, props.poll.voterCount) : 0;
  const start = performance.now();
  const step = (t: number) => {
    const p = Math.min((t - start) / 1200, 1);
    shown.value = Math.round(target * (1 - (1 - p) ** 3));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
});

function names(voters: Voter[] | null) {
  const list = (voters ?? []).map((v) => v.name);
  if (list.length <= 1) return list[0] ?? "nobody";
  if (list.length <= 3) return `${list.slice(0, -1).join(", ")} and ${list.at(-1)}`;
  return `${list.slice(0, 3).join(", ")} and ${list.length - 3} more`;
}

const verdictForMe = computed(() => {
  const mine = props.myPicks;
  if (!mine?.length) return null;
  const r = race.value;
  if (r.kind === "tie") {
    return r.leaders.some((o) => mine.includes(o.id)) ? "Your pick made the tie. So close." : null;
  }
  if (!winner.value) return null;
  if (mine.includes(winner.value.id)) return "You called it.";
  const picked = props.poll.options.find((o) => mine.includes(o.id));
  return picked ? `You went with ${picked.label} — the crew went the other way.` : null;
});
</script>

<template>
  <!-- Nobody voted -->
  <section v-if="race.kind === 'empty'" class="card bg-sand px-[30px] py-8 text-center max-sm:px-5">
    <h2 class="text-[28px] font-extrabold">Nobody voted</h2>
    <p class="mt-2 text-muted">The poll closed to silence. Reopen it and nudge the group chat.</p>
    <button v-if="manage" class="btn btn-teal mt-5" @click="$emit('reopen')">Reopen voting</button>
  </section>

  <!-- Tie -->
  <section
    v-else-if="race.kind === 'tie'"
    class="animate-rise relative overflow-hidden rounded-card border-2 border-ink bg-mustard px-[30px] py-7 max-sm:px-5"
  >
    <p class="font-display text-[13px] font-extrabold tracking-[0.12em] uppercase">Dead heat</p>
    <h2 class="mt-1 text-[34px] font-extrabold tracking-tight max-sm:text-[28px]">Time for a tiebreak.</h2>
    <p class="mt-2 max-w-[460px] text-[15px]">
      {{ race.leaders.length }} options finished level on {{ race.leaders[0]!.votes }}
      {{ race.leaders[0]!.votes === 1 ? "vote" : "votes" }} each.
      <template v-if="manage">Reopen for a quick sudden-death round, or make the call yourself.</template>
      <template v-else>Over to {{ poll.owner.name }} to break it.</template>
    </p>

    <div class="mt-5 grid gap-3 sm:grid-cols-2">
      <div
        v-for="(o, i) in race.leaders"
        :key="o.id"
        class="animate-rise rounded-2xl border-2 border-ink bg-paper p-4"
        :style="{ animationDelay: `${250 + i * 200}ms` }"
      >
        <p class="text-lg font-bold">{{ o.label }}</p>
        <p class="mt-0.5 text-[13px] text-muted">{{ percent(o.votes, poll.voterCount) }}% · backed by {{ names(o.voters) }}</p>
        <AvatarStack class="mt-3" :voters="o.voters ?? []" :max="6" :size="28" />
      </div>
    </div>

    <p v-if="verdictForMe" class="mt-4 font-bold">{{ verdictForMe }}</p>
    <button v-if="manage" class="btn btn-dark mt-5" @click="$emit('reopen')">Run a sudden-death round</button>
  </section>

  <!-- Winner -->
  <section
    v-else-if="winner"
    class="animate-rise relative overflow-hidden rounded-card border-2 border-ink bg-tomato px-[30px] pt-7 pb-[26px] text-paper max-sm:px-5"
    :aria-label="`Winner: ${winner.label}`"
  >
    <div
      class="absolute top-[34px] -right-[62px] w-60 rotate-[34deg] border-y-2 border-ink bg-mustard py-[5px] text-center font-display text-[13px] font-extrabold tracking-[0.08em] text-ink uppercase max-sm:top-[22px] max-sm:-right-[78px] max-sm:text-[11px]"
      aria-hidden="true"
    >
      Winner
    </div>

    <p class="font-display text-[13px] font-extrabold tracking-[0.12em] text-mustard uppercase">The crew has spoken</p>
    <h2 class="mt-1.5 max-w-[calc(100%-110px)] text-[34px] font-extrabold tracking-tight max-sm:max-w-[calc(100%-60px)] max-sm:text-[26px]">
      {{ winner.label }}
    </h2>

    <div class="mt-4 flex items-end justify-between gap-3 max-sm:flex-col max-sm:items-start">
      <p class="font-display text-[64px] leading-[0.95] font-extrabold tracking-tighter tabular-nums max-sm:text-5xl">
        {{ shown }}<span class="ml-0.5 align-top text-[22px]">%</span>
      </p>
      <p class="rounded-xl bg-tomato-deep px-3.5 py-2 text-[13px]">
        <strong class="text-sm">{{ winner.votes }} of {{ poll.voterCount }} votes</strong>
         · won by {{ winner.margin }}
      </p>
    </div>

    <VoteBlocks class="mt-[18px]" :filled="winner.votes" :total="poll.voterCount" stagger />

    <div class="mt-5 flex items-center gap-3 rounded-2xl bg-tomato-deep p-3 pr-4">
      <AvatarStack :voters="winner.voters ?? []" :max="5" :size="34" />
      <p class="text-sm"><strong>Backed by {{ names(winner.voters) }}</strong></p>
    </div>

    <p v-if="verdictForMe" class="mt-4 font-display text-lg font-extrabold">{{ verdictForMe }}</p>
  </section>
</template>
