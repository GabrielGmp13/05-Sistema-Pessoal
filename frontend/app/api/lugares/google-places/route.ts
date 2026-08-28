import { NextRequest, NextResponse } from 'next/server'

import { getApiUser } from '@/lib/server/supabase'

interface PlaceComponent { longText?: string; types?: string[] }
interface GooglePlace {
  id?: string
  displayName?: { text?: string }
  formattedAddress?: string
  location?: { latitude?: number; longitude?: number }
  googleMapsUri?: string
  primaryTypeDisplayName?: { text?: string }
  addressComponents?: PlaceComponent[]
}

function componente(place: GooglePlace, tipo: string) {
  return place.addressComponents?.find((item) => item.types?.includes(tipo))?.longText ?? null
}

export async function POST(request: NextRequest) {
  const user = await getApiUser()
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim()
  if (!apiKey) return NextResponse.json({ erro: 'Busca do Google Places não configurada no servidor.' }, { status: 503 })
  const body = await request.json().catch(() => null) as { busca?: unknown } | null
  const busca = typeof body?.busca === 'string' ? body.busca.trim() : ''
  if (busca.length < 2 || busca.length > 160) return NextResponse.json({ erro: 'Digite entre 2 e 160 caracteres.' }, { status: 400 })

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.primaryTypeDisplayName,places.addressComponents',
      },
      body: JSON.stringify({ textQuery: busca, languageCode: 'pt-BR', regionCode: 'BR', maxResultCount: 8 }),
      signal: AbortSignal.timeout(10_000),
    })
    const data = await response.json().catch(() => null) as { places?: GooglePlace[]; error?: { message?: string } } | null
    if (!response.ok) throw new Error(data?.error?.message || `Google Places respondeu com status ${response.status}.`)
    return NextResponse.json({ resultados: (data?.places ?? []).map((place) => ({
      id: place.id ?? '', nome: place.displayName?.text ?? '', endereco: place.formattedAddress ?? '',
      latitude: place.location?.latitude ?? null, longitude: place.location?.longitude ?? null,
      mapsUrl: place.googleMapsUri ?? null, tipo: place.primaryTypeDisplayName?.text ?? null,
      cidade: componente(place, 'locality') ?? componente(place, 'administrative_area_level_2'),
      pais: componente(place, 'country'),
    })).filter((place) => place.id && place.nome) })
  } catch (error) {
    console.error('[google-places-search]', { message: error instanceof Error ? error.message : 'Erro desconhecido' })
    return NextResponse.json({ erro: 'Não foi possível pesquisar no Google Places.' }, { status: 502 })
  }
}
