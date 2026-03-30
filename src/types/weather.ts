export interface DayForecast {
  date: string;
  weatherCode: string;
  weather: string;
  tempMax: string | null;
  tempMin: string | null;
  precipProbability: string | null;
}

export interface WeeklyForecast {
  date: string;
  weatherCode: string;
  tempMax: string;
  tempMin: string;
  reliability: string;
}

export interface AreaWeather {
  areaCode: string;
  areaName: string;
  today: DayForecast;
  tomorrow: DayForecast;
  weekly: WeeklyForecast[];
  publishedAt: string;
}

export interface PrefectureWeather {
  prefectureSlug: string;
  updatedAt: string;
  areas: AreaWeather[];
}
