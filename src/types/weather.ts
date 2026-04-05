import type { WeatherCategory } from "@/lib/weatherColors";

export interface DayForecast {
  date: string;
  weatherCode: number;
  weather: string;
  tempMax: number | null;
  tempMin: number | null;
  precipProbability: number | null;
  precipitationSum: number | null;
}

export interface DamWeather {
  damId: string;
  today: DayForecast;
  tomorrow: DayForecast;
}

export interface PrefectureWeather {
  prefectureSlug: string;
  updatedAt: string;
  distribution?: Record<WeatherCategory, number>;
  dams: DamWeather[];
}
