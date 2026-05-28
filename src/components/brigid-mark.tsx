import { cn } from "@/lib/utils";

interface BrigidMarkProps {
  className?: string;
  size?: number;
}

/**
 * BRIGID — monograma institucional.
 * Forma abstrata: um "B" estilizado dentro de um escudo arredondado,
 * remetendo a proteção, rede e centralidade dos dados.
 */
export function BrigidMark({ className, size = 36 }: BrigidMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="brigid-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.75" />
        </linearGradient>
      </defs>
      <path
        d="M24 3 L42 9 V24 C42 34 34 42 24 45 C14 42 6 34 6 24 V9 Z"
        fill="url(#brigid-grad)"
      />
      <path
        d="M18 14 H26 C29.3 14 32 16.2 32 19.2 C32 21 31 22.5 29.4 23.4 C31.4 24.2 32.8 25.9 32.8 28.2 C32.8 31.5 30 34 26.4 34 H18 Z M21.6 17.2 V22.2 H25.6 C27 22.2 28.2 21.2 28.2 19.7 C28.2 18.2 27 17.2 25.6 17.2 Z M21.6 25.2 V30.8 H26 C27.7 30.8 29 29.6 29 28 C29 26.4 27.7 25.2 26 25.2 Z"
        fill="var(--color-sidebar)"
      />
    </svg>
  );
}
