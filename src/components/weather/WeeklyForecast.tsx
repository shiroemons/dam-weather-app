import type { WeeklyForecast as WeeklyForecastType } from "@/types";

import WeatherIcon from "./WeatherIcon";

type Props = {
  forecasts: WeeklyForecastType[];
};

const RELIABILITY_CLASS: Record<string, string> = {
  A: "text-green-500",
  B: "text-yellow-500",
  C: "text-orange-500",
};

function getDayLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ja-JP", { weekday: "short" });
}

function getDayColorClass(dateStr: string): string {
  const day = new Date(dateStr).getDay();
  if (day === 0) return "text-red-500";
  if (day === 6) return "text-blue-500";
  return "text-gray-600";
}

export default function WeeklyForecastView({ forecasts }: Props) {
  return (
    <div className="overflow-x-auto bg-white rounded-2xl shadow-sm p-4 scrollbar-hide">
      <div className="flex gap-2">
        {forecasts.map((forecast) => {
          const dayLabel = getDayLabel(forecast.date);
          const dayColorClass = getDayColorClass(forecast.date);
          const reliabilityClass = RELIABILITY_CLASS[forecast.reliability] ?? "text-gray-400";

          return (
            <div key={forecast.date} className="flex flex-col items-center min-w-[72px] gap-1">
              <span className={`text-sm font-medium ${dayColorClass}`}>{dayLabel}</span>
              <WeatherIcon code={forecast.weatherCode} size="sm" />
              <span className="text-xs">
                <span className="text-red-500">{forecast.tempMax}</span>
                {"/"}
                <span className="text-blue-500">{forecast.tempMin}</span>
              </span>
              <span className={`text-xs ${reliabilityClass}`}>{forecast.reliability}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
