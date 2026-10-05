// Inline SVG paths (24x24, stroke-based) so icons inherit currentColor.
export const icons = {
  plus: "M12 5v14M5 12h14",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  copy: "M9 9h10v10H9zM5 15V5h10",
  check: "M5 12.5l4.5 4.5L19 7.5",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z",
  x: "M6 6l12 12M18 6L6 18",
  shuffle: "M16 4h4v4M4 20L20 4M20 16v4h-4M15 15l5 5M4 4l5 5",
  back: "M15 5l-7 7 7 7",
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  edit: "M4 20h4L19 9l-4-4L4 16v4Z",
} as const;
