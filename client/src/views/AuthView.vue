<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useAuth } from "@/queries/auth";
import { errorMessage } from "@/lib/errors";
import AppLogo from "@/components/AppLogo.vue";
import AvatarStack from "@/components/AvatarStack.vue";

const props = defineProps<{ mode: "welcome" | "signup" | "login" }>();
const route = useRoute();
const router = useRouter();
const { signup, login, guest } = useAuth();

const form = reactive({ name: "", email: "", password: "" });
const busy = computed(() => [signup, login, guest].some((m) => m.asyncStatus.value === "loading"));
const error = ref("");

const crew = ["priya", "jonah", "sam", "kemi", "leo"].map((s) => ({ id: s, name: s, avatarSeed: s }));

function next() {
  const to = typeof route.query.redirect === "string" ? route.query.redirect : "/";
  router.replace(to);
}

async function run(task: () => Promise<unknown>) {
  error.value = "";
  try {
    await task();
    next();
  } catch (e) {
    error.value = errorMessage(e);
  }
}

function submit() {
  if (props.mode === "signup") {
    if (!form.name.trim()) return (error.value = "What should the crew call you?");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return (error.value = "That email doesn’t look right.");
    if (form.password.length < 8) return (error.value = "Passwords need at least 8 characters.");
    return run(() => signup.mutateAsync({ ...form, name: form.name.trim() }));
  }
  return run(() => login.mutateAsync({ email: form.email, password: form.password }));
}
</script>

<template>
  <div class="page flex min-h-dvh flex-col py-5">
    <header><AppLogo /></header>

    <main class="flex flex-1 flex-col justify-center py-10">
      <!-- Welcome -->
      <template v-if="mode === 'welcome'">
        <AvatarStack :voters="crew" :max="5" :size="44" class="mb-6" />
        <h1 class="text-[clamp(40px,8vw,64px)] font-extrabold tracking-tight text-shadow-pop">
          Group decisions,<br />settled.
        </h1>
        <p class="mt-5 max-w-[520px] text-lg text-muted">
          Ask a question, share one link, and watch the crew vote from their phones. Voters don’t need an account, and they can
          suggest options of their own.
        </p>

        <div class="mt-9 flex flex-wrap items-center gap-3">
          <button class="btn btn-tomato min-h-14 px-7 text-base" :disabled="busy" @click="run(() => guest.mutateAsync())">
            {{ busy ? "Setting things up…" : "Try it as a guest" }}
          </button>
          <RouterLink :to="{ name: 'signup', query: route.query }" class="btn btn-outline min-h-14 px-7 text-base">
            Create an account
          </RouterLink>
        </div>
        <p class="mt-4 text-sm text-muted">
          Guest mode comes with a few polls to play with.
          Already have an account? <RouterLink :to="{ name: 'login', query: route.query }" class="font-bold text-ink">Log in</RouterLink>
        </p>
        <p v-if="error" class="mt-4 font-semibold text-tomato-deep" role="alert">{{ error }}</p>
      </template>

      <!-- Sign up / log in -->
      <template v-else>
        <h1 class="text-[clamp(34px,6vw,44px)] font-extrabold tracking-tight text-shadow-pop">
          {{ mode === "signup" ? "Make an account" : "Welcome back" }}
        </h1>
        <p class="mt-2 text-muted">
          {{ mode === "signup" ? "Keep your polls in one place and reopen them whenever." : "Log in to see your polls." }}
        </p>

        <form class="card mt-7 flex max-w-[440px] flex-col gap-5 p-7 max-sm:p-5" novalidate @submit.prevent="submit">
          <div v-if="mode === 'signup'">
            <label for="name" class="label">Your name</label>
            <input id="name" v-model="form.name" class="field" autocomplete="given-name" maxlength="40" />
          </div>
          <div>
            <label for="email" class="label">Email</label>
            <input id="email" v-model="form.email" type="email" class="field" autocomplete="email" />
          </div>
          <div>
            <label for="password" class="label">Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="field"
              :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'"
            />
            <p v-if="mode === 'signup'" class="mt-1.5 text-xs text-muted">At least 8 characters.</p>
          </div>

          <p v-if="error" class="rounded-xl bg-blush px-4 py-3 text-sm font-semibold text-tomato-deep" role="alert">{{ error }}</p>

          <button class="btn btn-teal min-h-12 text-base" :disabled="busy">
            {{ busy ? "One sec…" : mode === "signup" ? "Create account" : "Log in" }}
          </button>
        </form>

        <p class="mt-5 text-sm text-muted">
          <template v-if="mode === 'signup'">
            Already have one? <RouterLink :to="{ name: 'login', query: route.query }" class="font-bold text-ink">Log in</RouterLink>
          </template>
          <template v-else>
            New here? <RouterLink :to="{ name: 'signup', query: route.query }" class="font-bold text-ink">Make an account</RouterLink>
          </template>
          · <RouterLink :to="{ name: 'welcome', query: route.query }" class="font-bold text-ink">Try as a guest</RouterLink>
        </p>
      </template>
    </main>
  </div>
</template>
