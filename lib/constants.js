export const CONDITIONS = ["New", "Like New", "Excellent", "Good", "Fair", "Used"];

export const LOCATIONS = [
  "Addis Ababa",
  "Dire Dawa",
  "Hawassa",
  "Bahir Dar",
  "Mekelle",
  "Adama",
  "Jimma",
  "Gondar",
  "Other",
];

export const SORT_OPTIONS = [
  { value: "ending", label: "Ending soon" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "popular", label: "Most bids" },
];

export const STATUS_OPTIONS = [
  { value: "live", label: "Live auctions" },
  { value: "ending", label: "Ending soon" },
  { value: "ended", label: "Completed" },
];

export const CATEGORY_META = {
  vehicles: { icon: "🚗", accent: "#8b3a2a" },
  "real-estate": { icon: "🏛️", accent: "#1c3d2e" },
  "art-antiques": { icon: "🎨", accent: "#9b2c2c" },
  electronics: { icon: "📱", accent: "#2c4a6e" },
  jewelry: { icon: "💎", accent: "#c4a35a" },
  industrial: { icon: "⚙️", accent: "#4a4036" },
  agriculture: { icon: "🌾", accent: "#3d6b2f" },
  collectibles: { icon: "🏺", accent: "#6b3a5d" },
};
