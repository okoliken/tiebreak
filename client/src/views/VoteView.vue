<script setup lang="ts">
import { computed, reactive, ref, toRef, watch } from "vue";
import { RouterLink } from "vue-router";
import { ApiError } from "@/api";
import { useLivePoll, usePollActions } from "@/queries/polls";
import { session } from "@/lib/session";
import { errorMessage } from "@/lib/errors";
import { randomSeed } from "@/lib/avatar";
import { splitResults } from "@/lib/results";
import { plural } from "@/lib/format";
import AppIcon from "@/components/AppIcon.vue";
import AppLogo from "@/components/AppLogo.vue";
import AvatarPicker from "@/components/AvatarPicker.vue";
import AvatarStack from "@/components/AvatarStack.vue";
import LeaderCard from "@/components/LeaderCard.vue";
import PollPills from "@/components/PollPills.vue";
import ResultsList from "@/components/ResultsList.vue";
import RevealCard from "@/components/RevealCard.vue";
import VoterAvatar from "@/components/VoterAvatar.vue";

const props = defineProps<{ slug: string }>();
const slug = toRef(props, "slug");
const { data: poll, error } = useLivePoll(slug);
const { vote, suggest: suggestOption } = usePollActions(slug);
const notFound = computed(() => error.value instanceof ApiError && error.value.status === 404);

const open = computed(() => poll.value?.status === "open");
const voted = computed(() => !!poll.value?.myVote);
const editing = ref(false);
const showBallot = computed(() => open.value && (!voted.value || editing.value));

// ── Ballot ───────────────────────────────────────────────────────────────────
const profile = session.voterProfile;
const form = reactive({
  picks: [] as string[],
  name: profile?.name ?? "",
  avatarSeed: profile?.avatarSeed ?? randomSeed(),
});
const sending = computed(() => vote.asyncStatus.value === "loading");
const formError = ref("");

// Changing a vote starts from what you picked last time.
watch(editing, (on) => {
  if (on && poll.value?.myVote) form.picks = [...poll.value.myVote.optionIds];
});

function toggle(id: string) {
  if (!poll.value?.multiChoice) form.picks = [id];
  else form.picks = form.picks.includes(id) ? form.picks.filter((p) => p !== id) : [...form.picks, id];
}

// The API sorts options by votes; the ballot re-sorts them alphabetically so
// it doesn't nudge people toward whatever is already winning.
const ballotOptions = computed(() => poll.value?.options.slice().sort((a, b) => a.label.localeCompare(b.label)) ?? []);

async function submit() {
  formError.value = "";
  if (!form.picks.length) return (formError.value = "Pick an option first.");
  if (!form.name.trim()) return (formError.value = "Add your name so the crew knows who voted.");
  try {
    await vote.mutateAsync({ name: form.name.trim(), avatarSeed: form.avatarSeed, optionIds: form.picks });
    session.voterProfile = { name: form.name.trim(), avatarSeed: form.avatarSeed };
    editing.value = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (e) {
    formError.value = errorMessage(e, "Couldn’t send your vote — try again.");
  }
}

// ── After voting ─────────────────────────────────────────────────────────────
const me = computed(() => session.voterProfile);
const myLabels = computed(() =>
  (poll.value?.options ?? []).filter((o) => poll.value?.myVote?.optionIds.includes(o.id)).map((o) => o.label),
);

const split = computed(() => (poll.value ? splitResults(poll.value) : null));
const hero = computed(() => split.value?.hero ?? null);
const rest = computed(() => split.value?.rest ?? []);

const idea = ref("");
const suggesting = computed(() => suggestOption.asyncStatus.value === "loading");
const suggestMsg = ref<{ ok: boolean; text: string } | null>(null);

async function suggest() {
  if (!idea.value.trim()) return;
  suggestMsg.value = null;
  try {
    await suggestOption.mutateAsync(idea.value);
    suggestMsg.value = {
      ok: true,
      text: `Sent to ${poll.value?.owner.name}. If they add it, it joins the poll and you can switch your vote to it.`,
    };
    idea.value = "";
  } catch (e) {
    suggestMsg.value = { ok: false, text: errorMessage(e, "Couldn’t send that — try again.") };
  }
}
</script>

<template>
  <header class="page flex items-center justify-between gap-4 py-4">
    <AppLogo size="sm" />
    <RouterLink v-if="poll?.isOwner" :to="{ name: 'poll', params: { slug } }" class="btn btn-outline min-h-9 px-4 text-[13px]">
      Manage this poll
    </RouterLink>
  </header>

  <main class="page flex flex-col gap-6 pt-4 pb-20">
    <div v-if="error && !poll" class="card px-6 py-10 text-center">
      <h1 class="text-3xl font-extrabold">{{ notFound ? "Can’t find that poll" : "Something went wrong" }}</h1>
      <p class="mt-2 text-muted">
        {{ notFound ? "It may have been deleted. Check the link with whoever sent it." : errorMessage(error) }}
      </p>
    </div>
    <p v-else-if="!poll" class="py-20 text-center text-muted">Loading…</p>

    <template v-else>
      <PollPills :poll="poll" />
      <h1 class="text-[clamp(32px,6vw,48px)] font-extrabold tracking-tight [overflow-wrap:anywhere] text-shadow-pop">
        {{ poll.question }}
      </h1>
      <div class="-mt-2 flex items-center gap-3 text-sm text-muted">
        <VoterAvatar :seed="poll.owner.avatarSeed" :name="poll.owner.name" :size="32" />
        <p>
          <strong class="text-ink">{{ poll.owner.name }}</strong> asked the crew
          <template v-if="poll.voterCount"> · {{ plural(poll.voterCount, "vote") }} so far</template>
        </p>
      </div>

      <!-- ── Ballot ── -->
      <form v-if="showBallot" class="flex flex-col gap-6" novalidate @submit.prevent="submit">
        <fieldset>
          <legend class="label">{{ poll.multiChoice ? "Tick every one you’d be happy with" : "Pick one" }}</legend>
          <div class="flex flex-col gap-2.5">
            <label
              v-for="o in ballotOptions"
              :key="o.id"
              class="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-ink px-5 py-4 transition has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal"
              :class="form.picks.includes(o.id) ? 'bg-teal-soft shadow-pop' : 'bg-paper hover:bg-white'"
            >
              <input
                :type="poll.multiChoice ? 'checkbox' : 'radio'"
                name="pick"
                class="sr-only"
                :checked="form.picks.includes(o.id)"
                @change="toggle(o.id)"
              />
              <span
                class="grid size-7 flex-none place-items-center border-2 border-ink transition"
                :class="[poll.multiChoice ? 'rounded-lg' : 'rounded-full', form.picks.includes(o.id) ? 'bg-teal text-paper' : 'bg-paper text-transparent']"
                aria-hidden="true"
              >
                <AppIcon name="check" :size="16" />
              </span>
              <span class="min-w-0">
                <span class="block text-base font-bold">{{ o.label }}</span>
                <span v-if="o.suggestedBy" class="text-[13px] text-muted">Suggested by {{ o.suggestedBy.name }}</span>
              </span>
            </label>
          </div>
        </fieldset>

        <div class="card flex flex-col gap-5 p-6 max-sm:p-5">
          <div>
            <label for="voter-name" class="label">Who’s voting?</label>
            <input
              id="voter-name"
              v-model="form.name"
              class="field"
              placeholder="Your first name"
              maxlength="30"
              autocomplete="given-name"
            />
          </div>
          <AvatarPicker v-model="form.avatarSeed" />
          <p class="text-[13px] text-muted">No account needed. The crew sees your name and face next to your vote once the poll closes.</p>
        </div>

        <p v-if="formError" class="rounded-xl bg-blush px-4 py-3 font-semibold text-tomato-deep" role="alert">{{ formError }}</p>

        <div class="flex flex-wrap items-center gap-3">
          <button class="btn btn-tomato min-h-14 px-8 text-base max-sm:w-full" :disabled="sending">
            {{ sending ? "Sending…" : editing ? "Update my vote" : "Cast my vote" }}
          </button>
          <button v-if="editing" type="button" class="btn btn-ghost" @click="editing = false">Keep my old vote</button>
          <p v-else-if="poll.voterCount" class="text-sm text-muted">Results unlock once you’ve voted.</p>
        </div>
      </form>

      <!-- ── Voted, poll still open ── -->
      <template v-else-if="open">
        <div class="card animate-rise flex items-center gap-4 bg-teal-soft p-5 max-sm:flex-wrap">
          <VoterAvatar v-if="me" :seed="me.avatarSeed" :name="me.name" :size="52" />
          <div class="min-w-0 flex-1">
            <p class="font-display text-xl font-extrabold">You’re in{{ me ? `, ${me.name}` : "" }}!</p>
            <p class="text-sm">You picked <strong>{{ myLabels.join(", ") }}</strong>. Change it any time before voting closes.</p>
          </div>
          <button class="btn btn-outline max-sm:w-full" @click="editing = true">Change my vote</button>
        </div>

        <LeaderCard
          v-if="hero"
          :option="hero.option"
          :voter-count="poll.voterCount"
          :margin="hero.margin"
          :mine="poll.myVote?.optionIds.includes(hero.option.id)"
        />
        <ResultsList
          v-if="rest.length"
          :options="rest"
          :voter-count="poll.voterCount"
          :leader-votes="poll.options[0]?.votes ?? 0"
          :mine="poll.myVote?.optionIds"
        />
        <div class="-mt-1.5 flex items-center justify-between gap-3 px-2 text-sm text-muted">
          <AvatarStack :voters="poll.recentVoters" :max="5" :size="28" />
          <p>Live — updates as votes land</p>
        </div>

        <form class="card flex flex-col gap-3 p-6 max-sm:p-5" @submit.prevent="suggest">
          <label for="idea" class="flex items-center gap-2 font-display text-lg font-extrabold">
            <AppIcon name="bulb" :size="20" />Got a better idea?
          </label>
          <p class="-mt-2 text-[13px] text-muted">Suggest an option. {{ poll.owner.name }} decides if it makes the cut.</p>
          <div class="flex gap-2.5 max-sm:flex-col">
            <input id="idea" v-model="idea" class="field" placeholder="e.g. Thai from Baan" maxlength="80" />
            <button class="btn btn-dark min-h-[52px]" :disabled="suggesting || !idea.trim()">Suggest it</button>
          </div>
          <p v-if="suggestMsg" class="text-sm font-semibold" :class="suggestMsg.ok ? 'text-teal' : 'text-tomato-deep'" role="status">
            {{ suggestMsg.text }}
          </p>
        </form>
      </template>

      <!-- ── Closed: the reveal ── -->
      <template v-else>
        <RevealCard :poll="poll" :my-picks="poll.myVote?.optionIds" />
        <ResultsList
          v-if="rest.length"
          :options="rest"
          :voter-count="poll.voterCount"
          :leader-votes="poll.options[0]?.votes ?? 0"
          :mine="poll.myVote?.optionIds"
        />
        <div v-if="!poll.isOwner" class="card flex items-center justify-between gap-4 bg-sand p-5 max-sm:flex-col max-sm:items-start">
          <p><strong>Got your own decision to settle?</strong><br /><span class="text-sm text-muted">Make a poll in under a minute.</span></p>
          <RouterLink :to="{ name: 'welcome' }" class="btn btn-teal">Start a poll</RouterLink>
        </div>
      </template>
    </template>
  </main>
</template>
