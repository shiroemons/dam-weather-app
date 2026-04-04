import type { Dam } from "@/types/dam";
import type { DamStorage, PrefectureStorage } from "@/types/storage";
import type { DamWeather, PrefectureWeather } from "@/types/weather";

import DamCard from "./DamCard";

type Props = {
  dams: Dam[];
  weather: PrefectureWeather | undefined;
  storage?: PrefectureStorage;
};

export default function DamCardGrid({ dams, weather, storage }: Props) {
  if (dams.length === 0) {
    return (
      <p className="py-12 text-center text-gray-500 dark:text-gray-400">ダムが見つかりません</p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {dams.map((dam) => {
        const damWeather: DamWeather | undefined = weather?.dams.find((dw) => dw.damId === dam.id);
        const damStorage: DamStorage | undefined = storage?.dams.find((ds) => ds.damId === dam.id);
        return <DamCard key={dam.id} dam={dam} weather={damWeather} storage={damStorage} />;
      })}
    </div>
  );
}
