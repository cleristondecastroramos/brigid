import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type FaixaPop = "__all" | "ate_5k" | "5k_10k" | "10k_20k" | "acima_20k";

export function getFaixaPopulacional(pop: number): FaixaPop {
  if (pop <= 5000) return "ate_5k";
  if (pop <= 10000) return "5k_10k";
  if (pop <= 20000) return "10k_20k";
  return "acima_20k";
}
