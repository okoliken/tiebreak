<script setup lang="ts">
import { computed, ref } from "vue";
import AppIcon from "./AppIcon.vue";

const props = defineProps<{ slug: string; open: boolean; busy: boolean; highlight?: boolean }>();
defineEmits<{ end: []; reopen: [] }>();

const url = computed(() => `${location.origin}/p/${props.slug}`);
const shown = computed(() => `${location.host}/p/${props.slug}`);
const copied = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

async function copy() {
  try {
    await navigator.clipboard.writeText(url.value);
  } catch {
    // Clipboard blocked (http or old browser): fall back to the share sheet.
    if (navigator.share) await navigator.share({ url: url.value }).catch(() => {});
    return;
  }
  copied.value = true;
  clearTimeout(timer);
  timer = setTimeout(() => (copied.value = false), 1800);
}
</script>

<template>
  <div>
    <div
      class="flex items-center gap-4 rounded-[32px] bg-sand py-2.5 pr-3 pl-6 transition-shadow max-sm:flex-col max-sm:items-stretch max-sm:rounded-card max-sm:p-[18px]"
      :class="{ 'ring-4 ring-mustard': highlight }"
    >
      <p class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2.5 gap-y-1 text-[13px] text-muted">
        <span>Anyone with the link can vote:</span>
        <a
          :href="url"
          target="_blank"
          rel="noopener"
          class="text-base font-bold [overflow-wrap:anywhere] text-ink no-underline hover:underline"
        >
          {{ shown }}
        </a>
      </p>
      <div class="ml-auto flex gap-2.5 max-sm:ml-0 max-sm:[&>*]:flex-1">
        <button v-if="open" class="btn btn-outline" :disabled="busy" @click="$emit('end')">End voting</button>
        <button v-else class="btn btn-outline" :disabled="busy" @click="$emit('reopen')">Reopen voting</button>
        <button class="btn btn-dark" @click="copy">
          <AppIcon :name="copied ? 'check' : 'copy'" />
          {{ copied ? "Copied!" : "Copy link" }}
        </button>
      </div>
    </div>
    <p class="mt-3.5 max-w-[420px] pl-6 text-[13px] text-muted max-sm:pl-[18px]" aria-live="polite">
      <template v-if="open">Ending early isn’t final — you can reopen voting later if the crew changes its mind.</template>
      <template v-else>Reopening keeps every vote already cast — the race picks up where it stopped.</template>
    </p>
  </div>
</template>
