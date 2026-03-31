import type { Dam } from "@/types/dam";
import type { PrefectureWeather } from "@/types/weather";

import DamCard from "./DamCard";

type Props = {
  dams: Dam[];
  weather: PrefectureWeather | undefined;
};

export default function DamCardGrid({ dams, weather }: Props): JSX.Element {
  if (dams.length === 0) {
    return (
      <p className="py-12 text-center text-gray-500">ダムが見つかりません</p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {dams.map((dam) => {
        const areaWeather = weather?.areas.find(
          (area) => area.areaCode === dam.jmaAreaCode,
        );
        return <DamCard key={dam.id} dam={dam} weather={areaWeather} />;
      })}
    </div>
  );
}
