import { Link } from "@tanstack/react-router";

import WatchlistAddButton from "@/components/watchlist/WatchlistAddButton";
import WeatherIcon from "@/components/weather/WeatherIcon";
import type { Dam } from "@/types/dam";
import type { DamWeather } from "@/types/weather";

type Props = {
  dam: Dam;
  weather?: DamWeather;
};

export default function DamMarkerPopup({ dam, weather }: Props) {
  return (
    <div className="min-w-48">
      <Link
        to="/dam/$damId"
        params={{ damId: dam.id }}
        className="text-sm font-semibold text-blue-600 hover:text-blue-800"
      >
        {dam.damName}
      </Link>
      <p className="mt-0.5 text-xs text-gray-500">
        {dam.prefecture} {dam.municipality}
      </p>
      {dam.damType && (
        <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
          {dam.damType}
        </span>
      )}
      {weather && (
        <div className="mt-2 flex items-center gap-2 border-t border-gray-200 pt-2">
          <WeatherIcon code={weather.today.weatherCode} size="sm" />
          <div className="text-xs">
            <p className="font-medium">{weather.today.weather}</p>
            {weather.today.tempMax != null && weather.today.tempMin != null && (
              <p>
                <span className="text-red-500">{weather.today.tempMax}°</span>
                {" / "}
                <span className="text-blue-500">{weather.today.tempMin}°</span>
              </p>
            )}
          </div>
        </div>
      )}
      <div className="mt-2 border-t border-gray-200 pt-2">
        <WatchlistAddButton damId={dam.id} variant="icon" />
      </div>
    </div>
  );
}
