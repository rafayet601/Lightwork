type ExerciseHistory = {
  date: Date;
  sets: {
    weight: number;
    reps: number;
  }[];
}[];

/**
 * Calculate the one-rep max (1RM) using the Brzycki formula
 * 1RM = weight × (36 / (37 - reps))
 */
export function calculateOneRepMax(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (36 / (37 - reps));
}

/**
 * Calculate the volume (total weight lifted) for a set
 */
export function calculateVolume(weight: number, reps: number): number {
  return weight * reps;
}

/**
 * Calculate the total volume for a workout
 */
export function calculateTotalVolume(sets: { weight: number; reps: number }[]): number {
  return sets.reduce((total, set) => total + calculateVolume(set.weight, set.reps), 0);
}

/**
 * Get the highest weight used for a specific exercise
 */
export function getHighestWeight(history: ExerciseHistory): number {
  let highest = 0;
  
  for (const workout of history) {
    for (const set of workout.sets) {
      if (set.weight > highest) {
        highest = set.weight;
      }
    }
  }
  
  return highest;
}

/**
 * Get the suggested weight increase for progressive overload
 * This uses a simple algorithm that suggests increasing by:
 * - 2.5kg/5lbs for exercises under 20kg/45lbs
 * - 5kg/10lbs for exercises between 20-50kg/45-110lbs
 * - 2.5kg/5lbs for exercises over 50kg/110lbs
 */
export function getSuggestedWeightIncrease(currentWeight: number): number {
  if (currentWeight < 20) {
    return 2.5;
  } else if (currentWeight < 50) {
    return 5;
  } else {
    return 2.5;
  }
}

/**
 * Get progress data for an exercise
 */
export function getExerciseProgress(history: ExerciseHistory) {
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