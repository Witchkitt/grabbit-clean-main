// CONSERVATIVE API SETTINGS TO PRESERVE DAILY LIMIT
// Cache: 2 hours, Rate limit: 2 minutes between calls
import { type NextRequest, NextResponse } from "next/server"

const YELP_API_KEY = process.env.YELP_API_KEY
const YELP_API_BASE = "https://api.yelp.com/v3"

// MUCH LESS RESTRICTIVE rate limiting - 1 request per 5 seconds
let lastRequestTime = 0
const MIN_INTERVAL = 2 * 60 * 1000 // 2 minutes instead of 5 seconds

// Cache for 5 minutes (shorter for testing)
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 2 * 60 * 60 * 1000 // 2 hours instead of 5 minutes

function getCacheKey(lat: number, lng: number, radius: number, category?: string): string {
  const roundedLat = Math.round(lat * 1000) / 1000 // More precise rounding (3 decimals)
  const roundedLng = Math.round(lng * 1000) / 1000
  return `${roundedLat},${roundedLng},${radius},${category || "all"}`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const latitudeStr = searchParams.get("latitude")
  const longitudeStr = searchParams.get("longitude")
  const radiusStr = searchParams.get("radius") || "5000"
  const limitStr = searchParams.get("limit") || "20"
  const categoryFilter = searchParams.get("category")
  const forceRefresh = searchParams.get("force") === "true"

  console.log("🔍 API Request received:", {
    latitude: latitudeStr,
    longitude: longitudeStr,
    radius: radiusStr,
    limit: limitStr,
    category: categoryFilter,
    forceRefresh,
  })

  // Validate inputs
  if (!latitudeStr || !longitudeStr) {
    console.log("❌ Missing coordinates")
    return NextResponse.json({
      stores: [],
      meta: { error: "Missing coordinates", source: "validation_error" },
    })
  }

  const latitude = Number.parseFloat(latitudeStr)
  const longitude = Number.parseFloat(longitudeStr)
  const radius = Math.min(Number.parseInt(radiusStr), 10000)
  const limit = Math.min(Number.parseInt(limitStr), 50)

  if (isNaN(latitude) || isNaN(longitude)) {
    console.log("❌ Invalid coordinates")
    return NextResponse.json({
      stores: [],
      meta: { error: "Invalid coordinates", source: "validation_error" },
    })
  }

  console.log("✅ Valid coordinates:", { latitude, longitude, radius, limit })

  // Check cache first (unless force refresh is requested)
  if (!forceRefresh) {
    const cacheKey = getCacheKey(latitude, longitude, radius, categoryFilter)
    const cached = cache.get(cacheKey)
    const now = Date.now()

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      console.log("✅ Returning cached data")
      return NextResponse.json({
        ...cached.data,
        meta: {
          ...cached.data.meta,
          source: "cache",
          age_minutes: Math.round((now - cached.timestamp) / 60000),
        },
      })
    }
  } else {
    console.log("🔄 Force refresh requested, skipping cache")
  }

  // Check API key
  console.log("🔑 Checking API key:", YELP_API_KEY ? "Present" : "Missing")
  if (!YELP_API_KEY) {
    console.log("❌ No Yelp API key configured")
    return NextResponse.json({
      stores: getMoragaAreaStores(latitude, longitude),
      meta: {
        source: "fallback",
        reason: "no_api_key",
        note: "Using fallback data - API key not configured",
      },
    })
  }

  // Rate limiting check - MUCH LESS RESTRICTIVE
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  console.log("⏱️ Time since last request:", timeSinceLastRequest, "ms (min interval:", MIN_INTERVAL, "ms)")

  // Allow force refresh to bypass rate limiting
  if (timeSinceLastRequest < MIN_INTERVAL && !forceRefresh) {
    console.log("⏳ Rate limited, using fallback")
    return NextResponse.json({
      stores: getMoragaAreaStores(latitude, longitude),
      meta: {
        source: "fallback",
        reason: "rate_limited",
        next_request_in: Math.ceil((MIN_INTERVAL - timeSinceLastRequest) / 1000),
      },
    })
  }

  // Make Yelp API request
  try {
    console.log("🔥 Making LIVE Yelp API request...")
    lastRequestTime = now

    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: Math.min(radius, 40000).toString(),
      limit: Math.min(limit, 50).toString(),
      sort_by: "distance",
    })

    if (categoryFilter) {
      const yelpCategories: Record<string, string> = {
        grocery: "grocery,supermarkets",
        pharmacy: "pharmacy,drugstores",
        hardware: "hardware,homeandgarden",
        department: "departmentstores",
        pet: "petstore",
        electronics: "electronics",
        music: "musicalinstruments",
        service: "servicestations",
      }

      if (yelpCategories[categoryFilter]) {
        params.append("categories", yelpCategories[categoryFilter])
        console.log("🏷️ Added category filter:", yelpCategories[categoryFilter])
      }
    }

    const url = `${YELP_API_BASE}/businesses/search?${params}`
    console.log("🌐 Yelp API URL:", url)

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${YELP_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15000), // Increased timeout
    })

    console.log("📡 Yelp API response status:", response.status)
    console.log("📡 Yelp API response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorDetails = `HTTP ${response.status}`
      let errorData = null

      try {
        const errorText = await response.text()
        console.log("❌ Yelp API error response body:", errorText)

        try {
          errorData = JSON.parse(errorText)
          errorDetails = errorData.error?.description || errorText
        } catch (e) {
          errorDetails = errorText
        }
      } catch (e) {
        console.log("❌ Could not read error response body")
      }

      console.log(`❌ Yelp API error: ${response.status} - ${errorDetails}`)

      return NextResponse.json({
        stores: getMoragaAreaStores(latitude, longitude),
        meta: {
          source: "fallback",
          reason: "api_error",
          status: response.status,
          details: errorDetails,
          error_data: errorData,
          note: "Using fallback stores due to API error",
          debug_info: {
            url: url,
            api_key_present: !!YELP_API_KEY,
            api_key_length: YELP_API_KEY?.length || 0,
          },
        },
      })
    }

    const data = await response.json()
    console.log("🔥 Yelp API success! Response:", {
      businesses_count: data.businesses?.length || 0,
      total: data.total,
      region: data.region,
    })

    const businesses = data.businesses || []

    // Filter out restaurants and non-retail
    const stores = businesses.filter((business: any) => {
      const categories = business.categories?.map((c: any) => c.alias) || []
      const excludeList = [
        "restaurants",
        "bars",
        "nightlife",
        "coffee",
        "cafes",
        "fastfood",
        "pizza",
        "chinese",
        "mexican",
        "italian",
        "burgers",
        "sandwiches",
        "breakfast_brunch",
        "icecream",
        "desserts",
        "bakeries",
      ]
      const isExcluded = categories.some((cat: string) => excludeList.includes(cat))

      if (isExcluded) {
        console.log("🚫 Filtered out:", business.name, "- categories:", categories)
      }

      return !isExcluded
    })

    console.log(`✅ Filtered stores: ${stores.length} retail stores from ${businesses.length} total businesses`)

    const result = {
      stores,
      meta: {
        latitude,
        longitude,
        radius,
        count: stores.length,
        total_found: businesses.length,
        source: "yelp_live",
        timestamp: new Date().toISOString(),
        note: "🔥 LIVE data from Yelp API!",
        debug_info: {
          api_key_present: true,
          request_time: new Date().toISOString(),
        },
      },
    }

    // Cache the successful result
    const cacheKey = getCacheKey(latitude, longitude, radius, categoryFilter)
    cache.set(cacheKey, { data: result, timestamp: now })

    console.log(`🔥 SUCCESS: Returning ${stores.length} LIVE stores from Yelp API`)
    return NextResponse.json(result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.log("❌ Yelp API fetch error:", error)
    console.log("❌ Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: errorMessage,
      stack: error instanceof Error ? error.stack : "No stack trace",
    })

    return NextResponse.json({
      stores: getMoragaAreaStores(latitude, longitude),
      meta: {
        source: "fallback",
        reason: "fetch_error",
        error: errorMessage,
        error_type: error instanceof Error ? error.name : "Unknown",
        note: "Using fallback stores due to network error",
        debug_info: {
          api_key_present: !!YELP_API_KEY,
          timestamp: new Date().toISOString(),
        },
      },
    })
  }
}

// Enhanced fallback stores specifically for Moraga area
function getMoragaAreaStores(lat: number, lng: number) {
  console.log("🏪 Generating Moraga area fallback stores for location:", { lat, lng })

  // Calculate distance from center of Moraga
  const moragaLat = 37.8349
  const moragaLng = -122.13

  // Adjust stores based on how far we are from Moraga center
  const distanceFromMoraga = Math.sqrt(
    Math.pow((lat - moragaLat) * 111, 2) + Math.pow((lng - moragaLng) * 111 * Math.cos((lat * Math.PI) / 180), 2),
  )

  // Base stores for Moraga area
  const stores = [
    {
      id: "moraga-safeway",
      name: "Safeway",
      rating: 3.5,
      review_count: 150,
      categories: [{ alias: "grocery", title: "Grocery" }],
      coordinates: { latitude: 37.8351, longitude: -122.1302 },
      location: {
        display_address: ["1355 Moraga Way", "Moraga, CA 94556"],
      },
      phone: "+19253768700",
      distance: 800,
      price: "$$",
      is_closed: false,
      url: "https://yelp.com",
    },
    {
      id: "moraga-cvs",
      name: "CVS Pharmacy",
      rating: 3.0,
      review_count: 89,
      categories: [{ alias: "pharmacy", title: "Pharmacy" }],
      coordinates: { latitude: 37.8353, longitude: -122.1298 },
      location: {
        display_address: ["580 Moraga Rd", "Moraga, CA 94556"],
      },
      phone: "+19253777715",
      distance: 1200,
      price: "$$",
      is_closed: false,
      url: "https://yelp.com",
    },
    {
      id: "moraga-hardware",
      name: "Moraga Hardware & Lumber",
      rating: 4.5,
      review_count: 112,
      categories: [{ alias: "hardware", title: "Hardware Store" }],
      coordinates: { latitude: 37.8347, longitude: -122.1305 },
      location: {
        display_address: ["1409 Moraga Rd", "Moraga, CA 94556"],
      },
      phone: "+19253765555",
      distance: 1500,
      price: "$$",
      is_closed: false,
      url: "https://yelp.com",
    },
    {
      id: "lafayette-target",
      name: "Target",
      rating: 3.8,
      review_count: 234,
      categories: [{ alias: "departmentstores", title: "Department Store" }],
      coordinates: { latitude: 37.8857, longitude: -122.118 },
      location: {
        display_address: ["3702 Mt Diablo Blvd", "Lafayette, CA 94549"],
      },
      phone: "+19252844447",
      distance: 5600,
      price: "$$",
      is_closed: false,
      url: "https://yelp.com",
    },
    {
      id: "moraga-ace",
      name: "Moraga Ace Hardware",
      rating: 4.2,
      review_count: 87,
      categories: [{ alias: "hardware", title: "Hardware Store" }],
      coordinates: { latitude: 37.8349, longitude: -122.1297 },
      location: {
        display_address: ["1330 Moraga Way", "Moraga, CA 94556"],
      },
      phone: "+19253765555",
      distance: 900,
      price: "$$",
      is_closed: false,
      url: "https://yelp.com",
    },
    {
      id: "moraga-76",
      name: "76 Gas Station",
      rating: 3.0,
      review_count: 45,
      categories: [{ alias: "service", title: "Service Station" }],
      coordinates: { latitude: 37.8346, longitude: -122.131 },
      location: {
        display_address: ["1400 Moraga Way", "Moraga, CA 94556"],
      },
      phone: "+19253765555",
      distance: 850,
      price: "$$",
      is_closed: false,
      url: "https://yelp.com",
    },
    {
      id: "moraga-tjs",
      name: "Trader Joe's",
      rating: 4.3,
      review_count: 178,
      categories: [{ alias: "grocery", title: "Grocery" }],
      coordinates: { latitude: 37.8344, longitude: -122.1295 },
      location: {
        display_address: ["1170 Moraga Way", "Moraga, CA 94556"],
      },
      phone: "+19253765555",
      distance: 1100,
      price: "$$",
      is_closed: false,
      url: "https://yelp.com",
    },
  ]

  // If we're far from Moraga, add some stores from nearby areas
  if (distanceFromMoraga > 3) {
    // Add Lafayette stores
    if (lat > 37.88) {
      stores.push({
        id: "lafayette-whole-foods",
        name: "Whole Foods Market",
        rating: 4.0,
        review_count: 201,
        categories: [{ alias: "grocery", title: "Grocery" }],
        coordinates: { latitude: 37.8912, longitude: -122.1175 },
        location: {
          display_address: ["3502 Mt Diablo Blvd", "Lafayette, CA 94549"],
        },
        phone: "+19259627800",
        distance: 6200,
        price: "$$$",
        is_closed: false,
        url: "https://yelp.com",
      })
    }

    // Add Orinda stores
    if (lng < -122.17) {
      stores.push({
        id: "orinda-safeway",
        name: "Safeway",
        rating: 3.2,
        review_count: 132,
        categories: [{ alias: "grocery", title: "Grocery" }],
        coordinates: { latitude: 37.8771, longitude: -122.1802 },
        location: {
          display_address: ["2 Orinda Theatre Square", "Orinda, CA 94563"],
        },
        phone: "+19252540470",
        distance: 4800,
        price: "$$",
        is_closed: false,
        url: "https://yelp.com",
      })
    }
  }

  return stores
}
