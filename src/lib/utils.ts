import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}k`;
  }
  return num.toString();
}

export function formatPrice(pricePerMillion: number): string {
  if (pricePerMillion === 0) return 'Free';
  if (pricePerMillion < 0.1) return `$${pricePerMillion.toFixed(3)} / 1M`;
  return `$${pricePerMillion.toFixed(2)} / 1M`;
}

export function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Standard rule of thumb: ~4 characters per token in English
  return Math.ceil(text.length / 4);
}
