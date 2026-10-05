// Starters for decisions groups make over and over.
export const templates = [
  {
    key: "pizza",
    emoji: "🍕",
    name: "Pizza night",
    question: "Pizza night: what are we ordering?",
    options: ["Pepperoni", "Margherita", "Veggie supreme"],
    multiChoice: false,
  },
  {
    key: "film",
    emoji: "🎬",
    name: "Film night",
    question: "Film night: what are we watching?",
    options: ["", "", ""],
    multiChoice: true,
  },
  {
    key: "dinner",
    emoji: "🍜",
    name: "Where to eat",
    question: "Where are we eating?",
    options: ["", ""],
    multiChoice: false,
  },
  {
    key: "when",
    emoji: "📅",
    name: "Pick a day",
    question: "Which day works for everyone?",
    options: ["Friday", "Saturday", "Sunday"],
    multiChoice: true,
  },
];
