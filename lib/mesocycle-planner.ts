/**
 * Mesocycle Planning and Periodization System
 * Helps users progress from current max to target goal through structured programming
 */

import { z } from 'zod'
import { calculateOneRepMax } from './progressiveOverload'

// Types and Schemas
export const TrainingGoalSchema = z.object({
  exercise: z.string().min(1),
  currentMax: z.number().min(1),
  targetMax: z.number().min(1),
  currentMaxReps: z.number().min(1).max(20).default(1),
  timeframe: z.number().min(4).max(52).default(16), // weeks
  trainingDays: z.number().min(1).max(7).default(3),
  experience: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  method: z.enum(['linear', 'undulating', 'block']).default('linear')
})

export const MesocycleSchema = z.object({
  id: z.string(),
  name: z.string(),
  exercise: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  weeks: z.array(z.object({
    week: z.number(),
    type: z.enum(['build', 'intensify', 'deload', 'test']),
    sessions: z.array(z.object({
      day: z.number(),
      sets: z.number(),
      reps: z.number().or(z.array(z.number())),
      intensity: z.number(), // percentage of 1RM
      rpe: z.number().optional(),
      notes: z.string().optional()
    }))
  })),
  currentMax: z.number(),
  targetMax: z.number(),
  projectedMax: z.number()
})

export type TrainingGoal = z.infer<typeof TrainingGoalSchema>
export type Mesocycle = z.infer<typeof MesocycleSchema>

// Periodization Templates
export class MesocyclePlanner {
  private goal: TrainingGoal

  constructor(goal: TrainingGoal) {
    this.goal = TrainingGoalSchema.parse(goal)
  }

  /**
   * Generate a complete mesocycle plan
   */
  generateMesocycle(): Mesocycle {
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + (this.goal.timeframe * 7 * 24 * 60 * 60 * 1000))
    
    let weeks: Mesocycle['weeks'] = []
    
    switch (this.goal.method) {
      case 'linear':
        weeks = this.generateLinearPeriodization()
        break
      case 'undulating':
        weeks = this.generateUndulatingPeriodization()
        break
      case 'block':
        weeks = this.generateBlockPeriodization()
        break
    }

    const projectedMax = this.calculateProjectedMax()

    return {
      id: `mesocycle-${Date.now()}`,
      name: `${this.goal.exercise} - ${this.goal.currentMax} to ${this.goal.targetMax}lbs`,
      exercise: this.goal.exercise,
      startDate,
      endDate,
      weeks,
      currentMax: this.goal.currentMax,
      targetMax: this.goal.targetMax,
      projectedMax
    }
  }

  /**
   * Linear Periodization - gradual increase in intensity, decrease in volume
   */
  private generateLinearPeriodization(): Mesocycle['weeks'] {
    const weeks: Mesocycle['weeks'] = []
    const totalWeeks = this.goal.timeframe
    
    // Phase distribution
    const buildPhaseWeeks = Math.floor(totalWeeks * 0.6) // 60% building
    const intensifyPhaseWeeks = Math.floor(totalWeeks * 0.3) // 30% intensifying
    const testPhaseWeeks = 1 // 1 week testing
    const deloadFrequency = this.goal.experience === 'beginner' ? 6 : 4 // deload every 4-6 weeks

    for (let week = 1; week <= totalWeeks; week++) {
      let weekType: 'build' | 'intensify' | 'deload' | 'test' = 'build'
      
      // Determine week type
      if (week === totalWeeks) {
        weekType = 'test'
      } else if (week % deloadFrequency === 0 && week < totalWeeks - 1) {
        weekType = 'deload'
      } else if (week > buildPhaseWeeks) {
        weekType = 'intensify'
      }

      const sessions = this.generateLinearWeekSessions(week, totalWeeks, weekType)
      
      weeks.push({
        week,
        type: weekType,
        sessions
      })
    }

    return weeks
  }

  /**
   * Daily Undulating Periodization - varying intensity and volume
   */
  private generateUndulatingPeriodization(): Mesocycle['weeks'] {
    const weeks: Mesocycle['weeks'] = []
    const totalWeeks = this.goal.timeframe
    const deloadFrequency = 4

    for (let week = 1; week <= totalWeeks; week++) {
      let weekType: 'build' | 'intensify' | 'deload' | 'test' = 'build'
      
      if (week === totalWeeks) {
        weekType = 'test'
      } else if (week % deloadFrequency === 0 && week < totalWeeks - 1) {
        weekType = 'deload'
      } else if (week > totalWeeks * 0.75) {
        weekType = 'intensify'
      }

      const sessions = this.generateUndulatingWeekSessions(week, totalWeeks, weekType)
      
      weeks.push({
        week,
        type: weekType,
        sessions
      })
    }

    return weeks
  }

  /**
   * Block Periodization - distinct phases of training
   */
  private generateBlockPeriodization(): Mesocycle['weeks'] {
    const weeks: Mesocycle['weeks'] = []
    const totalWeeks = this.goal.timeframe
    
    // Block structure: Accumulation (volume) -> Intensification -> Realization
    const accumulationWeeks = Math.floor(totalWeeks * 0.5)
    const intensificationWeeks = Math.floor(totalWeeks * 0.3)
    const realizationWeeks = totalWeeks - accumulationWeeks - intensificationWeeks

    for (let week = 1; week <= totalWeeks; week++) {
      let weekType: 'build' | 'intensify' | 'deload' | 'test' = 'build'
      
      if (week <= accumulationWeeks) {
        weekType = 'build'
      } else if (week <= accumulationWeeks + intensificationWeeks) {
        weekType = 'intensify'
      } else {
        weekType = week === totalWeeks ? 'test' : 'intensify'
      }

      // Add deload weeks
      if (week % 4 === 0 && week < totalWeeks - 1) {
        weekType = 'deload'
      }

      const sessions = this.generateBlockWeekSessions(week, totalWeeks, weekType)
      
      weeks.push({
        week,
        type: weekType,
        sessions
      })
    }

    return weeks
  }

  /**
   * Generate sessions for linear periodization week
   */
  private generateLinearWeekSessions(week: number, totalWeeks: number, weekType: string) {
    const sessions = []
    const progressFactor = week / totalWeeks
    
    for (let day = 1; day <= this.goal.trainingDays; day++) {
      let sets: number, reps: number, intensity: number, rpe: number

      switch (weekType) {
        case 'build':
          sets = this.goal.experience === 'beginner' ? 3 : 4
          reps = Math.max(3, 8 - Math.floor(progressFactor * 5)) // 8 reps -> 3 reps
          intensity = 0.65 + (progressFactor * 0.25) // 65% -> 90%
          rpe = 6 + (progressFactor * 2) // RPE 6 -> 8
          break
          
        case 'intensify':
          sets = this.goal.experience === 'beginner' ? 2 : 3
          reps = Math.max(1, 5 - Math.floor(progressFactor * 3)) // 5 reps -> 1 rep
          intensity = 0.80 + (progressFactor * 0.15) // 80% -> 95%
          rpe = 7 + (progressFactor * 2) // RPE 7 -> 9
          break
          
        case 'deload':
          sets = 2
          reps = 5
          intensity = 0.60
          rpe = 5
          break
          
        case 'test':
          sets = this.goal.experience === 'beginner' ? 1 : 2
          reps = 1
          intensity = 1.0 // 100% - attempting new max
          rpe = 10
          break
          
        default:
          sets = 3
          reps = 5
          intensity = 0.75
          rpe = 7
      }

      sessions.push({
        day,
        sets,
        reps,
        intensity: Math.round(intensity * 100) / 100,
        rpe,
        notes: this.generateSessionNotes(weekType, sets, reps, intensity)
      })
    }

    return sessions
  }

  /**
   * Generate sessions for undulating periodization week
   */
  private generateUndulatingWeekSessions(week: number, totalWeeks: number, weekType: string) {
    const sessions = []
    
    // DUP pattern: Heavy, Light, Medium or Volume, Intensity, Power
    const patterns = [
      { sets: 3, reps: 5, intensity: 0.85, rpe: 8, type: 'Heavy' },
      { sets: 4, reps: 8, intensity: 0.70, rpe: 7, type: 'Volume' },
      { sets: 2, reps: 3, intensity: 0.90, rpe: 9, type: 'Intensity' }
    ]

    for (let day = 1; day <= this.goal.trainingDays; day++) {
      const pattern = patterns[(day - 1) % patterns.length]
      
      if (weekType === 'deload') {
        sessions.push({
          day,
          sets: 2,
          reps: 5,
          intensity: 0.60,
          rpe: 5,
          notes: 'Deload week - focus on recovery'
        })
      } else if (weekType === 'test') {
        sessions.push({
          day,
          sets: 1,
          reps: 1,
          intensity: 1.0,
          rpe: 10,
          notes: 'Max attempt - test new 1RM'
        })
      } else {
        // Adjust intensity based on week progression
        const progressFactor = week / totalWeeks
        const adjustedIntensity = pattern.intensity + (progressFactor * 0.1)
        
        sessions.push({
          day,
          sets: pattern.sets,
          reps: pattern.reps,
          intensity: Math.min(0.95, adjustedIntensity),
          rpe: pattern.rpe,
          notes: `${pattern.type} day - focus on ${pattern.type.toLowerCase()}`
        })
      }
    }

    return sessions
  }

  /**
   * Generate sessions for block periodization week
   */
  private generateBlockWeekSessions(week: number, totalWeeks: number, weekType: string) {
    const sessions = []
    
    for (let day = 1; day <= this.goal.trainingDays; day++) {
      let sets: number, reps: number, intensity: number, rpe: number, notes: string

      switch (weekType) {
        case 'build': // Accumulation block
          sets = 4
          reps = 8
          intensity = 0.70
          rpe = 7
          notes = 'Volume accumulation - focus on technique and work capacity'
          break
          
        case 'intensify': // Intensification block
          sets = 3
          reps = 3
          intensity = 0.87
          rpe = 8
          notes = 'Intensification - heavy loads, perfect technique'
          break
          
        case 'deload':
          sets = 2
          reps = 5
          intensity = 0.60
          rpe = 5
          notes = 'Recovery week - light loads, active recovery'
          break
          
        case 'test': // Realization block
          sets = 1
          reps = 1
          intensity = 1.0
          rpe = 10
          notes = 'Competition simulation - attempt new PR'
          break
          
        default:
          sets = 3
          reps = 5
          intensity = 0.75
          rpe = 7
          notes = 'Standard training session'
      }

      sessions.push({
        day,
        sets,
        reps,
        intensity,
        rpe,
        notes
      })
    }

    return sessions
  }

  /**
   * Generate contextual notes for training sessions
   */
  private generateSessionNotes(weekType: string, sets: number, reps: number, intensity: number): string {
    const weight = Math.round(this.goal.currentMax * intensity)
    
    switch (weekType) {
      case 'build':
        return `Focus on volume and technique. ${sets}x${reps} @ ${weight}lbs (${Math.round(intensity * 100)}%)`
      case 'intensify':
        return `Heavy singles/doubles. ${sets}x${reps} @ ${weight}lbs (${Math.round(intensity * 100)}%). Rest 3-5 minutes between sets.`
      case 'deload':
        return `Recovery week. Light weight, perfect form. Focus on movement quality.`
      case 'test':
        return `Max attempt! Warm up thoroughly. Attempt new 1RM around ${this.goal.targetMax}lbs.`
      default:
        return `${sets}x${reps} @ ${weight}lbs (${Math.round(intensity * 100)}%)`
    }
  }

  /**
   * Calculate projected max based on training plan
   */
  private calculateProjectedMax(): number {
    const progressPercentage = this.getExpectedProgressPercentage()
    return Math.round(this.goal.currentMax * (1 + progressPercentage))
  }

  /**
   * Get expected progress percentage based on experience and timeframe
   */
  private getExpectedProgressPercentage(): number {
    const baseProgress = {
      beginner: 0.20, // 20% increase potential
      intermediate: 0.15, // 15% increase potential
      advanced: 0.10 // 10% increase potential
    }

    const timeframeFactor = Math.min(1.5, this.goal.timeframe / 16) // 16 weeks is baseline
    return baseProgress[this.goal.experience] * timeframeFactor
  }

  /**
   * Validate if goal is realistic
   */
  validateGoal(): { realistic: boolean; reason?: string; suggestion?: number } {
    const maxExpectedProgress = this.calculateProjectedMax()
    const requestedProgress = (this.goal.targetMax - this.goal.currentMax) / this.goal.currentMax

    if (this.goal.targetMax <= this.goal.currentMax) {
      return {
        realistic: false,
        reason: 'Target max must be higher than current max',
        suggestion: Math.round(this.goal.currentMax * 1.1)
      }
    }

    if (maxExpectedProgress < this.goal.targetMax) {
      return {
        realistic: false,
        reason: `Target may be too ambitious for the timeframe. Expected progress: ${maxExpectedProgress}lbs`,
        suggestion: maxExpectedProgress
      }
    }

    if (requestedProgress > 0.50) { // More than 50% increase
      return {
        realistic: false,
        reason: 'Target requires more than 50% strength increase - consider a longer timeframe',
        suggestion: Math.round(this.goal.currentMax * 1.3)
      }
    }

    return { realistic: true }
  }

  /**
   * Calculate training loads for a specific session
   */
  calculateSessionLoads(intensity: number, sets: number, reps: number): {
    workingWeight: number
    warmupSets: Array<{ weight: number; reps: number }>
  } {
    const workingWeight = Math.round((this.goal.currentMax * intensity) / 5) * 5 // Round to nearest 5lbs
    
    // Generate warmup progression
    const warmupSets = []
    const warmupIntensities = [0.4, 0.5, 0.6, 0.7, 0.8]
    
    for (const warmupIntensity of warmupIntensities) {
      if (warmupIntensity < intensity) {
        warmupSets.push({
          weight: Math.round((this.goal.currentMax * warmupIntensity) / 5) * 5,
          reps: warmupIntensity <= 0.6 ? 5 : 3
        })
      }
    }

    return { workingWeight, warmupSets }
  }
}

/**
 * Factory function to create mesocycle planner
 */
export function createMesocyclePlanner(goal: TrainingGoal): MesocyclePlanner {
  return new MesocyclePlanner(goal)
}

/**
 * Predefined training templates
 */
export const TRAINING_TEMPLATES = {
  powerlifting: {
    name: 'Powerlifting Focus',
    description: 'Designed for bench press, squat, and deadlift progression',
    method: 'linear' as const,
    trainingDays: 3,
    exercises: ['Bench Press', 'Squat', 'Deadlift']
  },
  generalStrength: {
    name: 'General Strength',
    description: 'All-around strength development',
    method: 'undulating' as const,
    trainingDays: 4,
    exercises: ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press']
  },
  bodybuilding: {
    name: 'Bodybuilding Focus',
    description: 'Higher volume for muscle growth',
    method: 'block' as const,
    trainingDays: 5,
    exercises: ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row']
  }
} 