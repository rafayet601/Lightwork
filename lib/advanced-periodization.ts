/**
 * Advanced Periodization System
 * Incorporates latest research on VBT, RPE autoregulation, and DUP methods
 * Based on 2024 research findings for optimal strength and power development
 */

import { z } from 'zod'

// Advanced Training Parameters Schema
export const AdvancedTrainingParamsSchema = z.object({
  // Basic parameters
  exercise: z.string().min(1),
  currentMax: z.number().min(1),
  targetMax: z.number().min(1),
  timeframe: z.number().min(4).max(52).default(16),
  
  // VBT parameters
  enableVBT: z.boolean().default(false),
  loadVelocityProfile: z.object({
    velocityAt50: z.number().optional(), // m/s at 50% 1RM
    velocityAt70: z.number().optional(), // m/s at 70% 1RM
    velocityAt90: z.number().optional(), // m/s at 90% 1RM
  }).optional(),
  
  // Autoregulation parameters
  autoregulationMethod: z.enum(['rpe', 'velocity_loss', 'readiness']).default('rpe'),
  targetVelocityLoss: z.number().min(5).max(40).default(20), // % velocity loss threshold
  
  // Advanced periodization
  periodizationModel: z.enum([
    'linear',
    'dup_hps', // Hypertrophy-Power-Strength
    'dup_hsp', // Hypertrophy-Strength-Power  
    'block_conjugate',
    'vbt_autoregulated'
  ]).default('dup_hps'),
  
  // Individual factors
  experienceLevel: z.enum(['novice', 'intermediate', 'advanced', 'elite']).default('intermediate'),
  recoverability: z.enum(['low', 'average', 'high']).default('average'),
  trainingAge: z.number().min(0).max(20).default(2), // years
  
  // Performance goals
  primaryAdaptation: z.enum([
    'maximal_strength',
    'power_development', 
    'hypertrophy',
    'strength_endurance',
    'sport_specific'
  ]).default('maximal_strength')
})

// Velocity Loss Thresholds (based on research)
export const VELOCITY_LOSS_TARGETS = {
  power: { min: 5, max: 15 }, // For explosive adaptations
  strength: { min: 15, max: 25 }, // For strength gains
  hypertrophy: { min: 20, max: 35 }, // For muscle growth
  endurance: { min: 30, max: 50 } // For strength endurance
} as const

// RPE-Velocity Loss Relationships (research-based)
export const RPE_VELOCITY_MAPPING = {
  6: { velocityLoss: 5, description: 'Could do 4+ more reps' },
  7: { velocityLoss: 10, description: 'Could do 2-3 more reps' },
  8: { velocityLoss: 20, description: 'Could do 1-2 more reps' },
  9: { velocityLoss: 30, description: 'Could do 1 more rep' },
  10: { velocityLoss: 40, description: 'Maximal effort' }
} as const

// Daily Readiness Factors
export const ReadinessFactorsSchema = z.object({
  sleepQuality: z.number().min(1).max(10),
  stressLevel: z.number().min(1).max(10),
  energyLevel: z.number().min(1).max(10),
  musclesoreness: z.number().min(1).max(10),
  motivation: z.number().min(1).max(10),
  calculatedReadiness: z.number().min(0).max(100).optional()
})

export type AdvancedTrainingParams = z.infer<typeof AdvancedTrainingParamsSchema>
export type ReadinessFactors = z.infer<typeof ReadinessFactorsSchema>

export class AdvancedPeriodizationEngine {
  private params: AdvancedTrainingParams
  private userProfile: UserTrainingProfile

  constructor(params: AdvancedTrainingParams, userProfile?: Partial<UserTrainingProfile>) {
    this.params = AdvancedTrainingParamsSchema.parse(params)
    this.userProfile = {
      lifts: new Map(),
      adaptationHistory: [],
      velocityProfile: new Map(),
      ...userProfile
    }
  }

  /**
   * Generate advanced workout based on current readiness and training phase
   */
  generateSmartWorkout(options: {
    weekNumber: number
    sessionNumber: number
    readiness?: ReadinessFactors
    recentPerformance?: Array<{exercise: string, rpe: number, velocityLoss?: number}>
  }) {
    const { weekNumber, sessionNumber, readiness, recentPerformance } = options
    
    // Calculate training phase
    const phase = this.determineTrainingPhase(weekNumber)
    
    // Adjust prescription based on readiness
    const readinessAdjustment = readiness ? this.calculateReadinessAdjustment(readiness) : 1.0
    
    // Generate session based on periodization model
    let session: WorkoutSession
    
    switch (this.params.periodizationModel) {
      case 'dup_hps':
        session = this.generateDUP_HPS_Session(weekNumber, sessionNumber, phase)
        break
      case 'vbt_autoregulated':
        session = this.generateVBTSession(weekNumber, sessionNumber, phase)
        break
      default:
        session = this.generateDUP_HPS_Session(weekNumber, sessionNumber, phase)
    }

    // Apply readiness adjustments
    session = this.applyReadinessAdjustments(session, readinessAdjustment)
    
    // Add coaching cues and scientific rationale
    session.coachingNotes = this.generateAdvancedCoachingNotes(session, phase, readiness)
    session.scientificRationale = this.generateScientificRationale(session, phase)
    
    return session
  }

  /**
   * DUP with HPS configuration (research-proven superior to HSP)
   */
  private generateDUP_HPS_Session(week: number, session: number, phase: TrainingPhase): WorkoutSession {
    const dayTypes = ['hypertrophy', 'power', 'strength'] as const
    const dayType = dayTypes[(session - 1) % 3]
    
    const baseIntensity = this.calculatePhaseIntensity(phase, week)
    
    switch (dayType) {
      case 'hypertrophy':
        return {
          type: 'hypertrophy',
          exercises: [{
            name: this.params.exercise,
            sets: this.determineOptimalSets('hypertrophy', phase),
            reps: [8, 10, 12], // Varied rep ranges within session
            intensity: baseIntensity * 0.7, // 70% base intensity
            rpeTarget: 7.5,
            velocityLossTarget: VELOCITY_LOSS_TARGETS.hypertrophy.max,
            restPeriods: [90, 120, 150], // Progressive rest
            tempo: '3-1-2-1', // Eccentric-pause-concentric-pause
            notes: 'Focus on muscle tension and mind-muscle connection'
          }],
          totalVolume: 0, // Calculate based on actual performance
          estimatedDuration: 45,
          focus: 'Muscle hypertrophy and metabolic stress'
        }
        
      case 'power':
        return {
          type: 'power',
          exercises: [{
            name: this.params.exercise,
            sets: 5,
            reps: [3, 4, 5], // Lower reps for power
            intensity: baseIntensity * 0.65, // Lighter for speed
            rpeTarget: 6.5,
            velocityLossTarget: VELOCITY_LOSS_TARGETS.power.max,
            restPeriods: [180, 240], // Full recovery between sets
            tempo: 'X-0-X-2', // Explosive concentric
            velocityTarget: this.calculateVelocityTarget(baseIntensity * 0.65),
            notes: 'Maximum intent on every rep. Stop set if velocity drops significantly.'
          }],
          totalVolume: 0,
          estimatedDuration: 35,
          focus: 'Rate of force development and neural adaptations'
        }
        
      case 'strength':
        return {
          type: 'strength',
          exercises: [{
            name: this.params.exercise,
            sets: 4,
            reps: [3, 4, 5], // Heavy strength work
            intensity: baseIntensity * 0.85, // High intensity
            rpeTarget: 8.5,
            velocityLossTarget: VELOCITY_LOSS_TARGETS.strength.max,
            restPeriods: [240, 300], // Full recovery
            tempo: '2-1-1-1', // Controlled but not slow
            notes: 'Focus on technique under heavy load. Grind reps are acceptable.'
          }],
          totalVolume: 0,
          estimatedDuration: 50,
          focus: 'Maximal strength and neural efficiency'
        }
    }
  }

  /**
   * VBT-based autoregulated session
   */
  private generateVBTSession(week: number, session: number, phase: TrainingPhase): WorkoutSession {
    const targetVelocity = this.calculateSessionTargetVelocity(phase, week)
    const velocityLossThreshold = this.params.targetVelocityLoss
    
    return {
      type: 'vbt_autoregulated',
      exercises: [{
        name: this.params.exercise,
        sets: 'autoregulated', // Continue until velocity loss threshold
        reps: 'autoregulated', // Stop set when velocity drops below threshold
        intensity: 'velocity_guided', // Load determined by target velocity
        velocityTarget: targetVelocity,
        velocityLossTarget: velocityLossThreshold,
        rpeTarget: this.velocityToRPE(velocityLossThreshold),
        restPeriods: [180, 240],
        notes: `Target velocity: ${targetVelocity.toFixed(2)} m/s. Stop set at ${velocityLossThreshold}% velocity loss.`
      }],
      vbtProtocol: {
        warmupVelocities: this.generateVBTWarmup(targetVelocity),
        loadSelection: 'velocity_guided',
        stopCriteria: 'velocity_loss',
        feedbackType: 'real_time'
      },
      totalVolume: 0,
      estimatedDuration: 40,
      focus: 'Autoregulated training based on velocity feedback'
    }
  }

  /**
   * Calculate readiness adjustment factor
   */
  private calculateReadinessAdjustment(readiness: ReadinessFactors): number {
    const factors = [
      readiness.sleepQuality,
      (11 - readiness.stressLevel), // Invert stress (lower is better)
      readiness.energyLevel,
      (11 - readiness.musclesoreness), // Invert soreness
      readiness.motivation
    ]
    
    const averageReadiness = factors.reduce((sum, factor) => sum + factor, 0) / factors.length
    const readinessScore = averageReadiness / 10 // Normalize to 0-1
    
    // Apply research-based adjustments
    if (readinessScore >= 0.8) {
      return 1.1 // 10% increase when feeling great
    } else if (readinessScore >= 0.6) {
      return 1.0 // Normal training
    } else if (readinessScore >= 0.4) {
      return 0.85 // 15% reduction
    } else {
      return 0.7 // 30% reduction when feeling poor
    }
  }

  /**
   * Generate advanced coaching notes with scientific rationale
   */
  private generateAdvancedCoachingNotes(session: WorkoutSession, phase: TrainingPhase, readiness?: ReadinessFactors): string {
    let notes = []
    
    // Phase-specific notes
    switch (phase) {
      case 'accumulation':
        notes.push('🔬 ACCUMULATION PHASE: Building work capacity and technical proficiency')
        notes.push('• Focus on movement quality and progressive volume')
        notes.push('• RPE should feel manageable with 2-3 reps in reserve')
        break
      case 'intensification':
        notes.push('🎯 INTENSIFICATION PHASE: Neural adaptations and strength gains')
        notes.push('• Higher loads with lower volume - quality over quantity')
        notes.push('• RPE 8-9 is expected, but maintain perfect technique')
        break
      case 'realization':
        notes.push('🏆 REALIZATION PHASE: Peak strength expression')
        notes.push('• Testing maximal capabilities - demonstrate your gains')
        notes.push('• Full recovery between attempts, perfect technique only')
        break
    }

    // VBT-specific notes
    if (this.params.enableVBT && session.vbtProtocol) {
      notes.push('⚡ VELOCITY-BASED TRAINING:')
      notes.push('• Monitor bar speed for each rep - aim for consistent velocity')
      notes.push('• Stop the set when velocity drops below threshold')
      notes.push('• Higher velocity = better neural adaptations')
    }

    // Readiness adjustments
    if (readiness) {
      const readinessScore = this.calculateOverallReadiness(readiness)
      if (readinessScore < 70) {
        notes.push('⚠️ READINESS ADJUSTMENT:')
        notes.push('• Training loads reduced based on current readiness')
        notes.push('• Focus on movement quality over intensity today')
        notes.push('• Recovery is part of the process - listen to your body')
      }
    }

    // DUP rationale
    if (this.params.periodizationModel.includes('dup')) {
      notes.push('🔄 DAILY UNDULATING PERIODIZATION:')
      notes.push('• Different stimulus each session prevents accommodation')
      notes.push('• Research shows 2x greater strength gains vs linear progression')
    }

    return notes.join('\n')
  }

  /**
   * Generate scientific rationale for the session
   */
  private generateScientificRationale(session: WorkoutSession, phase: TrainingPhase): string {
    const rationales = []

    // Periodization rationale
    switch (this.params.periodizationModel) {
      case 'dup_hps':
        rationales.push('📚 RESEARCH BASIS: HPS configuration shown to be superior to HSP in powerlifters (Zourdos et al., 2016)')
        rationales.push('• Hypertrophy-Power-Strength sequence optimizes neuromuscular adaptations')
        break
      case 'vbt_autoregulated':
        rationales.push('📚 RESEARCH BASIS: VBT provides superior strength gains vs percentage-based training (Held et al., 2022)')
        rationales.push('• Velocity loss monitoring prevents overreaching while maximizing adaptations')
        break
    }

    // Velocity loss rationale
    if (session.exercises[0].velocityLossTarget) {
      const vlTarget = session.exercises[0].velocityLossTarget
      if (vlTarget <= 15) {
        rationales.push('🔬 VELOCITY LOSS: Low VL (≤15%) optimal for power and neural adaptations')
      } else if (vlTarget <= 25) {
        rationales.push('🔬 VELOCITY LOSS: Moderate VL (15-25%) optimal for strength gains')
      } else {
        rationales.push('🔬 VELOCITY LOSS: Higher VL (25%+) creates metabolic stress for hypertrophy')
      }
    }

    // RPE rationale
    const rpeTarget = session.exercises[0].rpeTarget
    if (rpeTarget && rpeTarget < 8) {
      rationales.push('💪 RPE TARGET: Submaximal loads preserve movement quality and enable consistency')
    } else if (rpeTarget && rpeTarget >= 8.5) {
      rationales.push('💪 RPE TARGET: High RPE develops mental toughness and maximal strength')
    }

    return rationales.join('\n')
  }

  // Helper methods
  private determineTrainingPhase(week: number): TrainingPhase {
    const totalWeeks = this.params.timeframe
    const progressPercentage = week / totalWeeks

    if (progressPercentage <= 0.6) return 'accumulation'
    if (progressPercentage <= 0.85) return 'intensification'
    return 'realization'
  }

  private calculatePhaseIntensity(phase: TrainingPhase, week: number): number {
    const baseIntensity = 0.7 + (week / this.params.timeframe) * 0.25 // 70% to 95%
    
    switch (phase) {
      case 'accumulation': return Math.min(baseIntensity, 0.8)
      case 'intensification': return Math.min(baseIntensity + 0.1, 0.95)
      case 'realization': return 0.95
    }
  }

  private determineOptimalSets(dayType: string, phase: TrainingPhase): number {
    const baseSets = {
      hypertrophy: 4,
      strength: 5,
      power: 6
    }

    const phaseMultiplier = {
      accumulation: 1.2,
      intensification: 1.0,
      realization: 0.8
    }

    return Math.round(baseSets[dayType as keyof typeof baseSets] * phaseMultiplier[phase])
  }

  private calculateVelocityTarget(intensity: number): number {
    // Research-based load-velocity relationship
    // Approximate values for main lifts
    return 1.3 - (intensity * 0.7) // Simplified relationship
  }

  private velocityToRPE(velocityLoss: number): number {
    // Convert velocity loss to RPE based on research
    if (velocityLoss <= 10) return 7
    if (velocityLoss <= 20) return 8
    if (velocityLoss <= 30) return 9
    return 10
  }

  private calculateOverallReadiness(readiness: ReadinessFactors): number {
    const factors = [
      readiness.sleepQuality,
      (11 - readiness.stressLevel),
      readiness.energyLevel,
      (11 - readiness.musclesoreness),
      readiness.motivation
    ]
    
    return (factors.reduce((sum, factor) => sum + factor, 0) / factors.length) * 10
  }

  private generateVBTWarmup(targetVelocity: number) {
    return [
      { intensity: 0.4, velocity: targetVelocity + 0.4, reps: 5 },
      { intensity: 0.5, velocity: targetVelocity + 0.3, reps: 3 },
      { intensity: 0.6, velocity: targetVelocity + 0.2, reps: 2 },
      { intensity: 0.7, velocity: targetVelocity + 0.1, reps: 1 }
    ]
  }

  private applyReadinessAdjustments(session: WorkoutSession, adjustment: number): WorkoutSession {
    // Apply adjustment to intensity and volume
    session.exercises = session.exercises.map(exercise => ({
      ...exercise,
      intensity: typeof exercise.intensity === 'number' ? exercise.intensity * adjustment : exercise.intensity,
      rpeTarget: exercise.rpeTarget ? Math.max(6, exercise.rpeTarget - (1 - adjustment) * 2) : undefined
    }))

    return session
  }

  private calculateSessionTargetVelocity(phase: TrainingPhase, week: number): number {
    // Implementation for VBT target velocity calculation
    const baseVelocity = 0.5 // m/s baseline
    const phaseAdjustment = {
      accumulation: 0.1,
      intensification: 0.0,
      realization: -0.1
    }
    
    return baseVelocity + phaseAdjustment[phase]
  }
}

// Supporting types
type TrainingPhase = 'accumulation' | 'intensification' | 'realization'

interface WorkoutSession {
  type: string
  exercises: Array<{
    name: string
    sets: number | string
    reps: number[] | string
    intensity: number | string
    rpeTarget?: number
    velocityLossTarget?: number
    velocityTarget?: number
    restPeriods: number[]
    tempo?: string
    notes: string
  }>
  vbtProtocol?: {
    warmupVelocities: Array<{intensity: number, velocity: number, reps: number}>
    loadSelection: string
    stopCriteria: string
    feedbackType: string
  }
  totalVolume: number
  estimatedDuration: number
  focus: string
  coachingNotes?: string
  scientificRationale?: string
}

interface UserTrainingProfile {
  lifts: Map<string, {currentMax: number, velocityProfile?: number[]}>
  adaptationHistory: Array<{date: Date, adaptation: string, magnitude: number}>
  velocityProfile: Map<number, number> // intensity -> velocity mapping
}

// Factory function
export function createAdvancedPeriodizationEngine(
  params: AdvancedTrainingParams,
  userProfile?: Partial<UserTrainingProfile>
): AdvancedPeriodizationEngine {
  return new AdvancedPeriodizationEngine(params, userProfile)
}

// Utility functions for common calculations
export function calculateOptimalVelocityLoss(
  adaptation: 'power' | 'strength' | 'hypertrophy' | 'endurance'
): number {
  const targets = VELOCITY_LOSS_TARGETS[adaptation]
  return (targets.min + targets.max) / 2 // Return middle of range
}

export function convertRPEToVelocityLoss(rpe: number): number {
  return RPE_VELOCITY_MAPPING[rpe as keyof typeof RPE_VELOCITY_MAPPING]?.velocityLoss || 20
}

export function estimateTrainingReadiness(factors: ReadinessFactors): {
  score: number
  recommendation: 'proceed' | 'reduce' | 'deload'
  adjustment: number
} {
  const score = (factors.sleepQuality + (11 - factors.stressLevel) + 
                 factors.energyLevel + (11 - factors.musclesoreness) + 
                 factors.motivation) / 5

  if (score >= 8) return { score, recommendation: 'proceed', adjustment: 1.1 }
  if (score >= 6) return { score, recommendation: 'proceed', adjustment: 1.0 }
  if (score >= 4) return { score, recommendation: 'reduce', adjustment: 0.85 }
  return { score, recommendation: 'deload', adjustment: 0.7 }
} 