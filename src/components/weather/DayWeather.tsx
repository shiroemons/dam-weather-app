import type { DayForecast } from "@/types";

import WeatherIcon from "./WeatherIcon";

type Props = {
  forecast: DayForecast;
  label: string;
};

export default function DayWeather({ forecast, label }: Props) {
  const maxTemp = forecast.tempMax !== null ? `${forecast.tempMax}°C` : "--";
  const minTemp = forecast.tempMin !== null ? `${forecast.tempMin}°C` : "--";

  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-white p-4 shadow-sm">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <WeatherIcon code={forecast.weatherCode} size="lg" />
      <span className="text-xs text-gray-600">{forecast.weather}</span>
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="text-red-500">{maxTemp}</span>
        <span className="text-blue-500">{minTemp}</span>
      </div>
      {forecast.precipProbability !== null && (
        <span className="text-xs text-blue-500">
          ☂{forecast.precipProbability}%
          {forecast.precipitationSum !== null && ` ${forecast.precipitationSum}mm`}
        </span>
      )}
    </div>
  );
}
