import { type NextRequest, NextResponse } from "next/server"
import { getBusinessDetails } from "@/lib/yelp-api"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const businessId = params.id

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 })
    }

    const business = await getBusinessDetails(businessId)

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    return NextResponse.json({ business })
  } catch (error) {
    console.error("Error in business details API:", error)
    return NextResponse.json({ error: "Failed to fetch business details" }, { status: 500 })
  }
}
