const YELP_API_KEY = process.env.YELP_API_KEY
const YELP_API_BASE = "https://api.yelp.com/v3"

export interface YelpBusiness {
  id: string
  name: string
  image_url: string
  is_closed: boolean
  url: string
  review_count: number
  categories: Array<{
    alias: string
    title: string
  }>
  rating: number
  coordinates: {
    latitude: number
    longitude: number
  }
  transactions: string[]
  price?: string
  location: {
    address1: string
    address2?: string
    address3?: string
    city: string
    zip_code: string
    country: string
    state: string
    display_address: string[]
  }
  phone: string
  display_phone: string
  distance: number
}

export interface YelpSearchResponse {
  businesses: YelpBusiness[]
  total: number
  region: {
    center: {
      longitude: number
      latitude: number
    }
  }
}

// ✅ SIMPLIFIED CATEGORY MAPPING - More inclusive
const YELP_TO_GRABBIT_MAPPING: Record<string, string[]> = {
  // GROCERY STORES
  grocery: ["grocery"],
  supermarkets: ["grocery"],
  convenience: ["grocery"],
  markets: ["grocery"],
  farmersmarket: ["grocery"],
  organic_stores: ["grocery"],

  // PHARMACY
  pharmacy: ["pharmacy"],
  drugstores: ["pharmacy"],

  // HARDWARE & HOME IMPROVEMENT
  hardware: ["hardware"],
  homeandgarden: ["hardware"],
  nurseries: ["hardware"],

  // DEPARTMENT STORES
  departmentstores: ["department"],
  discount_stores: ["department"],
  wholesale_stores: ["department"],

  // PET STORES
  petstore: ["pet"],
  pet_services: ["pet"],

  // ELECTRONICS
  electronics: ["electronics"],
  computers: ["electronics"],
  mobilephones: ["electronics"],

  // MUSIC STORES
  musicalinstruments: ["music"],
  musicstores: ["music"],
  vinyl_records: ["music"],

  // SERVICE STATIONS
  servicestations: ["service"],
  gasoline: ["service"],
  gas_stations: ["service"],
}

/**
 * ✅ SMART CATEGORY MAPPING
 */
export function mapYelpBusinessToGrabbitCategories(business: YelpBusiness): string[] {
  const yelpAliases = business.categories.map((cat) => cat.alias.toLowerCase())
  const businessName = business.name.toLowerCase()
  const grabbitCategories = new Set<string>()

  // ✅ SPECIAL CASE: Known store names
  if (businessName.includes("safeway")) {
    grabbitCategories.add("grocery")
  }
  if (businessName.includes("osh") || businessName.includes("orchard supply")) {
    grabbitCategories.add("hardware")
  }
  if (businessName.includes("home depot") || businessName.includes("lowes")) {
    grabbitCategories.add("hardware")
  }
  if (businessName.includes("cvs") || businessName.includes("walgreens")) {
    grabbitCategories.add("pharmacy")
  }
  if (businessName.includes("target") || businessName.includes("walmart")) {
    grabbitCategories.add("department")
  }
  if (businessName.includes("petco") || businessName.includes("petsmart")) {
    grabbitCategories.add("pet")
  }

  // Check each Yelp category against our mapping
  for (const alias of yelpAliases) {
    // Direct mapping
    if (YELP_TO_GRABBIT_MAPPING[alias]) {
      YELP_TO_GRABBIT_MAPPING[alias].forEach((cat) => grabbitCategories.add(cat))
    }

    // Partial matching for variations
    for (const [yelpCat, grabbitCats] of Object.entries(YELP_TO_GRABBIT_MAPPING)) {
      if (alias.includes(yelpCat) || yelpCat.includes(alias)) {
        grabbitCats.forEach((cat) => grabbitCategories.add(cat))
      }
    }
  }

  // ✅ BROADER CATEGORY INFERENCE
  for (const alias of yelpAliases) {
    if (alias.includes("food") || alias.includes("market") || alias.includes("grocery")) {
      grabbitCategories.add("grocery")
    }
    if (alias.includes("hardware") || alias.includes("home") || alias.includes("garden")) {
      grabbitCategories.add("hardware")
    }
    if (alias.includes("pharmacy") || alias.includes("drug")) {
      grabbitCategories.add("pharmacy")
    }
    if (alias.includes("pet")) {
      grabbitCategories.add("pet")
    }
  }

  return Array.from(grabbitCategories)
}

// ✅ THIS FUNCTION IS NO LONGER USED - API ROUTE HANDLES EVERYTHING
export async function searchNearbyStores(
  latitude: number,
  longitude: number,
  category?: string,
  radius = 5000,
  limit = 50,
): Promise<YelpBusiness[]> {
  console.log("⚠️ searchNearbyStores called directly - this should use the API route instead")
  return []
}

export async function getBusinessDetails(businessId: string): Promise<YelpBusiness | null> {
  try {
    if (!YELP_API_KEY) {
      console.error("Yelp API key not found")
      return null
    }

    const response = await fetch(`${YELP_API_BASE}/businesses/${businessId}`, {
      headers: {
        Authorization: `Bearer ${YELP_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Yelp API error: ${response.status}`)
    }

    const business = await response.json()
    return business
  } catch (error) {
    console.error("Error fetching business details:", error)
    return null
  }
}

// Helper function to calculate distance in miles
export function metersToMiles(meters: number): string {
  const miles = meters * 0.000621371
  return miles < 1 ? `${Math.round(miles * 10) / 10} mi` : `${Math.round(miles * 10) / 10} mi`
}

// ✅ SIMPLIFIED CATEGORY DETECTION
export function getCategoryFromYelp(yelpCategories: Array<{ alias: string; title: string }>): string {
  const business = { categories: yelpCategories } as YelpBusiness
  const grabbitCategories = mapYelpBusinessToGrabbitCategories(business)

  // Return the first category, or default to grocery
  return grabbitCategories[0] || "grocery"
}
