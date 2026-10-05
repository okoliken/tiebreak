<script setup lang="ts">
import { computed } from "vue";
import type { Poll } from "@/api/types";
import { whenParts } from "@/lib/format";
import AppIcon from "./AppIcon.vue";

const props = defineProps<{ poll: Poll }>();
const open = computed(() => props.poll.status === "open");
const when = computed(() => whenParts(props.poll.closedAt ?? props.poll.closesAt));
</script>

<template>
  <div class="flex flex-wrap gap-3">
    <span
      v-if="open"
      class="inline-flex min-h-9 items-center gap-2 rounded-full bg-teal-soft px-4 text-[13px] font-bold text-teal-ink"
    >
      <i class="size-[7px] rounded-full bg-teal" />Voting open
    </span>
    <span v-else class="inline-flex min-h-9 items-center gap-2 rounded-full bg-sand px-4 text-[13px] font-bold">
      <AppIcon name="lock" :size="13" />Voting closed
    </span>
    <span
      class="inline-flex min-h-9 items-center gap-2 rounded-full border-[1.5px] border-line bg-paper px-4 text-[13px] font-semibold text-muted"
    >
      <AppIcon name="clock" :size="14" />
      {{ open ? "Closes" : "Closed" }} {{ when.day }} at <strong class="text-ink">{{ when.time }}</strong>
    </span>
    <span
      v-if="poll.multiChoice"
      class="inline-flex min-h-9 items-center rounded-full border-[1.5px] border-line bg-paper px-4 text-[13px] font-semibold text-muted"
    >
      Pick as many as you like
    </span>
  </div>
</template>
