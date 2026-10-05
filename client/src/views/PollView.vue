<script setup lang="ts">
import { computed, ref, toRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ApiError } from "@/api";
import { useLivePoll, usePollActions } from "@/queries/polls";
import { splitResults } from "@/lib/results";
import { errorMessage } from "@/lib/errors";
import { plural, timeAgo } from "@/lib/format";
import AppIcon from "@/components/AppIcon.vue";
import AvatarStack from "@/components/AvatarStack.vue";
import PollPills from "@/components/PollPills.vue";
import LeaderCard from "@/components/LeaderCard.vue";
import RevealCard from "@/components/RevealCard.vue";
import ResultsList from "@/components/ResultsList.vue";
import SuggestionCard from "@/components/SuggestionCard.vue";
import ShareBar from "@/components/ShareBar.vue";

const props = defineProps<{ slug: string }>();
const route = useRoute();
const router = useRouter();
const slug = toRef(props, "slug");
const { data: poll, error, now } = useLivePoll(slug);
const actions = usePollActions(slug);

const busy = computed(() => Object.values(actions).some((m) => m.asyncStatus.value === "loading"));
const actionError = ref("");
const reopening = ref(false);
// Set by the create form: the first thing a new creator needs is the link.
const justCreated = ref(route.query.created === "1");

const open = computed(() => poll.value?.status === "open");
const split = computed(() => (poll.value ? splitResults(poll.value) : null));
const race = computed(() => split.value?.race ?? { kind: "empty" as const });
const hero = computed(() => split.value?.hero ?? null);
const rest = computed(() => split.value?.rest ?? []);

const verdict = computed(() => {
  const r = race.value;
  if (r.kind === "empty") return open.value ? "share the link to get it going" : "nobody voted";
  if (r.kind === "tie") return open.value ? "dead level at the top" : "it ended in a tie";
  if (!open.value) return `${r.leader.label} takes it`;
  return r.kind === "close" ? "still anyone’s game" : `${r.leader.label} is pulling away`;
});

const lastVote = computed(() => {
  void now.value; // re-render "2 min ago" as time passes
  return poll.value?.lastVoteAt ? timeAgo(poll.value.lastVoteAt) : null;
});

/** Runs a mutation, surfacing its error in the page instead of throwing. */
async function act<T>(mutation: { mutateAsync: (vars: T) => Promise<unknown> }, vars: T) {
  actionError.value = "";
  try {
    await mutation.mutateAsync(vars);
    return true;
  } catch (e) {
    actionError.value = errorMessage(e);
    return false;
  }
}

const REOPEN_FOR = [
  { label: "10 min", ms: 10 * 60_000 },
  { label: "1 hour", ms: 3_600_000 },
  { label: "3 hours", ms: 3 * 3_600_000 },
  { label: "24 hours", ms: 24 * 3_600_000 },
];

async function reopen(ms: number) {
  if (await act(actions.reopen, new Date(Date.now() + ms).toISOString())) reopening.value = false;
}

const notFound = computed(() => error.value instanceof ApiError && error.value.status === 404);

// Anyone who isn't the creator belongs on the public vote page.
watch(poll, (p) => {
  if (p && !p.isOwner) router.replace({ name: "vote", params: { slug: props.slug } });
});
</script>

<template>
  <main class="page flex flex-col gap-7 pt-9 pb-20 max-sm:gap-[22px] max-sm:pt-5">
    <p v-if="error && !poll" class="py-20 text-center text-muted">
      {{ notFound ? "This poll doesn’t exist — it may have been deleted." : errorMessage(error) }}
    </p>
    <p v-else-if="!poll" class="py-20 text-center text-muted">Loading…</p>

    <template v-else-if="poll.isOwner">
      <div
        v-if="justCreated"
        class="animate-rise flex items-start justify-between gap-4 rounded-2xl border-2 border-ink bg-mustard px-5 py-4"
        role="status"
      >
        <p>
          <strong class="font-display text-lg">Your poll is live.</strong><br />
          Copy the link below and drop it in the group chat. Results show up here as votes land.
        </p>
        <button class="btn btn-ghost min-h-0 px-2 text-ink" aria-label="Dismiss" @click="justCreated = false">
          <AppIcon name="x" />
        </button>
      </div>

      <PollPills class="-mb-1.5" :poll="poll" />

      <h1 class="max-w-[600px] text-[clamp(34px,6vw,50px)] font-extrabold tracking-tight [overflow-wrap:anywhere] text-shadow-pop">
        {{ poll.question }}
      </h1>

      <div class="-mt-2.5 flex items-center gap-3 text-sm text-muted">
        <AvatarStack v-if="poll.recentVoters.length" :voters="poll.recentVoters.slice(0, 4)" />
        <p v-if="poll.voterCount">
          <strong class="text-ink">{{ poll.voterCount }} of your crew</strong> voted · last one {{ lastVote }}
        </p>
        <p v-else>No votes yet — the first one sets the pace.</p>
      </div>

      <LeaderCard
        v-if="hero"
        :option="hero.option"
        :voter-count="poll.voterCount"
        :margin="hero.margin"
      />
      <RevealCard v-else-if="!open" :key="poll.closedAt ?? ''" :poll="poll" manage @reopen="reopening = true" />

      <ResultsList
        v-if="rest.length"
        :options="rest"
        :voter-count="poll.voterCount"
        :leader-votes="poll.options[0]?.votes ?? 0"
      />

      <div class="-mt-1.5 flex flex-wrap items-center justify-between gap-x-5 gap-y-2.5 px-2">
        <p class="text-base">
          <strong>{{ plural(poll.voterCount, "vote") }} in —</strong>
          <span class="ml-1 font-bold text-tomato-deep">{{ verdict }}</span>
        </p>
        <p v-if="open" class="flex items-center gap-2 text-sm text-muted">
          <i
            class="relative size-[18px] rounded-full border-2 border-teal-soft bg-[radial-gradient(circle,var(--color-teal)_0_4px,var(--color-paper)_5px)] after:absolute after:-inset-0.5 after:animate-live after:rounded-full after:border-2 after:border-teal"
            aria-hidden="true"
          />
          Live — updates as votes land
        </p>
      </div>

      <TransitionGroup
        tag="div"
        class="flex flex-col gap-[22px] empty:hidden"
        enter-from-class="opacity-0 translate-y-2"
        leave-to-class="opacity-0 translate-y-2 scale-[0.98]"
        enter-active-class="transition duration-250"
        leave-active-class="transition duration-250"
      >
        <SuggestionCard
          v-for="s in poll.pendingSuggestions"
          :key="s.id"
          :suggestion="s"
          :busy="busy"
          :full="poll.options.length >= 10"
          @approve="act(actions.approve, s.id)"
          @decline="act(actions.decline, s.id)"
        />
      </TransitionGroup>

      <p v-if="actionError" class="rounded-xl bg-blush px-4 py-3 font-semibold text-tomato-deep" role="alert">
        {{ actionError }}
      </p>

      <ShareBar
        :slug="slug"
        :open="open"
        :busy="busy"
        :highlight="justCreated"
        @end="act(actions.close, undefined)"
        @reopen="reopening = !reopening"
      />

      <div v-if="reopening && !open" class="-mt-3.5 flex flex-wrap items-center gap-2.5 pl-6 text-sm font-semibold">
        <span>Reopen voting for</span>
        <button v-for="r in REOPEN_FOR" :key="r.label" class="btn btn-outline" :disabled="busy" @click="reopen(r.ms)">
          {{ r.label }}
        </button>
      </div>
    </template>
  </main>
</template>
