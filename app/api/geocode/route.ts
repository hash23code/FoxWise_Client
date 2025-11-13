import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const MAPBOX_API_KEY = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || ''

// POST - Geocode an address to coordinates
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { address } = body

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    // Use Mapbox Geocoding API
    const encodedAddress = encodeURIComponent(address)
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_API_KEY}&limit=1&country=CA`

    const response = await fetch(url)
    const data = await response.json()

    if (!data.features || data.features.length === 0) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }

    const feature = data.features[0]
    const [longitude, latitude] = feature.center
    const formattedAddress = feature.place_name

    return NextResponse.json({
      latitude,
      longitude,
      formatted_address: formattedAddress,
      full_response: feature
    })
  } catch (error: any) {
    console.error('Geocode error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET - Reverse geocode coordinates to address
export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const latitude = searchParams.get('latitude')
    const longitude = searchParams.get('longitude')

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Use Mapbox Reverse Geocoding API
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_API_KEY}&limit=1`

    const response = await fetch(url)
    const data = await response.json()

    if (!data.features || data.features.length === 0) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    const feature = data.features[0]
    const formattedAddress = feature.place_name

    return NextResponse.json({
      address: formattedAddress,
      full_response: feature
    })
  } catch (error: any) {
    console.error('Reverse geocode error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
