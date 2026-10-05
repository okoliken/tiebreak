<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { useQuery } from "@pinia/colada";
import type { PollSummary } from "@/api";
import { plural, whenParts } from "@/lib/format";
import { templates } from "@/lib/templates";
import { useAuth } from "@/queries/auth";
import { pollListQuery } from "@/queries/polls";
import AppIcon from "@/components/AppIcon.vue";

const route = useRoute();
const { user } = useAuth();
const closed = computed(() => route.name === "closed");
const { data: polls, error } = useQuery(() => pollListQuery(closed.value ? "closed" : "open"));

function when(p: PollSummary) {
  const w = whenParts(p.closedAt ?? p.closesAt);
  return `${p.status === "open" ? "Closes" : "Closed"} ${w.day} at ${w.time}`;
}
</script>

<template>
  <main class="page pt-9 pb-20">
    <h1 class="mb-7 text-[clamp(30px,5vw,40px)] font-extrabold tracking-tight text-shadow-pop">
      {{ closed ? "Settled polls" : `Hey ${user?.name ?? "there"}` }}
    </h1>

    <p v-if="error && !polls" class="text-sm text-muted">Couldn’t load your polls. Refresh to try again.</p>
    <p v-else-if="!polls" class="text-sm text-muted">Loading…</p>

    <div v-else-if="polls.length === 0 && closed" class="card p-7 text-muted">
      Nothing settled yet. Polls land here once voting ends — with the winner and who backed it.
    </div>

    <!-- First run: get from nothing to a shared link in as few steps as possible. -->
    <div v-else-if="polls.length === 0" class="card p-7 max-sm:p-5">
      <h2 class="text-2xl font-extrabold">Got a decision dragging on in the group chat?</h2>
      <ol class="mt-4 flex flex-col gap-1.5 text-muted">
        <li><strong class="text-ink">1.</strong> Ask the question and add a few options</li>
        <li><strong class="text-ink">2.</strong> Share the link — nobody needs an account to vote</li>
        <li><strong class="text-ink">3.</strong> Watch it land live, then reveal the winner</li>
      </ol>
      <RouterLink :to="{ name: 'new' }" class="btn btn-tomato mt-6 min-h-12 px-6"><AppIcon name="plus" />Start a poll</RouterLink>
      <div class="mt-6 flex flex-wrap items-center gap-2 border-t-2 border-dashed border-line pt-5">
        <span class="text-sm text-muted">Or start from:</span>
        <RouterLink
          v-for="t in templates"
          :key="t.key"
          :to="{ name: 'new', query: { template: t.key } }"
          class="inline-flex items-center gap-1.5 rounded-full border-2 border-line bg-paper px-4 py-2 text-sm font-semibold no-underline hover:border-ink"
        >
          <span aria-hidden="true">{{ t.emoji }}</span>{{ t.name }}
        </RouterLink>
      </div>
    </div>

    <ul v-else class="m-0 flex list-none flex-col gap-3.5 p-0">
      <li v-for="p in polls" :key="p.id">
        <RouterLink
          :to="{ name: 'poll', params: { slug: p.slug } }"
          class="card flex items-center gap-4 px-6 py-5 no-underline transition hover:-translate-y-0.5 hover:shadow-pop max-sm:px-5"
        >
          <div class="min-w-0">
            <h2 class="mb-1 text-xl font-bold">{{ p.question }}</h2>
            <p class="text-sm text-muted">
              {{ when(p) }} · {{ plural(p.voterCount, "vote") }}
              <template v-if="p.leader"> · {{ p.status === "open" ? "leading" : "won" }}: <strong class="text-ink">{{ p.leader.label }}</strong></template>
            </p>
          </div>
          <span
            v-if="p.pendingSuggestionCount"
            class="ml-auto flex-none rounded-full border-2 border-ink bg-mustard px-3 py-1.5 text-xs font-bold"
          >
            {{ plural(p.pendingSuggestionCount, "suggestion") }}
          </span>
        </RouterLink>
      </li>
    </ul>
  </main>
</template>
