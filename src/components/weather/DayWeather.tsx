import type { DayForecast } from "@/types";

import WeatherIcon from "./WeatherIcon";

type Props = {
  forecast: DayForecast;
  label: string;
  size?: "sm" | "lg";
};

export default function DayWeather({ forecast, label, size = "sm" }: Props) {
  const maxTemp = forecast.tempMax !== null ? `${forecast.tempMax}°C` : "--";
  const minTemp = forecast.tempMin !== null ? `${forecast.tempMin}°C` : "--";

  if (size === "lg") {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-border-secondary bg-surface-elevated p-5">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        <WeatherIcon code={forecast.weatherCode} size="xl" />
        <span className="text-sm text-text-secondary">{forecast.weather}</span>
        <div className="flex items-center gap-3 font-mono text-xl font-bold">
          <span className="text-red-500">{maxTemp}</span>
          <span className="text-blue-500">{minTemp}</span>
        </div>
        {forecast.precipProbability !== null && (
          <span className="text-sm font-medium text-accent">
            ☂ {forecast.precipProbability}%
            {forecast.precipitationSum !== null && ` ${forecast.precipitationSum}mm`}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-secondary bg-surface-elevated p-3">
      <p className="mb-2 border-b border-border-secondary pb-1 text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
        {label}
      </p>
      <div className="flex items-center justify-between">
        <WeatherIcon code={forecast.weatherCode} size="md" />
        <div className="text-right">
          <p className="font-mono text-sm font-bold text-text-primary">{maxTemp}</p>
          <p className="font-mono text-[11px] text-text-tertiary">{minTemp}</p>
        </div>
      </div>
      {forecast.precipProbability !== null && (
        <p className="mt-1.5 text-right text-[10px] font-medium text-accent">
          ☂ {forecast.precipProbability}%
          {forecast.precipitationSum !== null && ` / ${forecast.precipitationSum}mm`}
        </p>
      )}
    </div>
  );
}
