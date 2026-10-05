<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import AppIcon from "./AppIcon.vue";
import AppLogo from "./AppLogo.vue";
import VoterAvatar from "./VoterAvatar.vue";
import { useAuth } from "@/queries/auth";

const { user, signOut } = useAuth();
const route = useRoute();
const router = useRouter();
const menuOpen = ref(false);

// A poll page belongs under "My polls"; "New poll" highlights neither tab.
const tab = computed(() => (route.name === "closed" ? "closed" : route.name === "new" ? null : "mine"));

const navLink = "rounded-full px-4 py-2 text-sm font-semibold no-underline transition-colors";

function leave() {
  menuOpen.value = false;
  signOut();
  router.push({ name: "welcome" });
}
</script>

<template>
  <header class="mx-auto flex max-w-[1104px] flex-wrap items-center gap-x-10 gap-y-3 px-gutter py-4 max-sm:gap-x-4">
    <AppLogo />

    <nav class="flex gap-1.5 max-sm:order-3 max-sm:w-full" aria-label="Polls">
      <RouterLink
        :to="{ name: 'dashboard' }"
        :class="[navLink, tab === 'mine' ? 'bg-sand text-ink' : 'text-muted hover:text-ink']"
      >
        My polls
      </RouterLink>
      <RouterLink
        :to="{ name: 'closed' }"
        :class="[navLink, tab === 'closed' ? 'bg-sand text-ink' : 'text-muted hover:text-ink']"
      >
        Closed
      </RouterLink>
    </nav>

    <div class="ml-auto flex items-center gap-4">
      <RouterLink :to="{ name: 'new' }" class="btn btn-outline max-sm:w-11 max-sm:px-0" aria-label="New poll">
        <AppIcon name="plus" />
        <span class="max-sm:hidden">New poll</span>
      </RouterLink>

      <div v-if="user" class="relative">
        <button
          class="block rounded-full"
          :aria-expanded="menuOpen"
          aria-haspopup="menu"
          aria-label="Account menu"
          @click="menuOpen = !menuOpen"
        >
          <VoterAvatar :seed="user.avatarSeed" :name="user.name" :size="40" />
        </button>
        <div
          v-if="menuOpen"
          class="absolute right-0 top-[calc(100%+8px)] z-20 w-60 rounded-2xl border-2 border-ink bg-paper p-2 shadow-pop"
          role="menu"
        >
          <div class="px-3 py-2">
            <p class="font-bold">{{ user.name }}</p>
            <p class="text-[13px] text-muted">{{ user.isGuest ? "Exploring as a guest" : user.email }}</p>
          </div>
          <RouterLink
            v-if="user.isGuest"
            :to="{ name: 'signup' }"
            class="block rounded-xl px-3 py-2 text-sm font-semibold no-underline hover:bg-sand"
            role="menuitem"
            @click="menuOpen = false"
          >
            Create a real account
          </RouterLink>
          <button
            class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-sand"
            role="menuitem"
            @click="leave"
          >
            <AppIcon name="logout" />Sign out
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
