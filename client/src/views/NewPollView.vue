<script setup lang="ts">
import { computed, nextTick, reactive, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useCreatePoll } from "@/queries/polls";
import { errorMessage } from "@/lib/errors";
import { templates } from "@/lib/templates";
import { whenParts } from "@/lib/format";
import AppIcon from "@/components/AppIcon.vue";

const route = useRoute();
const router = useRouter();

const MAX_OPTIONS = 10;
const form = reactive({
  question: "",
  options: ["", ""],
  multiChoice: false,
});

function useTemplate(key: string) {
  const t = templates.find((x) => x.key === key);
  if (!t) return;
  form.question = t.question;
  form.options = [...t.options];
  form.multiChoice = t.multiChoice;
}
if (typeof route.query.template === "string") useTemplate(route.query.template);

// ── Options ──────────────────────────────────────────────────────────────────
const optionInputs = ref<HTMLInputElement[]>([]);

async function addOption(focus = true) {
  if (form.options.length >= MAX_OPTIONS) return;
  form.options.push("");
  if (focus) {
    await nextTick();
    optionInputs.value.at(-1)?.focus();
  }
}

function removeOption(i: number) {
  if (form.options.length > 2) form.options.splice(i, 1);
}

// Enter on the last filled option adds the next one: type, Enter, type, Enter.
function onOptionEnter(i: number) {
  if (i === form.options.length - 1 && form.options[i]!.trim()) addOption();
  else optionInputs.value[i + 1]?.focus();
}

const duplicates = computed(() => {
  const seen = new Map<string, number>();
  const dupes = new Set<number>();
  form.options.forEach((o, i) => {
    const key = o.trim().toLowerCase();
    if (!key) return;
    if (seen.has(key)) dupes.add(i);
    else seen.set(key, i);
  });
  return dupes;
});

// ── Closing time ─────────────────────────────────────────────────────────────
function at(daysAhead: number, hour: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, 0, 0, 0);
  return d;
}

const presets = computed(() => {
  const now = Date.now();
  const list = [
    { key: "1h", label: "In 1 hour", date: new Date(now + 3_600_000) },
    { key: "tonight", label: "Tonight, 9 PM", date: at(0, 21) },
    { key: "tomorrow", label: "Tomorrow noon", date: at(1, 12) },
    { key: "3d", label: "In 3 days", date: at(3, 18) },
  ];
  // "Tonight" makes no sense at 8:45 PM.
  return list.filter((p) => p.date.getTime() > now + 30 * 60_000);
});

const closing = ref<string>("tonight");
const custom = ref("");

const closesAt = computed<Date | null>(() => {
  if (closing.value === "custom") return custom.value ? new Date(custom.value) : null;
  return presets.value.find((p) => p.key === closing.value)?.date ?? presets.value[0]!.date;
});
const closesLabel = computed(() => {
  if (!closesAt.value) return null;
  const w = whenParts(closesAt.value.toISOString());
  return `${w.day} at ${w.time}`;
});

// <input type="datetime-local"> wants local time without a zone: 2026-10-01T19:00
const minCustom = computed(() => {
  const d = new Date(Date.now() + 10 * 60_000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
});

// ── Submit ───────────────────────────────────────────────────────────────────
const create = useCreatePoll();
const sending = computed(() => create.asyncStatus.value === "loading");
const error = ref("");

const filled = computed(() => form.options.map((o) => o.trim()).filter(Boolean));

function problem(): string | null {
  if (!form.question.trim()) return "Ask the crew a question first.";
  if (filled.value.length < 2) return "Add at least two options — it’s not much of a vote otherwise.";
  if (duplicates.value.size) return "Two options have the same name.";
  if (!closesAt.value) return "Pick when voting closes.";
  if (closesAt.value.getTime() <= Date.now()) return "That closing time has already passed.";
  return null;
}

async function submit() {
  error.value = problem() ?? "";
  if (error.value) return;
  try {
    const poll = await create.mutateAsync({
      question: form.question.trim(),
      options: filled.value,
      closesAt: closesAt.value!.toISOString(),
      multiChoice: form.multiChoice,
    });
    router.push({ name: "poll", params: { slug: poll.slug }, query: { created: "1" } });
  } catch (e) {
    error.value = errorMessage(e, "Couldn’t create the poll — try again.");
  }
}

const chip = "inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-semibold transition";
const chipOn = "border-ink bg-ink text-paper";
const chipOff = "border-line bg-paper text-ink hover:border-ink";
</script>

<template>
  <main class="page pt-6 pb-20">
    <RouterLink :to="{ name: 'dashboard' }" class="inline-flex items-center gap-1 text-sm font-semibold text-muted no-underline hover:text-ink">
      <AppIcon name="back" />My polls
    </RouterLink>
    <h1 class="mt-3 text-[clamp(32px,6vw,44px)] font-extrabold tracking-tight text-shadow-pop">New poll</h1>

    <div class="mt-5 flex flex-wrap items-center gap-2">
      <span class="text-sm text-muted">Start from:</span>
      <button v-for="t in templates" :key="t.key" type="button" :class="[chip, chipOff]" @click="useTemplate(t.key)">
        <span aria-hidden="true">{{ t.emoji }}</span>{{ t.name }}
      </button>
    </div>

    <form class="mt-7 flex flex-col gap-7" novalidate @submit.prevent="submit">
      <div>
        <div class="flex items-baseline justify-between">
          <label for="question" class="label">What are we deciding?</label>
          <span class="text-xs text-muted tabular-nums">{{ form.question.length }}/120</span>
        </div>
        <input
          id="question"
          v-model="form.question"
          class="field font-display text-xl font-bold"
          placeholder="Pizza night: what are we ordering?"
          maxlength="120"
          autofocus
        />
      </div>

      <fieldset>
        <legend class="label">Options <span class="font-normal text-muted">· 2 to {{ MAX_OPTIONS }}</span></legend>
        <ol class="flex flex-col gap-2.5">
          <li v-for="(_, i) in form.options" :key="i" class="flex items-center gap-2.5">
            <span class="grid size-9 flex-none place-items-center rounded-full bg-sand text-sm font-bold" aria-hidden="true">
              {{ String.fromCharCode(65 + i) }}
            </span>
            <input
              :ref="(el) => { if (el) optionInputs[i] = el as HTMLInputElement }"
              v-model="form.options[i]"
              class="field"
              :class="{ 'border-tomato': duplicates.has(i) }"
              :placeholder="i === 0 ? 'Pepperoni from Slice House' : i === 1 ? 'Margherita from Lupa' : 'Another option'"
              :aria-label="`Option ${i + 1}`"
              :aria-invalid="duplicates.has(i)"
              maxlength="80"
              @keydown.enter.prevent="onOptionEnter(i)"
            />
            <button
              type="button"
              class="grid size-11 flex-none place-items-center rounded-full text-muted transition hover:bg-sand hover:text-ink disabled:invisible"
              :disabled="form.options.length <= 2"
              :aria-label="`Remove option ${i + 1}`"
              @click="removeOption(i)"
            >
              <AppIcon name="x" />
            </button>
          </li>
        </ol>
        <button
          v-if="form.options.length < MAX_OPTIONS"
          type="button"
          class="btn btn-ghost mt-2 ml-9 px-3 text-ink"
          @click="addOption()"
        >
          <AppIcon name="plus" />Add option
        </button>
        <p v-else class="mt-3 ml-12 text-sm text-muted">That’s the max of {{ MAX_OPTIONS }}. Voters can still suggest more for you to approve.</p>
      </fieldset>

      <fieldset>
        <legend class="label">How do people vote?</legend>
        <div class="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
          <label
            v-for="mode in [
              { multi: false, title: 'One pick each', body: 'Best when you need a single answer.' },
              { multi: true, title: 'Pick any they like', body: 'Best for “what would you be happy with?”' },
            ]"
            :key="mode.title"
            class="cursor-pointer rounded-2xl border-2 px-5 py-4 transition has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-teal"
            :class="form.multiChoice === mode.multi ? 'border-ink bg-teal-soft shadow-pop' : 'border-line bg-paper hover:border-ink'"
          >
            <input v-model="form.multiChoice" type="radio" name="mode" :value="mode.multi" class="sr-only" />
            <span class="block font-bold">{{ mode.title }}</span>
            <span class="text-[13px] text-muted">{{ mode.body }}</span>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend class="label">When does voting close?</legend>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="p in presets"
            :key="p.key"
            type="button"
            :class="[chip, closing === p.key ? chipOn : chipOff]"
            :aria-pressed="closing === p.key"
            @click="closing = p.key"
          >
            {{ p.label }}
          </button>
          <button
            type="button"
            :class="[chip, closing === 'custom' ? chipOn : chipOff]"
            :aria-pressed="closing === 'custom'"
            @click="closing = 'custom'"
          >
            Pick a time
          </button>
        </div>
        <input
          v-if="closing === 'custom'"
          v-model="custom"
          type="datetime-local"
          class="field mt-3 max-w-xs"
          :min="minCustom"
          aria-label="Closing date and time"
        />
        <p v-if="closesLabel" class="mt-2.5 text-sm text-muted">
          Closes <strong class="text-ink">{{ closesLabel }}</strong>. You can end it early or reopen it later.
        </p>
      </fieldset>

      <p v-if="error" class="rounded-xl bg-blush px-4 py-3 font-semibold text-tomato-deep" role="alert">{{ error }}</p>

      <div class="flex flex-wrap items-center gap-4">
        <button class="btn btn-tomato min-h-14 px-8 text-base max-sm:w-full" :disabled="sending">
          {{ sending ? "Creating…" : "Create poll & get the link" }}
        </button>
      </div>
    </form>
  </main>
</template>
