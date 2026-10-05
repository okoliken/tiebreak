/**
 * Live results over Server-Sent Events.
 *
 * SSE is a plain HTTP response that never ends: the server keeps writing
 * little text frames into it and the browser's EventSource fires an event
 * per frame. It's one-way (server -> browser), which is all "results
 * update as votes land" needs, so it's simpler than WebSockets.
 */

import type { Response } from "express";

// slug -> the open responses watching that poll
const watchers = new Map<string, Set<Response>>();

/**
 * 1. Set the headers that keep the stream open:
 *      Content-Type: text/event-stream
 *      Cache-Control: no-cache
 *      Connection: keep-alive
 *    then res.flushHeaders() so the browser sees the connection right away.
 * 2. Add `res` to watchers.get(slug), creating the Set if needed.
 * 3. Every 25s, write a comment line (": ping\n\n"). Proxies close idle
 *    connections, and lines starting with ":" are ignored by EventSource.
 * 4. On res.on("close"): clear the interval and remove res from the Set,
 *    otherwise every closed browser tab leaks a response object.
 */
export function subscribe(_slug: string, _res: Response) {}

/**
 * Write "event: changed\ndata: {}\n\n" to every watcher of `slug`.
 * Call it after every write that changes a poll.
 *
 * THINK: this Map lives in this one process's memory. Run two copies of the
 * server and a vote on copy A never reaches watchers on copy B. Fine for
 * this project. The real fix is Postgres LISTEN/NOTIFY or Redis pub/sub.
 */
export function notify(_slug: string) {
  void watchers;
}
