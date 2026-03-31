import { useState } from "react";

import { getWeatherInfo } from "@/lib/weatherCodes";

type Size = "sm" | "md" | "lg";

type Props = {
  code: string;
  size?: Size;
};

const SIZE_PX: Record<Size, number> = {
  sm: 24,
  md: 40,
  lg: 56,
};

export default function WeatherIcon({ code, size = "md" }: Props): JSX.Element {
  const [hasError, setHasError] = useState(false);
  const { label, iconUrl } = getWeatherInfo(code);
  const px = SIZE_PX[size];

  if (hasError) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs font-medium"
        style={{ width: px, height: px }}
        title={label}
      >
        {label}
      </span>
    );
  }

  return (
    <img
      src={iconUrl}
      alt={label}
      width={px}
      height={px}
      onError={() => setHasError(true)}
    />
  );
}
