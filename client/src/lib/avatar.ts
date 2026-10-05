// DiceBear avatars, rendered in the browser with the JS library: no network
// request per face, and the same seed always draws the same face, so only the
// seed is ever stored.

import { Avatar, Style } from "@dicebear/core";
import openPeeps from "@dicebear/styles/open-peeps.json";

const style = new Style(openPeeps);
const BACKGROUNDS = ["#f1c54c", "#cae1d7", "#f5c6b8", "#d9c8f0", "#f0e2c8"];

// Rendering builds a whole SVG, and the same few faces repeat across stacks,
// lists and re-renders, so each seed is drawn once.
const cache = new Map<string, string>();

export function avatarUrl(seed: string) {
  let uri = cache.get(seed);
  if (!uri) {
    uri = new Avatar(style, { seed, backgroundColor: BACKGROUNDS, borderRadius: 50 }).toDataUri();
    cache.set(seed, uri);
  }
  return uri;
}

export function randomSeed() {
  return Math.random().toString(36).slice(2, 10);
}
