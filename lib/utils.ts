import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency Formatter - Defaulted to VND
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// Safe Date Formatter
export function formatDate(dateString: string | Date | undefined | null) {
  if (!dateString) return "N/A";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateString));
  } catch (e) {
    return "Invalid Date";
  }
}

// Deep Serialization for Firebase Data (Strips non-plain objects)
export function serializeFirestoreData(data: any): any {
  if (data === null || data === undefined) return data;

  // Handle Firebase Timestamp
  if (typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map(item => serializeFirestoreData(item));
  }

  // Handle regular Objects
  if (typeof data === 'object') {
    const serialized: any = {};
    for (const key in data) {
      serialized[key] = serializeFirestoreData(data[key]);
    }
    return serialized;
  }

  // Return primitive types
  return data;
}

// Định dạng số đếm thông thường (VD: 1.000.000)
export function formatNumber(number: number) {
  return new Intl.NumberFormat("vi-VN").format(number);
}

// Transaction Category Labels (Ecosystem-wide constants)
export const CATEGORY_LABELS: Record<string, string> = {
  FOOD_DRINK: "Ăn uống",
  SHOPPING: "Mua sắm",
  TRANSPORT: "Di chuyển",
  ENTERTAINMENT: "Giải trí",
  BILL_UTILITIES: "Hóa đơn",
  TRANSFER: "Chuyển tiền",
  OTHER: "Khác",
}
export function getCategoryLabel(category?: string): string {
  return CATEGORY_LABELS[category || "OTHER"] || CATEGORY_LABELS.OTHER
}