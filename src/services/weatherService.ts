import type {
  AddressInfo, AirQualityCurrentResponse, AstronomySunResponse,
  CityLookupResponse, Coords, GeolocationDiagnostics, GeolocationPermissionState,
  GeolocationResult, MinutelyPrecipResponse, WeatherHourly72hResponse,
  WeatherAlertResponse, WeatherDaily3dResponse, WeatherNow,
} from '../types/weather';
import {
  buildLocationFlow, getCoordsViaGeolocation, getCoordsViaIP, getCoordsViaAmapIP,
  getGeolocationResult, reverseGeocodeOSM, reverseGeocodeAmap, fetchCityLookup,
  type LocationFlowOptions,
} from './locationService';

export type { AddressInfo, AirQualityCurrentResponse, AstronomySunResponse, CityLookupResponse,
  Coords, GeolocationDiagnostics, GeolocationPermissionState, GeolocationResult,
  MinutelyPrecipResponse, LocationFlowOptions, WeatherHourly72hResponse,
  WeatherAlertResponse, WeatherDaily3dResponse, WeatherNow };
export { buildLocationFlow, fetchCityLookup, getCoordsViaAmapIP, getCoordsViaGeolocation,
  getCoordsViaIP, getGeolocationResult, reverseGeocodeAmap, reverseGeocodeOSM };

interface OpenMeteoAllData {
  ok: boolean; updatedAt: string; timezone: string;
  current: { obsTime: string; text: string; icon: string; temp: string; feelsLike: string;
    humidity: string; pressure: string; vis?: string; windDir: string; windSpeed: string; isDay: boolean; };
  daily: Array<{ fxDate: string; sunrise?: string; sunset?: string; tempMax: string; tempMin: string;
    iconDay: string; textDay: string; iconNight: string; textNight: string; }>;
  astronomySun: { sunrise: string | null; sunset: string | null };
  hourly: Array<{ fxTime: string; temp: string; icon: string; text: string; pop: string }>;
  minutely: { summary: string; data: Array<{ fxTime: string; precip: string; type: string }> };
  airQuality: { aqi: number|null; pm25: number|null; pm10: number|null; no2: number|null; o3: number|null } | null;
  error?: string;
}

let _cachedData: OpenMeteoAllData | null = null;
let _cachedCoords: Coords | null = null;
let _cachedAt = 0;
const CACHE_TTL_MS = 10 * 60 * 1000;

async function fetchAllWeather(coords: Coords): Promise<OpenMeteoAllData> {
  const isSameLocation = _cachedCoords &&
    Math.abs(_cachedCoords.lat - coords.lat) < 0.01 && Math.abs(_cachedCoords.lon - coords.lon) < 0.01;
  if (_cachedData && isSameLocation && Date.now() - _cachedAt < CACHE_TTL_MS) return _cachedData;
  const res = await fetch(`/api/weather?lat=${coords.lat}&lon=${coords.lon}`, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Weather API HTTP ${res.status}`);
  const data = (await res.json()) as OpenMeteoAllData;
  if (!data.ok) throw new Error(data.error ?? 'Weather API error');
  _cachedData = data; _cachedCoords = coords; _cachedAt = Date.now();
  return data;
}

function parseLocation(location: string): Coords | null {
  const [lonStr, latStr] = location.split(',');
  const lon = parseFloat(lonStr), lat = parseFloat(latStr);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

export async function fetchWeatherNow(location: string): Promise<WeatherNow> {
  try {
    const coords = parseLocation(location); if (!coords) return { error: 'Invalid location' };
    const data = await fetchAllWeather(coords); const c = data.current;
    return { code: '200', now: { obsTime: c.obsTime, text: c.text, icon: c.icon, temp: c.temp,
      feelsLike: c.feelsLike, humidity: c.humidity, pressure: c.pressure, vis: c.vis,
      windDir: c.windDir, windSpeed: c.windSpeed }, refer: { sources: ['Open-Meteo'] } };
  } catch (e) { return { error: String(e) }; }
}

export async function fetchWeatherDaily3d(location: string): Promise<WeatherDaily3dResponse> {
  try {
    const coords = parseLocation(location); if (!coords) return { error: 'Invalid location' };
    const data = await fetchAllWeather(coords);
    return { code: '200', updateTime: data.updatedAt, daily: data.daily, refer: { sources: ['Open-Meteo'] } };
  } catch (e) { return { error: String(e) }; }
}

export async function fetchAstronomySun(location: string, _date: string): Promise<AstronomySunResponse> {
  try {
    const coords = parseLocation(location); if (!coords) return { error: 'Invalid location' };
    const data = await fetchAllWeather(coords);
    return { code: '200', sunrise: data.astronomySun.sunrise ?? undefined, sunset: data.astronomySun.sunset ?? undefined, refer: { sources: ['Open-Meteo'] } };
  } catch (e) { return { error: String(e) }; }
}

export async function fetchAirQualityCurrent(lat: number, lon: number): Promise<AirQualityCurrentResponse> {
  try {
    const data = await fetchAllWeather({ lat, lon }); const aq = data.airQuality;
    if (!aq) return { error: 'Air quality data unavailable' };
    return {
      metadata: { tag: data.updatedAt, sources: ['Open-Meteo'] },
      indexes: [{ code: 'eu-eea-1h-eaqi', name: 'European AQI', aqi: aq.aqi ?? undefined }],
      pollutants: [
        aq.pm25 != null && { code: 'pm25', concentration: { value: aq.pm25, unit: 'μg/m3' } },
        aq.pm10 != null && { code: 'pm10', concentration: { value: aq.pm10, unit: 'μg/m3' } },
        aq.no2  != null && { code: 'no2',  concentration: { value: aq.no2,  unit: 'μg/m3' } },
        aq.o3   != null && { code: 'o3',   concentration: { value: aq.o3,   unit: 'μg/m3' } },
      ].filter(Boolean) as AirQualityCurrentResponse['pollutants'],
    };
  } catch (e) { return { error: String(e) }; }
}

export async function fetchWeatherAlertsByCoords(_lat: number, _lon: number): Promise<WeatherAlertResponse> {
  return { metadata: { zeroResult: true }, alerts: [] };
}

export async function fetchMinutelyPrecip(location: string): Promise<MinutelyPrecipResponse> {
  try {
    const coords = parseLocation(location); if (!coords) return { error: 'Invalid location' };
    const data = await fetchAllWeather(coords);
    return { code: '200', updateTime: data.updatedAt, summary: data.minutely.summary, minutely: data.minutely.data };
  } catch (e) { return { error: String(e) }; }
}

export async function fetchWeatherHourly72h(location: string): Promise<WeatherHourly72hResponse> {
  try {
    const coords = parseLocation(location); if (!coords) return { error: 'Invalid location' };
    const data = await fetchAllWeather(coords);
    return { code: '200', updateTime: data.updatedAt, hourly: data.hourly, refer: { sources: ['Open-Meteo'] } };
  } catch (e) { return { error: String(e) }; }
}

export interface WeatherFlowOptions extends LocationFlowOptions { fetchDaily3d?: boolean; fetchAstronomySun?: boolean; fetchAirQuality?: boolean; }

export async function buildWeatherFlow(options?: WeatherFlowOptions) {
  const loc = await buildLocationFlow(options);
  if (!loc.coords) return { coords: null, coordsSource: null };
  const { lat, lon } = loc.coords;
  const locationStr = `${lon},${lat}`;
  const today = new Date().toISOString().split('T')[0];
  const [weather, daily3d, astronomySun, airQuality] = await Promise.all([
    fetchWeatherNow(locationStr),
    options?.fetchDaily3d !== false ? fetchWeatherDaily3d(locationStr) : Promise.resolve(null),
    options?.fetchAstronomySun !== false ? fetchAstronomySun(locationStr, today) : Promise.resolve(null),
    options?.fetchAirQuality !== false ? fetchAirQualityCurrent(lat, lon) : Promise.resolve(null),
  ]);
  return { coords: loc.coords, coordsSource: loc.coordsSource, city: loc.city, addressInfo: loc.addressInfo, weather, daily3d, astronomySun, airQuality };
}