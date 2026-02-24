import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const vibrate = (pattern: number | number[] = 50) => {
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    if (window.innerWidth < 768) {
      navigator.vibrate(pattern);
    }
  }
};

export const hapticFeedback = {
  success: () => vibrate([30, 50, 30]),
  light: () => vibrate(10),
  medium: () => vibrate(30),
  heavy: () => vibrate(50),
  error: () => vibrate([50, 50, 50, 50, 50]),
};

export const getDynamicGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 5) return "Up late, building momentum.";
  if (hour < 12) return "Good morning. Let's build momentum.";
  if (hour < 17) return "Good afternoon. Keep the momentum going.";
  if (hour < 22) return "Good evening. Time to reflect.";
  return "Time to wind down.";
};

export const calculateMomentumScore = (habits: { streak: number, completed: boolean }[], expenses: number, budget: number) => {
  // Base score from streaks
  const streakScore = habits.reduce((acc, habit) => acc + (habit.streak * 10) + (habit.completed ? 15 : 0), 0);
  // Bonus score if staying under budget (normalized to a reasonable curve)
  const budgetRatio = expenses / budget;
  const budgetScore = budgetRatio < 1 ? Math.floor((1 - budgetRatio) * 300) : -50;

  return streakScore + budgetScore + 250; // Starting baseline of 250
};
