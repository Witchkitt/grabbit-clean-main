/**
 * ⚠️ UPDATED CATEGORIZATION DATABASE WITH MUSIC STORE CATEGORY ⚠️
 *
 * Added Music Store category for musicians and instrument needs.
 *
 * Last update: 2024-01-XX
 */

export interface ItemCategory {
  id: string
  name: string
  emoji: string
  stores: string[]
}

// ✅ ADDED MUSIC STORE CATEGORY
export const CATEGORIES: ItemCategory[] = [
  {
    id: "grocery",
    name: "Grocery Store",
    emoji: "🛒",
    stores: ["Safeway", "Kroger", "Whole Foods", "Aldi", "Walmart", "Costco"],
  },
  {
    id: "pharmacy",
    name: "Pharmacy",
    emoji: "💊",
    stores: ["CVS", "Walgreens", "Rite Aid", "Target Pharmacy"],
  },
  {
    id: "hardware",
    name: "Hardware Store",
    emoji: "🛠️",
    stores: ["Home Depot", "Lowe's", "Ace Hardware"],
  },
  {
    id: "department",
    name: "Department Store",
    emoji: "🏬",
    stores: ["Target", "Kohl's", "Macy's", "JCPenney"],
  },
  {
    id: "pet",
    name: "Pet Store",
    emoji: "🐶",
    stores: ["Petco", "PetSmart"],
  },
  {
    id: "electronics",
    name: "Electronics Store",
    emoji: "📱",
    stores: ["Best Buy", "Apple Store"],
  },
  {
    id: "service",
    name: "Service Station",
    emoji: "⛽",
    stores: ["Gas Station", "Shell", "Chevron", "Exxon", "BP", "Mobil"],
  },
  {
    id: "music",
    name: "Music Store",
    emoji: "🎸",
    stores: ["Guitar Center", "Sam Ash", "Music & Arts", "Local Music Shop"],
  },
]

// ✅ COMPREHENSIVE MUSIC STORE ITEM DATABASE
const ITEM_DATABASE: Record<string, string[]> = {
  // 🛒 GROCERY STORE - ALL FOOD & BASIC HOUSEHOLD
  eggs: ["grocery"],
  milk: ["grocery"],
  chicken: ["grocery"],
  beef: ["grocery"],
  pork: ["grocery"],
  fish: ["grocery"],
  salmon: ["grocery"],
  tuna: ["grocery"],
  cheese: ["grocery"],
  butter: ["grocery"],
  yogurt: ["grocery"],
  bread: ["grocery"],
  lettuce: ["grocery"],
  tomatoes: ["grocery"],
  onions: ["grocery"],
  garlic: ["grocery"],
  potatoes: ["grocery"],
  carrots: ["grocery"],
  broccoli: ["grocery"],
  spinach: ["grocery"],
  apples: ["grocery"],
  bananas: ["grocery"],
  oranges: ["grocery"],
  grapes: ["grocery"],
  rice: ["grocery"],
  pasta: ["grocery"],
  cereal: ["grocery"],
  oatmeal: ["grocery"],
  coffee: ["grocery"],
  tea: ["grocery"],
  sugar: ["grocery"],
  salt: ["grocery"],
  pepper: ["grocery"],
  oil: ["grocery"],
  "cooking oil": ["grocery"],
  flour: ["grocery"],
  beans: ["grocery"],
  soup: ["grocery"],
  snacks: ["grocery"],
  chips: ["grocery"],
  crackers: ["grocery"],
  juice: ["grocery"],
  soda: ["grocery"],
  water: ["grocery"],
  "ice cream": ["grocery"],
  "frozen meals": ["grocery"],

  // Basic Household (Grocery)
  "paper towels": ["grocery"],
  "toilet paper": ["grocery"],
  "trash bags": ["grocery"],
  "aluminum foil": ["grocery"],
  "plastic wrap": ["grocery"],
  "ziplock bags": ["grocery"],
  "dish soap": ["grocery"],

  // 💊 PHARMACY - HEALTH & PERSONAL CARE
  toothpaste: ["pharmacy"],
  toothbrush: ["pharmacy"],
  mouthwash: ["pharmacy"],
  shampoo: ["pharmacy"],
  conditioner: ["pharmacy"],
  soap: ["pharmacy"],
  "body wash": ["pharmacy"],
  deodorant: ["pharmacy"],
  "nail clippers": ["pharmacy"],
  "band-aids": ["pharmacy"],
  aspirin: ["pharmacy"],
  vitamins: ["pharmacy"],
  sunscreen: ["pharmacy"],
  "hand sanitizer": ["pharmacy"],
  lotion: ["pharmacy"],
  "contact solution": ["pharmacy"],
  diapers: ["pharmacy"],
  "baby formula": ["pharmacy"],

  // 🛠️ HARDWARE STORE - TOOLS & HOME IMPROVEMENT
  batteries: ["hardware"],
  "light bulbs": ["hardware"],
  flashlight: ["hardware"],
  screws: ["hardware"],
  nails: ["hardware"],
  hammer: ["hardware"],
  screwdriver: ["hardware"],
  drill: ["hardware"],
  paint: ["hardware"],
  "duct tape": ["hardware"],
  "super glue": ["hardware"],
  plunger: ["hardware"],
  broom: ["hardware"],
  shovel: ["hardware"],
  rake: ["hardware"],
  "extension cord": ["hardware"],
  "light switch": ["hardware"],
  sandpaper: ["hardware"],

  // ⛽ SERVICE STATION - GAS & FUEL (Service only)
  gas: ["service"],
  "gas for lawnmower": ["service"],
  "gas for car": ["service"],
  "gas for snowblower": ["service"],
  "lawn mower gas": ["service"],
  "mower gas": ["service"],
  fuel: ["service"],
  "car wash": ["service"],
  "windshield washer fluid": ["service"],
  "oil change": ["service"],
  "air for tires": ["service"],

  // ✅ MULTI-CATEGORY ITEMS (Available at both Hardware & Service)
  propane: ["hardware", "service"],
  "propane tank": ["hardware", "service"],
  "propane tanks": ["hardware", "service"],
  "motor oil": ["hardware", "service"],
  "engine oil": ["hardware", "service"],
  "2-cycle oil": ["hardware", "service"],
  "chainsaw oil": ["hardware", "service"],

  // 🏬 DEPARTMENT STORE - CLOTHING & HOME GOODS
  socks: ["department"],
  underwear: ["department"],
  "t-shirt": ["department"],
  shirt: ["department"],
  pants: ["department"],
  jeans: ["department"],
  shorts: ["department"],
  "pair of shorts": ["department"],
  dress: ["department"],
  skirt: ["department"],
  jacket: ["department"],
  sweater: ["department"],
  shoes: ["department"],
  sneakers: ["department"],
  boots: ["department"],
  sandals: ["department"],
  belt: ["department"],
  hat: ["department"],
  gloves: ["department"],
  scarf: ["department"],

  // Home Goods
  towels: ["department"],
  "bath towels": ["department"],
  sheets: ["department"],
  "bed sheets": ["department"],
  pillows: ["department"],
  blanket: ["department"],
  "shower curtain": ["department"],
  curtains: ["department"],
  "picture frame": ["department"],
  candles: ["department"],
  "birthday candles": ["department"],

  // 🐶 PET STORE - PET SUPPLIES
  "dog food": ["pet"],
  "cat food": ["pet"],
  "cat litter": ["pet"],
  "dog treats": ["pet"],
  "cat treats": ["pet"],
  "pet toys": ["pet"],
  "dog leash": ["pet"],
  "pet bed": ["pet"],

  // 📱 ELECTRONICS STORE - TECH & GADGETS
  "phone charger": ["electronics"],
  charger: ["electronics"],
  headphones: ["electronics"],
  "usb cable": ["electronics"],
  mouse: ["electronics"],
  keyboard: ["electronics"],
  "phone case": ["electronics"],
  "screen protector": ["electronics"],
  "memory card": ["electronics"],

  // 🎸 MUSIC STORE - INSTRUMENTS & ACCESSORIES
  // String Instruments
  "guitar picks": ["music"],
  picks: ["music"],
  "guitar strings": ["music"],
  "bass strings": ["music"],
  "violin strings": ["music"],
  "acoustic strings": ["music"],
  "electric strings": ["music"],
  strings: ["music"],
  capo: ["music"],
  "guitar strap": ["music"],
  tuner: ["music"],
  "guitar tuner": ["music"],
  slide: ["music"],
  "guitar slide": ["music"],
  "string winder": ["music"],
  "cleaning cloth": ["music"],
  "guitar polish": ["music"],
  "fretboard conditioner": ["music"],
  "gig bag": ["music"],
  "guitar case": ["music"],
  "hard case": ["music"],
  humidifier: ["music"],
  "guitar humidifier": ["music"],
  "picks holder": ["music"],
  "fingerboard tape": ["music"],

  // Percussion / Drums
  "drum sticks": ["music"],
  drumsticks: ["music"],
  sticks: ["music"],
  "drum heads": ["music"],
  "drum key": ["music"],
  "cymbal polish": ["music"],
  "practice pad": ["music"],
  "stick bag": ["music"],
  moongel: ["music"],
  dampeners: ["music"],
  "kick pedal": ["music"],
  "snare wires": ["music"],
  "replacement felts": ["music"],
  "hi-hat clutch": ["music"],
  brushes: ["music"],
  mallets: ["music"],

  // Keyboards / Pianos
  "sustain pedal": ["music"],
  "power adapter": ["music"],
  "keyboard stand": ["music"],
  "piano bench": ["music"],
  bench: ["music"],
  "dust cover": ["music"],
  "keyboard cover": ["music"],
  "sheet music stand": ["music"],
  "midi cable": ["music"],
  "expression pedal": ["music"],

  // Wind Instruments
  reeds: ["music"],
  "clarinet reeds": ["music"],
  "saxophone reeds": ["music"],
  "cork grease": ["music"],
  "valve oil": ["music"],
  "slide cream": ["music"],
  swabs: ["music"],
  "cleaning kit": ["music"],
  "mouthpiece cushions": ["music"],
  ligature: ["music"],
  "reed case": ["music"],
  metronome: ["music"],
  "neck strap": ["music"],

  // Sheet Music & Education
  "sheet music": ["music"],
  songbooks: ["music"],
  "music theory books": ["music"],
  "practice journal": ["music"],
  "manuscript paper": ["music"],
  flashcards: ["music"],
  "music flashcards": ["music"],

  // Live Performance & Recording
  microphone: ["music"],
  "xlr cables": ["music"],
  "audio interface": ["music"],
  "mic stand": ["music"],
  "pop filter": ["music"],
  "soundproof foam": ["music"],
  "studio headphones": ["music"],
  "in-ear monitors": ["music"],
  "power strip": ["music"],
  "stage tuner": ["music"],
  "pa cables": ["music"],
  adapters: ["music"],

  // Miscellaneous & Essentials
  earplugs: ["music"],
  "musician earplugs": ["music"],
  "instrument cable": ["music"],
  "guitar cable": ["music"],
  "patch cables": ["music"],
  "music stand light": ["music"],
  "instrument tags": ["music"],
  "clip-on tuner": ["music"],
  "hand exerciser": ["music"],

  // Multi-category items (Music + Electronics)
  "midi interface": ["music", "electronics"],
  "audio cables": ["music", "electronics"],
  "recording equipment": ["music", "electronics"],
}

export interface ShoppingItem {
  id: string
  name: string
  primaryCategory: ItemCategory
  allCategories: ItemCategory[]
  completed: boolean
  createdAt: Date
}

/**
 * ✅ UPDATED: Multi-category support
 */
export function categorizeItem(itemName: string): {
  primaryCategory: ItemCategory
  allCategories: ItemCategory[]
} {
  const lowerName = itemName.toLowerCase().trim()

  // Check exact matches first
  if (ITEM_DATABASE[lowerName]) {
    const categoryIds = ITEM_DATABASE[lowerName]
    const categories = categoryIds
      .map((id) => CATEGORIES.find((cat) => cat.id === id))
      .filter(Boolean) as ItemCategory[]

    return {
      primaryCategory: categories[0] || CATEGORIES[0],
      allCategories: categories,
    }
  }

  // Check partial matches
  for (const [keyword, categoryIds] of Object.entries(ITEM_DATABASE)) {
    if (lowerName.includes(keyword) || keyword.includes(lowerName)) {
      const categories = categoryIds
        .map((id) => CATEGORIES.find((cat) => cat.id === id))
        .filter(Boolean) as ItemCategory[]

      return {
        primaryCategory: categories[0] || CATEGORIES[0],
        allCategories: categories,
      }
    }
  }

  // Default to grocery store
  return {
    primaryCategory: CATEGORIES[0],
    allCategories: [CATEGORIES[0]],
  }
}
