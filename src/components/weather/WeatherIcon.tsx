import { useState } from "react";

import { getWeatherInfo, getWeatherIconUrl } from "@/lib/weatherCodes";

type Size = "sm" | "md" | "lg" | "xl";

type Props = {
  code: number;
  size?: Size;
};

const SIZE_PX: Record<Size, number> = {
  sm: 24,
  md: 40,
  lg: 56,
  xl: 80,
};

export default function WeatherIcon({ code, size = "md" }: Props) {
  const [hasError, setHasError] = useState(false);
  const { label, iconName } = getWeatherInfo(code);
  const iconUrl = getWeatherIconUrl(iconName);
  const px = SIZE_PX[size];

  if (hasError) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs font-medium dark:bg-gray-700 dark:text-gray-400"
        style={{ width: px, height: px }}
        title={label}
      >
        {label}
      </span>
    );
  }

  return <img src={iconUrl} alt={label} width={px} height={px} onError={() => setHasError(true)} />;
}
