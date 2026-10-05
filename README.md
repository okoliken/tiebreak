# tiebreak

Group polls: share a link, friends vote without an account, results update live.
(Frontend Mentor "Poll creator app" product challenge.)

- `client/` – Vue 3 + Vite. Runs on an in-browser mock until `VITE_API_URL` is set.
- `server/` – Express 5 + Prisma 7 + Postgres. Skeleton routes return 501 until built.
- `API.md` – the contract both sides follow.

```sh
pnpm install
pnpm db:up                                # Postgres on :5435
pnpm dev:client                           # http://localhost:5173
pnpm dev:server                           # http://localhost:8010
```

Point the client at the real server: `echo VITE_API_URL=http://localhost:8010 > client/.env.local`
