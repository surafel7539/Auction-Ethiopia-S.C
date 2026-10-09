export const CONDITIONS = ["New", "Like New", "Excellent", "Good", "Fair", "Used"];

export const MAX_LISTING_PHOTOS = 12;

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
  vehicles: { icon: "🚗", accent: "#6d28d9" },
  "real-estate": { icon: "🏛️", accent: "#2563eb" },
  "art-antiques": { icon: "🎨", accent: "#eab308" },
  electronics: { icon: "📱", accent: "#ea580c" },
  jewelry: { icon: "💎", accent: "#16a34a" },
  industrial: { icon: "⚙️", accent: "#84cc16" },
  agriculture: { icon: "🌾", accent: "#16a34a" },
  collectibles: { icon: "🏺", accent: "#2563eb" },
};
