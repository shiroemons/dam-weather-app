import type { Dam } from "@/types/dam";
import type { DamWeather } from "@/types/weather";

import DayWeather from "@/components/weather/DayWeather";

type Props = {
  dam: Dam;
  weather: DamWeather | undefined;
};

export default function DamCard({ dam, weather }: Props) {
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
        <div className="mt-4 flex gap-3">
          <div className="flex-1">
            <DayWeather forecast={weather.today} label="今日" />
          </div>
          <div className="flex-1">
            <DayWeather forecast={weather.tomorrow} label="明日" />
          </div>
        </div>
      )}
    </div>
  );
}
