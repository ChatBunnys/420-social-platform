import type { AgeVerificationState } from "@/types";
import { create } from "zustand";

const STORAGE_KEY = "ageVerification";
const MIN_AGE = 21;

interface AgeVerificationStore {
  isVerified: boolean;
  checkVerification: () => boolean;
  verify: () => void;
  reset: () => void;
}

function loadFromStorage(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as AgeVerificationState;
    // Verification valid for 1 year
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    return data.verified && Date.now() - data.timestamp < oneYear;
  } catch {
    return false;
  }
}

export function calculateAge(month: number, day: number, year: number): number {
  const today = new Date();
  const birthDate = new Date(year, month - 1, day);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function isAgeValid(month: number, day: number, year: number): boolean {
  return calculateAge(month, day, year) >= MIN_AGE;
}

export const useAgeVerificationStore = create<AgeVerificationStore>((set) => ({
  isVerified: loadFromStorage(),

  checkVerification: () => {
    const verified = loadFromStorage();
    set({ isVerified: verified });
    return verified;
  },

  verify: () => {
    const data: AgeVerificationState = {
      verified: true,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    set({ isVerified: true });
  },

  reset: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ isVerified: false });
  },
}));

export { MIN_AGE };
