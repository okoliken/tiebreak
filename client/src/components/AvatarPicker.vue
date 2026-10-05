<script setup lang="ts">
import { ref } from "vue";
import { randomSeed } from "@/lib/avatar";
import AppIcon from "./AppIcon.vue";
import VoterAvatar from "./VoterAvatar.vue";

const seed = defineModel<string>({ required: true });

const fresh = () => Array.from({ length: 6 }, randomSeed);
const choices = ref([seed.value, ...fresh()]);

function shuffle() {
  choices.value = [seed.value, ...fresh()];
}
</script>

<template>
  <fieldset>
    <legend class="label">Pick your face</legend>
    <div class="flex flex-wrap items-center gap-2.5">
      <label v-for="s in choices" :key="s" class="relative cursor-pointer rounded-full">
        <input v-model="seed" type="radio" name="avatar" :value="s" class="peer sr-only" />
        <VoterAvatar
          :seed="s"
          name="Avatar option"
          :size="52"
          class="transition peer-checked:scale-110 peer-checked:ring-4 peer-checked:ring-mustard peer-focus-visible:outline-3 peer-focus-visible:outline-teal hover:-translate-y-0.5"
        />
      </label>
      <button type="button" class="btn btn-ghost px-3" @click="shuffle">
        <AppIcon name="shuffle" />More faces
      </button>
    </div>
  </fieldset>
</template>
