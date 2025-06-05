import { z } from 'zod'
import { createMesocyclePlanner, TrainingGoalSchema, type TrainingGoal, type Mesocycle } from './mesocycle-planner'

// MCP Tool Schema Definitions
const ExerciseSetSchema = z.object({
  weight: z.number().min(0).describe("Weight in kg or lbs"),
  reps: z.number().min(1).describe("Number of repetitions"),
  rpe: z.number().min(1).max(10).optional().describe("Rate of Perceived Exertion (1-10)")
})

const ExerciseSchema = z.object({
  name: z.string().min(1).describe("Exercise name (e.g., 'Bench Press', 'Squats')"),
  sets: z.array(ExerciseSetSchema).min(1).describe("Array of exercise sets")
})

const WorkoutSchema = z.object({
  name: z.string().min(1).describe("Workout name"),
  date: z.string().describe("Workout date in YYYY-MM-DD format"),
  exercises: z.array(ExerciseSchema).min(1).describe("Array of exercises")
})

// Exercise database for name matching and suggestions
const EXERCISE_DATABASE = [
  // Upper Body
  'Bench Press', 'Incline Bench Press', 'Decline Bench Press',
  'Push-ups', 'Dips', 'Chest Flyes',
  'Pull-ups', 'Chin-ups', 'Lat Pulldowns', 'Rows', 'Bent Over Rows',
  'Overhead Press', 'Shoulder Press', 'Lateral Raises', 'Front Raises',
  'Bicep Curls', 'Hammer Curls', 'Tricep Extensions', 'Tricep Dips',
  
  // Lower Body
  'Squats', 'Back Squats', 'Front Squats', 'Goblet Squats',
  'Deadlifts', 'Romanian Deadlifts', 'Sumo Deadlifts',
  'Lunges', 'Bulgarian Split Squats', 'Step-ups',
  'Leg Press', 'Leg Curls', 'Leg Extensions',
  'Calf Raises', 'Hip Thrusts', 'Glute Bridges',
  
  // Core
  'Planks', 'Crunches', 'Russian Twists', 'Dead Bugs',
  'Mountain Climbers', 'Leg Raises', 'Bicycle Crunches',
  
  // Cardio
  'Running', 'Cycling', 'Rowing', 'Elliptical', 'Treadmill',
  'Burpees', 'Jumping Jacks', 'High Knees'
]

export class MCPWorkoutAgent {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Parse goal setting input and create mesocycle plan
   */
  async createTrainingPlan(input: string): Promise<{
    success: boolean
    mesocycle?: Mesocycle
    validation?: { realistic: boolean; reason?: string; suggestion?: number }
    error?: string
  }> {
    try {
      const goal = this.parseGoalInput(input)
      const planner = createMesocyclePlanner(goal)
      
      // Validate goal feasibility
      const validation = planner.validateGoal()
      
      if (!validation.realistic) {
        return {
          success: false,
          validation,
          error: validation.reason
        }
      }

      const mesocycle = planner.generateMesocycle()
      
      return {
        success: true,
        mesocycle,
        validation
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create training plan'
      }
    }
  }

  /**
   * Parse goal input from natural language
   */
  private parseGoalInput(input: string): TrainingGoal {
    const lines = input.toLowerCase().split('\n').filter(line => line.trim())
    
    let exercise = 'Bench Press'
    let currentMax = 225
    let targetMax = 315
    let timeframe = 16
    let experience: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
    let method: 'linear' | 'undulating' | 'block' = 'linear'
    let trainingDays = 3

    for (const line of lines) {
      // Extract exercise
      if (line.includes('exercise:') || line.includes('lift:')) {
        exercise = line.split(':')[1]?.trim() || exercise
      }

      // Extract current max
      const currentMatch = line.match(/current.*?(\d+)(?:lbs?|kg)?/i)
      if (currentMatch) {
        currentMax = parseInt(currentMatch[1])
      }

      // Extract target max
      const targetMatch = line.match(/(?:target|goal|want).*?(\d+)(?:lbs?|kg)?/i)
      if (targetMatch) {
        targetMax = parseInt(targetMatch[1])
      }

      // Extract timeframe
      const timeMatch = line.match(/(\d+)\s*(?:weeks?|months?)/i)
      if (timeMatch) {
        const value = parseInt(timeMatch[1])
        timeframe = line.includes('month') ? value * 4 : value
      }

      // Extract experience
      if (line.includes('beginner') || line.includes('new')) {
        experience = 'beginner'
      } else if (line.includes('advanced') || line.includes('experienced')) {
        experience = 'advanced'
      }

      // Extract method
      if (line.includes('linear')) {
        method = 'linear'
      } else if (line.includes('undulating') || line.includes('dup')) {
        method = 'undulating'
      } else if (line.includes('block')) {
        method = 'block'
      }

      // Extract training days
      const daysMatch = line.match(/(\d+)\s*(?:days?|times?).*?(?:week|per week)/i)
      if (daysMatch) {
        trainingDays = parseInt(daysMatch[1])
      }
    }

    return TrainingGoalSchema.parse({
      exercise,
      currentMax,
      targetMax,
      timeframe,
      experience,
      method,
      trainingDays
    })
  }

  /**
   * Generate session-specific training from mesocycle
   */
  async generateSessionFromPlan(mesocycle: Mesocycle, week: number, day: number): Promise<{
    success: boolean
    workout?: z.infer<typeof WorkoutSchema>
    error?: string
  }> {
    try {
      const weekPlan = mesocycle.weeks.find(w => w.week === week)
      if (!weekPlan) {
        throw new Error(`Week ${week} not found in plan`)
      }

      const sessionPlan = weekPlan.sessions.find(s => s.day === day)
      if (!sessionPlan) {
        throw new Error(`Day ${day} not found in week ${week}`)
      }

             // Calculate actual weights
       const planner = createMesocyclePlanner({
         exercise: mesocycle.exercise,
         currentMax: mesocycle.currentMax,
         targetMax: mesocycle.targetMax,
         currentMaxReps: 1, // Default for 1RM
         timeframe: mesocycle.weeks.length,
         experience: 'intermediate', // Default, could be enhanced
         method: 'linear', // Default, could be enhanced
         trainingDays: 3 // Default, could be enhanced
       })

      const loads = planner.calculateSessionLoads(
        sessionPlan.intensity,
        sessionPlan.sets,
        Array.isArray(sessionPlan.reps) ? sessionPlan.reps[0] : sessionPlan.reps
      )

      // Create workout structure
      const workout: z.infer<typeof WorkoutSchema> = {
        name: `${mesocycle.exercise} - Week ${week}, Day ${day}`,
        date: new Date().toISOString().split('T')[0],
        exercises: [
          {
            name: mesocycle.exercise,
            sets: Array.from({ length: sessionPlan.sets }, () => ({
              weight: loads.workingWeight,
              reps: Array.isArray(sessionPlan.reps) ? sessionPlan.reps[0] : sessionPlan.reps,
              rpe: sessionPlan.rpe
            }))
          }
        ]
      }

      return {
        success: true,
        workout
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate session'
      }
    }
  }

  /**
   * Parse natural language input into structured workout data
   */
  async parseWorkoutInput(input: string): Promise<{
    success: boolean
    workout?: z.infer<typeof WorkoutSchema>
    suggestions?: string[]
    error?: string
  }> {
    try {
      // Use AI to parse the natural language input
      const parsed = await this.parseWithAI(input)
      
      // Validate and clean the parsed data
      const validatedWorkout = WorkoutSchema.parse(parsed)
      
      return {
        success: true,
        workout: validatedWorkout
      }
    } catch (error) {
      // If parsing fails, provide suggestions
      const suggestions = this.generateSuggestions(input)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse workout',
        suggestions
      }
    }
  }

  /**
   * AI-powered parsing of natural language to workout structure
   */
  private async parseWithAI(input: string): Promise<z.infer<typeof WorkoutSchema>> {
    // This would integrate with an AI service (OpenAI, Anthropic, etc.)
    // For now, implementing basic pattern matching
    
    const lines = input.toLowerCase().split('\n').filter(line => line.trim())
    let workoutName = 'Daily Workout'
    let workoutDate = new Date().toISOString().split('T')[0]
    const exercises: z.infer<typeof ExerciseSchema>[] = []

    for (const line of lines) {
      // Extract workout name
      if (line.includes('workout:') || line.includes('session:')) {
        workoutName = line.split(':')[1]?.trim() || workoutName
        continue
      }

      // Extract date
      if (line.includes('date:')) {
        const dateStr = line.split(':')[1]?.trim()
        if (dateStr && Date.parse(dateStr)) {
          workoutDate = new Date(dateStr).toISOString().split('T')[0]
        }
        continue
      }

      // Parse exercise entries
      const exerciseMatch = this.parseExerciseLine(line)
      if (exerciseMatch) {
        exercises.push(exerciseMatch)
      }
    }

    if (exercises.length === 0) {
      throw new Error('No exercises found in input')
    }

    return {
      name: workoutName,
      date: workoutDate,
      exercises
    }
  }

  /**
   * Parse individual exercise lines with various formats
   */
  private parseExerciseLine(line: string): z.infer<typeof ExerciseSchema> | null {
    // Pattern: "bench press 3x10 @80kg rpe 8"
    // Pattern: "squats: 80kg x 5, 85kg x 5, 90kg x 3"
    // Pattern: "push ups 3 sets of 15"
    
    const exerciseName = this.findExerciseName(line)
    if (!exerciseName) return null

    const sets: z.infer<typeof ExerciseSetSchema>[] = []

    // Pattern 1: "3x10 @80kg rpe 8"
    const pattern1 = /(\d+)x(\d+)\s*@?(\d+(?:\.\d+)?)(?:kg|lbs|#)?\s*(?:rpe\s*(\d+(?:\.\d+)?))?/gi
    let match = pattern1.exec(line)
    if (match) {
      const [, setsCount, reps, weight, rpe] = match
      for (let i = 0; i < parseInt(setsCount); i++) {
        sets.push({
          weight: parseFloat(weight),
          reps: parseInt(reps),
          rpe: rpe ? parseFloat(rpe) : undefined
        })
      }
    }

    // Pattern 2: "80kg x 5, 85kg x 5, 90kg x 3"
    if (sets.length === 0) {
      const pattern2 = /(\d+(?:\.\d+)?)(?:kg|lbs|#)?\s*x\s*(\d+)(?:\s*rpe\s*(\d+(?:\.\d+)?))?/gi
      let setMatch
      while ((setMatch = pattern2.exec(line)) !== null) {
        const [, weight, reps, rpe] = setMatch
        sets.push({
          weight: parseFloat(weight),
          reps: parseInt(reps),
          rpe: rpe ? parseFloat(rpe) : undefined
        })
      }
    }

    // Pattern 3: "3 sets of 15"
    if (sets.length === 0) {
      const pattern3 = /(\d+)\s*sets?\s*of\s*(\d+)(?:\s*(?:@|at)\s*(\d+(?:\.\d+)?)(?:kg|lbs|#)?)?(?:\s*rpe\s*(\d+(?:\.\d+)?))?/gi
      const setMatch = pattern3.exec(line)
      if (setMatch) {
        const [, setsCount, reps, weight, rpe] = setMatch
        for (let i = 0; i < parseInt(setsCount); i++) {
          sets.push({
            weight: weight ? parseFloat(weight) : 0,
            reps: parseInt(reps),
            rpe: rpe ? parseFloat(rpe) : undefined
          })
        }
      }
    }

    if (sets.length === 0) {
      // Default: assume bodyweight or minimal data
      sets.push({ weight: 0, reps: 1 })
    }

    return {
      name: exerciseName,
      sets
    }
  }

  /**
   * Find the exercise name in a line using fuzzy matching
   */
  private findExerciseName(line: string): string | null {
    const cleanLine = line.toLowerCase().trim()
    
    // Direct match
    for (const exercise of EXERCISE_DATABASE) {
      if (cleanLine.includes(exercise.toLowerCase())) {
        return exercise
      }
    }

    // Fuzzy matching for common abbreviations/variations
    const variations: Record<string, string> = {
      'bp': 'Bench Press',
      'ohp': 'Overhead Press',
      'dl': 'Deadlifts',
      'sq': 'Squats',
      'pullups': 'Pull-ups',
      'chinups': 'Chin-ups',
      'pushups': 'Push-ups',
      'situps': 'Crunches',
      'plank': 'Planks'
    }

    for (const [abbrev, fullName] of Object.entries(variations)) {
      if (cleanLine.includes(abbrev)) {
        return fullName
      }
    }

    // Extract potential exercise name (first few words before numbers)
    const words = cleanLine.split(/[\d@x:,]/, 1)[0]?.trim()
    if (words && words.length > 2) {
      return words.split(' ').map(w => 
        w.charAt(0).toUpperCase() + w.slice(1)
      ).join(' ')
    }

    return null
  }

  /**
   * Generate helpful suggestions for failed parses
   */
  private generateSuggestions(input: string): string[] {
    return [
      "Try format: 'Bench Press 3x10 @80kg rpe 8'",
      "Or: 'Squats: 80kg x 5, 85kg x 5, 90kg x 3'",
      "Or: 'Push-ups 3 sets of 15'",
      "Include exercise name, sets, reps, and weight",
      "Use keywords: kg, lbs, sets, reps, rpe"
    ]
  }

  /**
   * Submit parsed workout to the API
   */
  async submitWorkout(workout: z.infer<typeof WorkoutSchema>): Promise<{
    success: boolean
    workoutId?: string
    error?: string
  }> {
    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workout)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create workout')
      }

      const createdWorkout = await response.json()
      
      return {
        success: true,
        workoutId: createdWorkout.id
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export helper functions for use in components
export function createMCPAgent(userId: string) {
  return new MCPWorkoutAgent(userId)
}

export { WorkoutSchema, ExerciseSchema, ExerciseSetSchema } 