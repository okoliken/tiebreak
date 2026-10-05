import { createRouter, createWebHistory } from "vue-router";
import { loadUser } from "@/queries/auth";

const DashboardView = () => import("@/views/DashboardView.vue");
const AuthView = () => import("@/views/AuthView.vue");

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "dashboard", component: DashboardView, meta: { creator: true } },
    { path: "/closed", name: "closed", component: DashboardView, meta: { creator: true } },
    { path: "/new", name: "new", component: () => import("@/views/NewPollView.vue"), meta: { creator: true } },
    { path: "/polls/:slug", name: "poll", component: () => import("@/views/PollView.vue"), props: true, meta: { creator: true } },
    { path: "/p/:slug", name: "vote", component: () => import("@/views/VoteView.vue"), props: true },
    { path: "/welcome", name: "welcome", component: AuthView, props: { mode: "welcome" }, meta: { guestOnly: true } },
    { path: "/signup", name: "signup", component: AuthView, props: { mode: "signup" } },
    { path: "/login", name: "login", component: AuthView, props: { mode: "login" }, meta: { guestOnly: true } },
    { path: "/:rest(.*)*", redirect: "/" },
  ],
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
});

router.beforeEach(async (to) => {
  const user = await loadUser();
  if (to.meta.creator && !user) return { name: "welcome", query: to.fullPath === "/" ? {} : { redirect: to.fullPath } };
  if (to.meta.guestOnly && user) return { name: "dashboard" };
});
