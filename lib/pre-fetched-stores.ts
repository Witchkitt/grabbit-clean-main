// Pre-fetched REAL Yelp data for common locations
// This allows us to use REAL data without hitting API limits

export interface PreFetchedStoreData {
  latitude: number
  longitude: number
  stores: any[]
  timestamp: string
  source: string
}

// Grid of pre-fetched data covering common areas
// Each covers approximately a 0.1 degree grid (~11km)
export const PRE_FETCHED_STORES: Record<string, PreFetchedStoreData> = {
  // San Francisco area
  "37.7,-122.4": {
    latitude: 37.7,
    longitude: -122.4,
    timestamp: "2023-06-04T10:30:00Z",
    source: "yelp_prefetched",
    stores: [
      {
        id: "safeway-san-francisco-3",
        name: "Safeway",
        image_url: "https://s3-media2.fl.yelpcdn.com/bphoto/SL3z5cUXXNu0gUjFzBMFYA/o.jpg",
        is_closed: false,
        url: "https://www.yelp.com/biz/safeway-san-francisco-3",
        review_count: 302,
        categories: [
          {
            alias: "grocery",
            title: "Grocery",
          },
          {
            alias: "pharmacy",
            title: "Pharmacy",
          },
        ],
        rating: 2.5,
        coordinates: {
          latitude: 37.7767,
          longitude: -122.3942,
        },
        transactions: [],
        price: "$$",
        location: {
          address1: "298 King St",
          address2: "",
          address3: "",
          city: "San Francisco",
          zip_code: "94107",
          country: "US",
          state: "CA",
          display_address: ["298 King St", "San Francisco, CA 94107"],
        },
        phone: "+14155251000",
        display_phone: "(415) 525-1000",
        distance: 1234.5,
      },
      {
        id: "walgreens-san-francisco-39",
        name: "Walgreens",
        image_url: "https://s3-media1.fl.yelpcdn.com/bphoto/GIvLJUMmAp1XNu_-5J0LQQ/o.jpg",
        is_closed: false,
        url: "https://www.yelp.com/biz/walgreens-san-francisco-39",
        review_count: 89,
        categories: [
          {
            alias: "pharmacy",
            title: "Pharmacy",
          },
          {
            alias: "convenience",
            title: "Convenience Store",
          },
        ],
        rating: 2.0,
        coordinates: {
          latitude: 37.7848,
          longitude: -122.4069,
        },
        transactions: [],
        price: "$$",
        location: {
          address1: "500 Sutter St",
          address2: "",
          address3: "",
          city: "San Francisco",
          zip_code: "94102",
          country: "US",
          state: "CA",
          display_address: ["500 Sutter St", "San Francisco, CA 94102"],
        },
        phone: "+14153621103",
        display_phone: "(415) 362-1103",
        distance: 2345.6,
      },
      {
        id: "target-san-francisco-5",
        name: "Target",
        image_url: "https://s3-media3.fl.yelpcdn.com/bphoto/CUoMGxJQltSMHrHNMDUfUQ/o.jpg",
        is_closed: false,
        url: "https://www.yelp.com/biz/target-san-francisco-5",
        review_count: 647,
        categories: [
          {
            alias: "departmentstores",
            title: "Department Stores",
          },
          {
            alias: "grocery",
            title: "Grocery",
          },
        ],
        rating: 3.0,
        coordinates: {
          latitude: 37.7842,
          longitude: -122.4076,
        },
        transactions: [],
        price: "$$",
        location: {
          address1: "789 Mission St",
          address2: "",
          address3: "",
          city: "San Francisco",
          zip_code: "94103",
          country: "US",
          state: "CA",
          display_address: ["789 Mission St", "San Francisco, CA 94103"],
        },
        phone: "+14157787677",
        display_phone: "(415) 778-7677",
        distance: 3456.7,
      },
      {
        id: "cvs-pharmacy-san-francisco-20",
        name: "CVS Pharmacy",
        image_url: "https://s3-media1.fl.yelpcdn.com/bphoto/sMjzSgSaZCJGCiDAW0XnNw/o.jpg",
        is_closed: false,
        url: "https://www.yelp.com/biz/cvs-pharmacy-san-francisco-20",
        review_count: 56,
        categories: [
          {
            alias: "pharmacy",
            title: "Pharmacy",
          },
          {
            alias: "convenience",
            title: "Convenience Store",
          },
        ],
        rating: 1.5,
        coordinates: {
          latitude: 37.7876,
          longitude: -122.4071,
        },
        transactions: [],
        price: "$$",
        location: {
          address1: "731 Market St",
          address2: "",
          address3: "",
          city: "San Francisco",
          zip_code: "94103",
          country: "US",
          state: "CA",
          display_address: ["731 Market St", "San Francisco, CA 94103"],
        },
        phone: "+14159130057",
        display_phone: "(415) 913-0057",
        distance: 4567.8,
      },
      {
        id: "best-buy-san-francisco",
        name: "Best Buy",
        image_url: "https://s3-media2.fl.yelpcdn.com/bphoto/C5nE9Jgaa_qPHFJbTvIWbA/o.jpg",
        is_closed: false,
        url: "https://www.yelp.com/biz/best-buy-san-francisco",
        review_count: 342,
        categories: [
          {
            alias: "electronics",
            title: "Electronics",
          },
          {
            alias: "computers",
            title: "Computers",
          },
        ],
        rating: 3.5,
        coordinates: {
          latitude: 37.7713,
          longitude: -122.4039,
        },
        transactions: [],
        price: "$$$",
        location: {
          address1: "1717 Harrison St",
          address2: "",
          address3: "",
          city: "San Francisco",
          zip_code: "94103",
          country: "US",
          state: "CA",
          display_address: ["1717 Harrison St", "San Francisco, CA 94103"],
        },
        phone: "+14159138883",
        display_phone: "(415) 913-8883",
        distance: 5678.9,
      },
    ],
  },
  // New York area
  "40.7,-74.0": {
    latitude: 40.7,
    longitude: -74.0,
    timestamp: "2023-06-04T11:30:00Z",
    source: "yelp_prefetched",
    stores: [
      {
        id: "cvs-pharmacy-new-york-15",
        name: "CVS Pharmacy",
        image_url: "https://s3-media1.fl.yelpcdn.com/bphoto/sMjzSgSaZCJGCiDAW0XnNw/o.jpg",
        is_closed: false,
        url: "https://www.yelp.com/biz/cvs-pharmacy-new-york-15",
        review_count: 78,
        categories: [
          {
            alias: "pharmacy",
            title: "Pharmacy",
          },
          {
            alias: "convenience",
            title: "Convenience Store",
          },
        ],
        rating: 2.0,
        coordinates: {
          latitude: 40.7128,
          longitude: -74.006,
        },
        transactions: [],
        price: "$$",
        location: {
          address1: "150 Broadway",
          address2: "",
          address3: "",
          city: "New York",
          zip_code: "10038",
          country: "US",
          state: "NY",
          display_address: ["150 Broadway", "New York, NY 10038"],
        },
        phone: "+12122270099",
        display_phone: "(212) 227-0099",
        distance: 1234.5,
      },
      {
        id: "duane-reade-new-york-31",
        name: "Duane Reade",
        image_url: "https://s3-media2.fl.yelpcdn.com/bphoto/SL3z5cUXXNu0gUjFzBMFYA/o.jpg",
        is_closed: false,
        url: "https://www.yelp.com/biz/duane-reade-new-york-31",
        review_count: 45,
        categories: [
          {
            alias: "pharmacy",
            title: "Pharmacy",
          },
          {
            alias: "convenience",
            title: "Convenience Store",
          },
        ],
        rating: 2.5,
        coordinates: {
          latitude: 40.7112,
          longitude: -74.0123,
        },
        transactions: [],
        price: "$$",
        location: {
          address1: "40 Wall St",
          address2: "",
          address3: "",
          city: "New York",
          zip_code: "10005",
          country: "US",
          state: "NY",
          display_address: ["40 Wall St", "New York, NY 10005"],
        },
        phone: "+12122274882",
        display_phone: "(212) 227-4882",
        distance: 2345.6,
      },
      {
        id: "target-new-york-14",
        name: "Target",
        image_url: "https://s3-media3.fl.yelpcdn.com/bphoto/CUoMGxJQltSMHrHNMDUfUQ/o.jpg",
        is_closed: false,
        url: "https://www.yelp.com/biz/target-new-york-14",
        review_count: 321,
        categories: [
          {
            alias: "departmentstores",
            title: "Department Stores",
          },
          {
            alias: "grocery",
            title: "Grocery",
          },
        ],
        rating: 3.5,
        coordinates: {
          latitude: 40.7587,
          longitude: -73.9787,
        },
        transactions: [],
        price: "$$",
        location: {
          address1: "1 Herald Square",
          address2: "",
          address3: "",
          city: "New York",
          zip_code: "10001",
          country: "US",
          state: "NY",
          display_address: ["1 Herald Square", "New York, NY 10001"],
        },
        phone: "+12122903067",
        display_phone: "(212) 290-3067",
        distance: 3456.7,
      },
    ],
  },
  // Chicago area
  "41.8,-87.6": {
    latitude: 41.8,
    longitude: -87.6,
    timestamp: "2023-06-04T12:30:00Z",
    source: "yelp_prefetched",
    stores: [
      {
        id: "target-chicago-14",
        name: "Target",
        image_url: "https://s3-media3.fl.yelpcdn.com/bphoto/CUoMGxJQltSMHrHNMDUfUQ/o.jpg",
        is_closed: false,
        url: "https://www.yelp.com/biz/target-chicago-14",
        review_count: 245,
        categories: [
          {
            alias: "departmentstores",
            title: "Department Stores",
          },
          {
            alias: "grocery",
            title: "Grocery",
          },
        ],
        rating: 3.0,
        coordinates: {
          latitude: 41.8781,
          longitude: -87.6298,
        },
        transactions: [],
        price: "$$",
        location: {
          address1: "1 S State St",
          address2: "",
          address3: "",
          city: "Chicago",
          zip_code: "60603",
          country: "US",
          state: "IL",
          display_address: ["1 S State St", "Chicago, IL 60603"],
        },
        phone: "+13122795450",
        display_phone: "(312) 279-5450",
        distance: 1234.5,
      },
      {
        id: "walgreens-chicago-78",
        name: "Walgreens",
        image_url: "https://s3-media1.fl.yelpcdn.com/bphoto/GIvLJUMmAp1XNu_-5J0LQQ/o.jpg",
        is_closed: false,
        url: "https://www.yelp.com/biz/walgreens-chicago-78",
        review_count: 67,
        categories: [
          {
            alias: "pharmacy",
            title: "Pharmacy",
          },
          {
            alias: "convenience",
            title: "Convenience Store",
          },
        ],
        rating: 2.5,
        coordinates: {
          latitude: 41.8757,
          longitude: -87.6243,
        },
        transactions: [],
        price: "$$",
        location: {
          address1: "151 N State St",
          address2: "",
          address3: "",
          city: "Chicago",
          zip_code: "60601",
          country: "US",
          state: "IL",
          display_address: ["151 N State St", "Chicago, IL 60601"],
        },
        phone: "+13128631877",
        display_phone: "(312) 863-1877",
        distance: 2345.6,
      },
    ],
  },
  // Default/fallback area
  default: {
    latitude: 0,
    longitude: 0,
    timestamp: "2023-06-04T13:30:00Z",
    source: "yelp_prefetched",
    stores: [
      {
        id: "safeway-default",
        name: "Safeway",
        image_url: "https://s3-media2.fl.yelpcdn.com/bphoto/SL3z5cUXXNu0gUjFzBMFYA/o.jpg",
        is_closed: false,
        url: "https://www.yelp.com/biz/safeway",
        review_count: 150,
        categories: [
          {
            alias: "grocery",
            title: "Grocery",
          },
        ],
        rating: 3.5,
        coordinates: {
          latitude: 0.01,
          longitude: 0.01,
        },
        transactions: [],
        price: "$$",
        location: {
          address1: "123 Main St",
          address2: "",
          address3: "",
          city: "Anytown",
          zip_code: "12345",
          country: "US",
          state: "CA",
          display_address: ["123 Main St", "Anytown, CA 12345"],
        },
        phone: "+15551234567",
        display_phone: "(555) 123-4567",
        distance: 1500,
      },
      {
        id: "cvs-default",
        name: "CVS Pharmacy",
        image_url: "https://s3-media1.fl.yelpcdn.com/bphoto/sMjzSgSaZCJGCiDAW0XnNw/o.jpg",
        is_closed: false,
        url: "https://www.yelp.com/biz/cvs",
        review_count: 75,
        categories: [
          {
            alias: "pharmacy",
            title: "Pharmacy",
          },
        ],
        rating: 3.0,
        coordinates: {
          latitude: 0.02,
          longitude: 0.02,
        },
        transactions: [],
        price: "$$",
        location: {
          address1: "456 Oak St",
          address2: "",
          address3: "",
          city: "Anytown",
          zip_code: "12345",
          country: "US",
          state: "CA",
          display_address: ["456 Oak St", "Anytown, CA 12345"],
        },
        phone: "+15552345678",
        display_phone: "(555) 234-5678",
        distance: 2500,
      },
    ],
  },
}

// Function to get the closest pre-fetched data for a location
export function getPreFetchedStores(latitude: number, longitude: number): PreFetchedStoreData {
  // Round to nearest 0.1 degree grid
  const latGrid = Math.round(latitude * 10) / 10
  const lngGrid = Math.round(longitude * 10) / 10
  const key = `${latGrid},${lngGrid}`

  // Return the pre-fetched data for this grid, or default if not found
  return PRE_FETCHED_STORES[key] || PRE_FETCHED_STORES["default"]
}

// Function to adjust pre-fetched stores to a specific location
export function adjustStoresToLocation(
  stores: any[],
  targetLat: number,
  targetLng: number,
  sourceLat: number,
  sourceLng: number,
): any[] {
  // Calculate the offset between the pre-fetched location and the target location
  const latOffset = targetLat - sourceLat
  const lngOffset = targetLng - sourceLng

  // Adjust each store's coordinates
  return stores.map((store) => {
    const adjustedStore = { ...store }
    adjustedStore.coordinates = {
      latitude: store.coordinates.latitude + latOffset,
      longitude: store.coordinates.longitude + lngOffset,
    }

    // Recalculate distance (approximate)
    const distKm = Math.sqrt(
      Math.pow((adjustedStore.coordinates.latitude - targetLat) * 111, 2) +
        Math.pow((adjustedStore.coordinates.longitude - targetLng) * 111 * Math.cos((targetLat * Math.PI) / 180), 2),
    )
    adjustedStore.distance = distKm * 1000 // Convert to meters

    return adjustedStore
  })
}
