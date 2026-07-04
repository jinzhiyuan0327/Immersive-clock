import type { VercelRequest, VercelResponse } from '@vercel/node';

const WMO_TEXT: Record<number, string> = {
  0: '晴', 1: '晴', 2: '多云', 3: '阴',
  45: '雾', 48: '冻雾',
  51: '小雨', 53: '小雨', 55: '中雨',
  61: '小雨', 63: '中雨', 65: '大雨',
  71: '小雪', 73: '中雪', 75: '大雪', 77: '小雪',
  80: '阵雨', 81: '阵雨', 82: '暴雨',
  85: '阵雪', 86: '阵雪',
  95: '雷阵雨', 96: '雷阵雨伴有冰雹', 99: '雷阵雨伴有冰雹',
};
const WMO_ICON: Record<number, string> = {
  0: '100', 1: '100', 2: '101', 3: '104',
  45: '501', 48: '501',
  51: '305', 53: '305', 55: '306',
  61: '305', 63: '306', 65: '307',
  71: '400', 73: '401', 75: '402', 77: '400',
  80: '300', 81: '301', 82: '302',
  85: '406', 86: '407',
  95: '304', 96: '304', 99: '304',
};
function wmoText(code: number) { return WMO_TEXT[code] ?? '未知'; }
function wmoIcon(code: number) { return WMO_ICON[code] ?? '999'; }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon are required' });

  const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
  weatherUrl.searchParams.set('latitude', String(lat));
  weatherUrl.searchParams.set('longitude', String(lon));
  weatherUrl.searchParams.set('current', [
    'temperature_2m','apparent_temperature','relative_humidity_2m',
    'weather_code','wind_speed_10m','wind_direction_10m',
    'precipitation','surface_pressure','visibility','is_day',
  ].join(','));
  weatherUrl.searchParams.set('hourly', ['temperature_2m','weather_code','precipitation_probability'].join(','));
  weatherUrl.searchParams.set('daily', [
    'weather_code','temperature_2m_max','temperature_2m_min','sunrise','sunset','precipitation_probability_max',
  ].join(','));
  weatherUrl.searchParams.set('minutely_15', 'precipitation');
  weatherUrl.searchParams.set('forecast_days', '3');
  weatherUrl.searchParams.set('timezone', 'auto');
  weatherUrl.searchParams.set('wind_speed_unit', 'kmh');

  const airUrl = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
  airUrl.searchParams.set('latitude', String(lat));
  airUrl.searchParams.set('longitude', String(lon));
  airUrl.searchParams.set('current', 'pm2_5,pm10,nitrogen_dioxide,ozone,european_aqi');
  airUrl.searchParams.set('timezone', 'auto');

  try {
    const [weatherResp, airResp] = await Promise.allSettled([
      fetch(weatherUrl.toString(), { signal: AbortSignal.timeout(6000) }),
      fetch(airUrl.toString(), { signal: AbortSignal.timeout(6000) }),
    ]);
    if (weatherResp.status === 'rejected' || !weatherResp.value.ok) throw new Error('Open-Meteo weather API failed');
    const weather = await weatherResp.value.json() as any;
    const airData = airResp.status === 'fulfilled' && airResp.value.ok ? await airResp.value.json() as any : null;
    const cur = weather.current;
    const code = cur.weather_code as number;
    const now = new Date().toISOString();
    const currentWeather = {
      obsTime: now, text: wmoText(code), icon: wmoIcon(code),
      temp: String(Math.round(cur.temperature_2m)),
      feelsLike: String(Math.round(cur.apparent_temperature)),
      humidity: String(Math.round(cur.relative_humidity_2m)),
      pressure: String(Math.round(cur.surface_pressure ?? 0)),
      vis: cur.visibility != null ? String(Math.round(cur.visibility / 1000)) : undefined,
      windDir: String(Math.round(cur.wind_direction_10m ?? 0)),
      windSpeed: String(Math.round(cur.wind_speed_10m)),
      isDay: cur.is_day === 1,
    };
    const daily = (weather.daily?.time as string[] ?? []).slice(0, 3).map((date: string, i: number) => {
      const dcode = weather.daily.weather_code[i] as number;
      return {
        fxDate: date,
        sunrise: weather.daily.sunrise?.[i]?.split('T')[1],
        sunset: weather.daily.sunset?.[i]?.split('T')[1],
        tempMax: String(Math.round(weather.daily.temperature_2m_max[i])),
        tempMin: String(Math.round(weather.daily.temperature_2m_min[i])),
        iconDay: wmoIcon(dcode), textDay: wmoText(dcode),
        iconNight: wmoIcon(dcode), textNight: wmoText(dcode),
      };
    });
    const astronomySun = {
      sunrise: weather.daily?.sunrise?.[0]?.split('T')[1] ?? null,
      sunset: weather.daily?.sunset?.[0]?.split('T')[1] ?? null,
    };
    const hourly = (weather.hourly?.time as string[] ?? []).slice(0, 72).map((t: string, i: number) => {
      const hcode = weather.hourly.weather_code[i] as number;
      return { fxTime: t, temp: String(Math.round(weather.hourly.temperature_2m[i])),
        icon: wmoIcon(hcode), text: wmoText(hcode),
        pop: String(weather.hourly.precipitation_probability?.[i] ?? 0) };
    });
    const minutely15 = (weather.minutely_15?.precipitation as number[] ?? []).slice(0, 60);
    const baseMs = Date.now();
    const minutely = minutely15.map((precip: number, i: number) => ({
      fxTime: new Date(baseMs + i * 15 * 60 * 1000).toISOString(),
      precip: String(precip), type: 'rain',
    }));
    const precipSum = minutely15.reduce((a: number, b: number) => a + b, 0);
    const airQuality = airData ? {
      aqi: airData.current?.european_aqi ?? null,
      pm25: airData.current?.pm2_5 ?? null,
      pm10: airData.current?.pm10 ?? null,
      no2: airData.current?.nitrogen_dioxide ?? null,
      o3: airData.current?.ozone ?? null,
    } : null;
    return res.status(200).json({
      ok: true, updatedAt: now, timezone: weather.timezone,
      current: currentWeather, daily, astronomySun, hourly,
      minutely: { summary: precipSum > 0 ? '预计有降水' : '预计无降水', data: minutely },
      airQuality,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}