import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { 
  createAdvancedPeriodizationEngine,
  estimateTrainingReadiness,
  calculateOptimalVelocityLoss,
  type AdvancedTrainingParams,
  type ReadinessFactors
} from '@/lib/advanced-periodization'

export async function POST(request: Request) {
  try {
    const userSession = await getServerSession(authOptions)
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      userId, 
      goalId, 
      goalType, 
      exercise, 
      currentProgress, 
      timeframe,
      readinessData,
      enableVBT = false,
      periodizationMethod = 'dup_hps'
    } = body

    if (!userId || !goalType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get user's workout history
    const recentWorkouts = await prisma.workout.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      include: {
        exercises: {
          include: {
            sets: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    // Estimate current and target max
    const currentMax = estimateCurrentMax(exercise || 'Squat', recentWorkouts)
    const targetMax = calculateTargetMax(currentMax, goalType, timeframe || 12)

    // Map goal type to adaptation
    const primaryAdaptation = mapGoalTypeToAdaptation(goalType)
    
    // Create advanced training parameters
    const advancedParams: AdvancedTrainingParams = {
      exercise: exercise || 'Squat',
      currentMax,
      targetMax,
      timeframe: timeframe || 12,
      enableVBT,
      periodizationModel: periodizationMethod,
      autoregulationMethod: readinessData ? 'readiness' : 'rpe',
      targetVelocityLoss: calculateOptimalVelocityLoss(mapToVelocityLossType(primaryAdaptation)),
      experienceLevel: assessExperienceLevel(recentWorkouts),
      primaryAdaptation,
      recoverability: 'average',
      trainingAge: 2
    }

    // Create advanced periodization engine
    const engine = createAdvancedPeriodizationEngine(advancedParams)

    // Determine current week and session
    const weekNumber = calculateCurrentWeek(recentWorkouts, timeframe || 12)
    const sessionNumber = calculateSessionNumber(recentWorkouts)

    // Generate smart workout
    const workoutSession = engine.generateSmartWorkout({
      weekNumber,
      sessionNumber,
      readiness: readinessData,
      recentPerformance: extractRecentPerformance(recentWorkouts)
    })

    // Convert session to workout format
    const workout = convertSessionToWorkout(workoutSession, exercise || 'Squat', currentMax)

    // Generate readiness assessment if requested
    const readinessAssessment = readinessData ? estimateTrainingReadiness(readinessData) : undefined

    // Generate coaching insights
    const coachingInsights = generateCoachingInsights(workoutSession, advancedParams, readinessAssessment)

    return NextResponse.json({
      success: true,
      workout,
      periodizationInsights: generatePeriodizationInsights(workoutSession, advancedParams),
      readinessAssessment,
      coachingInsights,
      vbtGuidance: workoutSession.vbtProtocol ? generateVBTGuidance(workoutSession.vbtProtocol) : undefined,
      scientificRationale: workoutSession.scientificRationale
    })

  } catch (error) {
    console.error('Error generating advanced workout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions
function estimateCurrentMax(exercise: string, recentWorkouts: any[]): number {
  if (!recentWorkouts || recentWorkouts.length === 0) {
    const defaults = {
      'Squat': 225,
      'Bench Press': 185,
      'Deadlift': 275,
      'Overhead Press': 135
    }
    return defaults[exercise as keyof typeof defaults] || 200
  }

  // Find heaviest recent lift for this exercise
  let maxWeight = 0
  for (const workout of recentWorkouts) {
    for (const exerciseData of workout.exercises || []) {
      if (exerciseData.name === exercise) {
        for (const set of exerciseData.sets || []) {
          if (set.weight > maxWeight) {
            maxWeight = set.weight
          }
        }
      }
    }
  }

  return maxWeight || 200
}

function calculateTargetMax(currentMax: number, goalType: string, timeframe: number): number {
  const progressionRates = {
    strength: 0.15,
    muscle_gain: 0.12,
    performance: 0.18,
    endurance: 0.08,
    fat_loss: 0.05
  }

  const rate = progressionRates[goalType as keyof typeof progressionRates] || 0.12
  return Math.round(currentMax * (1 + rate))
}

function mapGoalTypeToAdaptation(goalType: string): 'maximal_strength' | 'power_development' | 'hypertrophy' | 'strength_endurance' | 'sport_specific' {
  const mapping = {
    strength: 'maximal_strength' as const,
    muscle_gain: 'hypertrophy' as const,
    performance: 'power_development' as const,
    endurance: 'strength_endurance' as const,
    fat_loss: 'strength_endurance' as const
  }

  return mapping[goalType as keyof typeof mapping] || 'maximal_strength'
}

function mapToVelocityLossType(adaptation: string): 'power' | 'strength' | 'hypertrophy' | 'endurance' {
  const mapping = {
    maximal_strength: 'strength' as const,
    power_development: 'power' as const,
    hypertrophy: 'hypertrophy' as const,
    strength_endurance: 'endurance' as const,
    sport_specific: 'power' as const
  }

  return mapping[adaptation as keyof typeof mapping] || 'strength'
}

function assessExperienceLevel(recentWorkouts: any[]): 'novice' | 'intermediate' | 'advanced' | 'elite' {
  if (!recentWorkouts || recentWorkouts.length < 5) return 'novice'
  if (recentWorkouts.length < 15) return 'intermediate'
  if (recentWorkouts.length < 30) return 'advanced'
  return 'elite'
}

function calculateCurrentWeek(recentWorkouts: any[], totalWeeks = 12): number {
  if (!recentWorkouts || recentWorkouts.length === 0) return 1
  
  const weeksTraining = Math.min(Math.floor(recentWorkouts.length / 3), totalWeeks)
  return Math.max(1, weeksTraining)
}

function calculateSessionNumber(recentWorkouts: any[]): number {
  if (!recentWorkouts || recentWorkouts.length === 0) return 1
  
  return ((recentWorkouts.length - 1) % 3) + 1
}

function extractRecentPerformance(recentWorkouts: any[]): Array<{exercise: string, rpe: number, velocityLoss?: number}> {
  if (!recentWorkouts) return []

  const performance = []
  for (const workout of recentWorkouts.slice(-5)) {
    for (const exercise of workout.exercises || []) {
      const avgRPE = exercise.sets?.reduce((sum: number, set: any) => sum + (set.rpe || 7), 0) / (exercise.sets?.length || 1)
      performance.push({
        exercise: exercise.name,
        rpe: avgRPE || 7,
        velocityLoss: undefined
      })
    }
  }

  return performance
}

function convertSessionToWorkout(session: any, exerciseName: string, currentMax: number) {
  const exercise = session.exercises[0]
  
  return {
    name: `${session.type.charAt(0).toUpperCase() + session.type.slice(1)} Focus - ${exerciseName}`,
    date: new Date().toISOString().split('T')[0],
    exercises: [{
      name: exerciseName,
      sets: typeof exercise.sets === 'number' ? 
        Array.from({ length: exercise.sets }, (_, i) => ({
          weight: Math.round(typeof exercise.intensity === 'number' ? 
            currentMax * exercise.intensity : 185),
          reps: Array.isArray(exercise.reps) ? exercise.reps[i] || exercise.reps[0] : exercise.reps,
          rpe: exercise.rpeTarget || 8,
          restTime: exercise.restPeriods[i] || exercise.restPeriods[0] || 180,
          tempo: exercise.tempo,
          velocityTarget: exercise.velocityTarget,
          notes: exercise.notes
        })) : 
        [{ // Autoregulated placeholder
          weight: Math.round(currentMax * 0.75),
          reps: 'Autoregulated - stop at velocity loss threshold',
          rpe: exercise.rpeTarget || 8,
          restTime: 180,
          notes: exercise.notes
        }]
    }],
    coachNotes: session.focus,
    estimatedDuration: session.estimatedDuration,
    motivationalMessage: generateMotivationalMessage()
  }
}

function generateVBTGuidance(vbtProtocol: any): string {
  const guidance = [
    '⚡ VELOCITY-BASED TRAINING PROTOCOL:',
    '',
    '📱 Equipment needed:',
    '• Linear position transducer (LPT) or smartphone app',
    '• Video analysis tools (MyLift, Coach Eye, etc.)',
    '',
    '🎯 Target velocities:',
    ...vbtProtocol.warmupVelocities.map((v: any) => 
      `  ${Math.round(v.intensity * 100)}% 1RM: ${v.velocity.toFixed(2)} m/s (${v.reps} reps)`
    ),
    '',
    '🛑 Stop criteria:',
    `• ${vbtProtocol.stopCriteria === 'velocity_loss' ? 'Stop set when velocity drops below threshold' : 'Stop at target RPE'}`,
    '',
    '📊 Benefits of VBT:',
    '• Objective load selection',
    '• Real-time fatigue monitoring', 
    '• Autoregulated training stimulus',
    '• Superior strength gains vs traditional methods'
  ]

  return guidance.join('\n')
}

function generatePeriodizationInsights(session: any, params: AdvancedTrainingParams): string {
  const insights = [
    `🔬 PERIODIZATION MODEL: ${params.periodizationModel.toUpperCase().replace('_', ' ')}`,
    '',
    '📈 Current Phase Focus:',
    `• ${session.focus}`,
    '',
    '🎯 Primary Adaptation:',
    `• ${params.primaryAdaptation.replace('_', ' ')}`,
    '',
    '⏰ Training Timeline:',
    `• Total program: ${params.timeframe} weeks`,
    `• Current focus: ${session.type} emphasis`,
    '',
    '🧬 Scientific Basis:',
    session.scientificRationale || 'Evidence-based training principles applied'
  ]

  return insights.join('\n')
}

function generateCoachingInsights(session: any, params: AdvancedTrainingParams, readinessAssessment?: any): string {
  const insights = [
    '🎯 TODAY\'S TRAINING FOCUS:',
    `• Primary goal: ${session.focus}`,
    `• Training type: ${session.type}`,
    '',
    '📊 KEY METRICS:',
    `• Target RPE: ${session.exercises[0].rpeTarget || 'N/A'}`,
    `• Velocity loss threshold: ${session.exercises[0].velocityLossTarget || 'N/A'}%`,
    `• Rest periods: ${session.exercises[0].restPeriods?.join('-') || 180}s`,
    ''
  ]

  if (readinessAssessment) {
    insights.push('⚡ READINESS STATUS:')
    insights.push(`• Overall score: ${Math.round(readinessAssessment.score * 10)}/10`)
    insights.push(`• Recommendation: ${readinessAssessment.recommendation}`)
    insights.push(`• Load adjustment: ${Math.round((readinessAssessment.adjustment - 1) * 100)}%`)
    insights.push('')
  }

  insights.push('🧠 COACHING NOTES:')
  insights.push(session.coachingNotes || 'Focus on quality movement and progressive overload')

  return insights.join('\n')
}

function generateMotivationalMessage(): string {
  const messages = [
    "💪 Embrace the process - every rep builds a stronger you!",
    "🔥 Your future self will thank you for today's effort!",
    "⚡ Science-backed training for maximum gains!",
    "🎯 Progressive overload: the key to continuous growth!",
    "🧠 Train smart, train hard, achieve greatness!"
  ]
  
  return messages[Math.floor(Math.random() * messages.length)]
} 