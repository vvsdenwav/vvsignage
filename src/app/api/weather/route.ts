import { NextResponse } from 'next/server';
import { getOrgId } from '@/lib/tenant';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyDeviceToken } from '@/lib/deviceAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const device = verifyDeviceToken(request);
  if (!session && !device) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { searchParams } = new URL(request.url, 'http://localhost');
  const location = searchParams.get('location') || 'San Pedro, Belize';
  const latParam = searchParams.get('lat');
  const lonParam = searchParams.get('lon');
  const uParam = searchParams.get('unit');
  const unitParam = (uParam === 'c' || uParam === 'celsius') ? 'celsius' : 'fahrenheit';

  try {
    let lat = latParam;
    let lon = lonParam;
    let resolvedName = location;

    if (!lat || !lon) {
      // 1. Primary: Geocode using Open-Meteo Geocoding API (Fast, Reliable, No-Rate-Limit)
      try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl, { headers: { 'User-Agent': 'SIGNAGE/1.0' } });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.results && geoData.results.length > 0) {
            lat = geoData.results[0].latitude;
            lon = geoData.results[0].longitude;
            resolvedName = `${geoData.results[0].name}${geoData.results[0].country_code ? ', ' + geoData.results[0].country_code.toUpperCase() : ''}`;
          }
        }
      } catch (e) {
        console.warn("Open-Meteo geocoding failed, trying Nominatim fallback", e);
      }

      // 2. Fallback: Nominatim (OpenStreetMap)
      if (!lat || !lon) {
        try {
          const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
          const nomRes = await fetch(nomUrl, { headers: { 'User-Agent': 'SIGNAGE/1.0' } });
          if (nomRes.ok) {
            const nomData = await nomRes.json();
            if (nomData && nomData.length > 0) {
              lat = nomData[0].lat;
              lon = nomData[0].lon;
            }
          }
        } catch (e) {
          console.warn("Nominatim geocoding failed", e);
        }
      }

      // 3. Final Default Coords (San Pedro, Belize)
      if (!lat || !lon) {
        lat = '17.9214';
        lon = '-87.9611';
        resolvedName = location || 'San Pedro, BZ';
      }
    }

    // Fetch Weather Data from Open-Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,visibility,wind_speed_10m,is_day&temperature_unit=${unitParam}`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    if (!weatherData.current) {
      throw new Error("Invalid weather response from provider");
    }

    return NextResponse.json({
      locationName: resolvedName,
      temperature: Math.round(weatherData.current.temperature_2m),
      unit: unitParam === 'celsius' ? 'C' : 'F',
      code: weatherData.current.weather_code,
      humidity: Math.round(weatherData.current.relative_humidity_2m),
      visibility: weatherData.current.visibility,
      windSpeed: Math.round(weatherData.current.wind_speed_10m),
      isDay: weatherData.current.is_day !== undefined ? weatherData.current.is_day === 1 : true
    });

  } catch (error) {
    console.error("Weather fetch error", error);
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 });
  }
}
