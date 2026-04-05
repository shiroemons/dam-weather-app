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
