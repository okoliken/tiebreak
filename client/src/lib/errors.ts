// ApiError messages are written for humans; a TypeError is fetch failing to connect.
export function errorMessage(e: unknown, fallback = "Something went wrong — try again.") {
  return e instanceof Error && e.name !== "TypeError" ? e.message : fallback;
}
