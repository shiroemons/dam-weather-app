import type { Dam } from "@/types/dam";
import type { DamWeather } from "@/types/weather";

import { MapPin, Waves, Box } from "lucide-react";
import DayWeather from "@/components/weather/DayWeather";

type Props = {
  dam: Dam;
  weather: DamWeather | undefined;
};

export default function DamCard({ dam, weather }: Props) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white p-5 shadow-[6px_6px_12px_#d1d5db,-6px_-6px_12px_#ffffff]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-lg font-semibold text-gray-900">{dam.damName}</p>
        <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600 shadow-sm">
          {dam.damType}
        </span>
      </div>

      <div className="mt-2 space-y-1">
        {dam.address && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin className="size-3.5 shrink-0 text-rose-400" />
            <span>{dam.address}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Waves className="size-3.5 shrink-0 text-blue-400" />
          <span>{dam.riverName}</span>
        </div>
        {dam.totalStorageCapacity != null && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Box className="size-3.5 shrink-0 text-emerald-400" />
            <span>{dam.totalStorageCapacity.toLocaleString()}万m³</span>
          </div>
        )}
      </div>

      {weather === undefined ? (
        <div className="mt-4 rounded-xl bg-gray-100/50 px-4 py-6 text-center text-sm text-gray-500">
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
