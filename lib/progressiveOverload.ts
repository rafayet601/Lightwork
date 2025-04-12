/**
 * Utilities for progressive overload calculations and tracking
 */

// Types
interface ExerciseSet {
  weight: number;
  reps: number;
  rpe?: number | null;
}

interface ExerciseHistory {
  date: Date;
  sets: ExerciseSet[];
}

/**
 * Calculate One-Rep Max using Brzycki formula
 * 1RM = weight × (36 / (37 - reps))
 */
export function calculateOneRepMax(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  
  return weight * (36 / (37 - reps));
}

/**
 * Calculate total volume (weight × reps) for all sets
 */
export function calculateTotalVolume(sets: ExerciseSet[]): number {
  return sets.reduce((total, set) => total + (set.weight * set.reps), 0);
}

/**
 * Calculate average RPE for a workout
 */
export function calculateAverageRPE(sets: ExerciseSet[]): number | null {
  const setsWithRPE = sets.filter(set => set.rpe != null);
  
  if (setsWithRPE.length === 0) {
    return null;
  }
  
  const totalRPE = setsWithRPE.reduce((sum, set) => sum + (set.rpe || 0), 0);
  return totalRPE / setsWithRPE.length;
}

/**
 * Suggest weight increase based on RPE and current weight
 */
export function suggestWeightIncrease(weight: number, rpe: number | null): number {
  if (rpe === null) {
    // Default modest increase if no RPE data
    return weight * 1.025; // 2.5% increase
  }
  
  // Weight increase based on RPE
  if (rpe <= 6) {
    return weight * 1.05; // 5% increase if RPE was too easy
  } else if (rpe <= 8) {
    return weight * 1.025; // 2.5% increase if RPE was moderate
  } else {
    return weight; // No increase if RPE was high
  }
}

/**
 * Get progress data for an exercise
 */
export function getExerciseProgress(history: ExerciseHistory[]) {
  // Sort history by date
  const sortedHistory = [...history].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Calculate metrics for each workout
  const progress = sortedHistory.map(workout => {
    const maxWeight = Math.max(...workout.sets.map(set => set.weight));
    const totalVolume = calculateTotalVolume(workout.sets);
    const maxOneRepMax = Math.max(
      ...workout.sets.map(set => calculateOneRepMax(set.weight, set.reps))
    );
    
    return {
      date: workout.date,
      maxWeight,
      totalVolume,
      maxOneRepMax
    };
  });
  
  return progress;
}

/**
 * Identify if a workout set contains personal records
 */
export function identifyPersonalRecords(
  currentExercise: { name: string, sets: ExerciseSet[] },
  exerciseHistory: { name: string, date: Date, sets: ExerciseSet[] }[]
): {
  weightPR: boolean,
  repsPR: boolean,
  volumePR: boolean,
  oneRepMaxPR: boolean
} {
  // Filter history to only include matching exercise name
  const history = exerciseHistory.filter(h => h.name === currentExercise.name);
  
  if (history.length === 0) {
    // First time doing this exercise, all sets are PRs
    return {
      weightPR: true,
      repsPR: true,
      volumePR: true,
      oneRepMaxPR: true
    };
  }
  
  // Get all sets from history
  const allHistoricalSets = history.flatMap(h => h.sets);
  
  // Get current best values
  const currentSets = currentExercise.sets;
  
  // Find previous best values
  const prevMaxWeight = Math.max(...allHistoricalSets.map(set => set.weight));
  const prevMaxReps = Math.max(...allHistoricalSets.map(set => set.reps));
  const prevMaxVolume = Math.max(...allHistoricalSets.map(set => set.weight * set.reps));
  const prevMaxOneRepMax = Math.max(
    ...allHistoricalSets.map(set => calculateOneRepMax(set.weight, set.reps))
  );
  
  // Calculate current best values
  const currentMaxWeight = Math.max(...currentSets.map(set => set.weight));
  const currentMaxReps = Math.max(...currentSets.map(set => set.reps));
  const currentMaxVolume = Math.max(...currentSets.map(set => set.weight * set.reps));
  const currentMaxOneRepMax = Math.max(
    ...currentSets.map(set => calculateOneRepMax(set.weight, set.reps))
  );
  
  // Compare to determine PRs
  return {
    weightPR: currentMaxWeight > prevMaxWeight,
    repsPR: currentMaxReps > prevMaxReps,
    volumePR: currentMaxVolume > prevMaxVolume,
    oneRepMaxPR: currentMaxOneRepMax > prevMaxOneRepMax
  };
} 