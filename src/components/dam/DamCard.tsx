import { useState } from "react";

import type { Dam } from "@/types/dam";
import type { AreaWeather } from "@/types/weather";

import DayWeather from "@/components/weather/DayWeather";
import WeeklyForecastView from "@/components/weather/WeeklyForecast";

type Props = {
  dam: Dam;
  weather: AreaWeather | undefined;
};

export default function DamCard({ dam, weather }: Props): JSX.Element {
  const [isWeeklyOpen, setIsWeeklyOpen] = useState(false);

  return (
    <div className="rounded-2xl bg-white shadow-sm p-5">
      <p className="text-lg font-semibold text-gray-900">{dam.damName}</p>
      <p className="mt-0.5 text-sm text-gray-500">
        {dam.riverName} | {dam.damType}
      </p>

      {weather === undefined ? (
        <div className="mt-4 rounded-xl bg-gray-100 px-4 py-6 text-center text-sm text-gray-500">
          天気情報を取得できません
        </div>
      ) : (
        <>
          <div className="mt-4 flex gap-3">
            <div className="flex-1">
              <DayWeather forecast={weather.today} label="今日" />
            </div>
            <div className="flex-1">
              <DayWeather forecast={weather.tomorrow} label="明日" />
            </div>
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() => setIsWeeklyOpen((prev) => !prev)}
              className="flex w-full items-center justify-between px-1 py-2 text-sm font-medium text-gray-700"
            >
              <span>週間予報</span>
              <span
                className="text-gray-400 transition-transform duration-200"
                style={{ transform: isWeeklyOpen ? "rotate(90deg)" : "rotate(0deg)" }}
              >
                ▶
              </span>
            </button>

            {isWeeklyOpen && (
              <div className="mt-2">
                <WeeklyForecastView forecasts={weather.weekly} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
