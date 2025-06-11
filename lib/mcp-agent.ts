import { z } from 'zod'
import { createMesocyclePlanner, TrainingGoalSchema, type TrainingGoal, type Mesocycle } from './mesocycle-planner'

// Enhanced schemas for coaching
const ExerciseSetSchema = z.object({
  weight: z.number().positive(),
  reps: z.number().positive(),
  rpe: z.number().min(1).max(10).optional(),
  restTime: z.number().positive().optional(),
  notes: z.string().optional(),
  formNotes: z.string().optional(),
  coachFeedback: z.string().optional(),
})

const ExerciseSchema = z.object({
  name: z.string(),
  sets: z.array(ExerciseSetSchema),
  targetMuscleGroups: z.array(z.string()).optional(),
  safetyWarnings: z.array(z.string()).optional(),
  coachingTips: z.array(z.string()).optional(),
  progressionSuggestion: z.string().optional(),
})

const WorkoutSchema = z.object({
  name: z.string(),
  date: z.string(),
  exercises: z.array(ExerciseSchema),
  duration: z.number().optional(),
  totalVolume: z.number().optional(),
  intensity: z.number().optional(),
  coachNotes: z.string().optional(),
  motivationalMessage: z.string().optional(),
})

const GoalSchema = z.object({
  id: z.string(),
  type: z.enum(['strength', 'muscle_gain', 'endurance', 'fat_loss', 'performance']),
  exercise: z.string().optional(),
  current: z.number(),
  target: z.number(),
  timeframe: z.number(), // weeks
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['active', 'paused', 'completed', 'failed']),
  createdAt: z.string(),
  deadline: z.string(),
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

// Coaching database
const COACHING_TIPS = {
  'Bench Press': [
    'Keep your shoulder blades retracted and down',
    'Maintain a slight arch in your lower back',
    'Control the descent, explosive ascent',
    'Keep your core tight throughout the movement'
  ],
  'Squats': [
    'Keep your chest up and core engaged',
    'Track your knees over your toes',
    'Go to parallel or below for full range of motion',
    'Drive through your heels on the way up'
  ],
  'Deadlifts': [
    'Keep the bar close to your body throughout',
    'Engage your lats to protect your spine',
    'Hip hinge movement, not a squat',
    'Neutral spine throughout the movement'
  ],
  'Pull-ups': [
    'Full range of motion from dead hang to chin over bar',
    'Engage your core to prevent swinging',
    'Control the descent for maximum benefit',
    'Focus on pulling with your back, not just arms'
  ]
}

const SAFETY_RULES = {
  'Bench Press': [
    'Always use a spotter for heavy sets',
    'Don\'t bounce the bar off your chest',
    'Keep your feet planted on the ground',
    'Use safety bars or pins when training alone'
  ],
  'Squats': [
    'Always use safety bars set just below your lowest squat position',
    'Don\'t lean forward excessively',
    'Don\'t let your knees cave inward',
    'Start with bodyweight if you\'re a beginner'
  ],
  'Deadlifts': [
    'Never round your back under load',
    'Don\'t jerk the bar off the ground',
    'Use proper footwear with flat soles',
    'Start with light weight to master form'
  ]
}

const PROGRESSIVE_OVERLOAD_RULES = {
  strength: {
    weightIncrease: 2.5, // kg per week
    repRange: [1, 5],
    restTime: [180, 300], // seconds
    frequency: 3 // times per week
  },
  hypertrophy: {
    weightIncrease: 1.25, // kg per week
    repRange: [6, 12],
    restTime: [60, 120],
    frequency: 4
  },
  endurance: {
    weightIncrease: 0.5,
    repRange: [12, 20],
    restTime: [30, 60],
    frequency: 5
  }
}

const MOTIVATIONAL_MESSAGES = [
  "Great job! You're getting stronger every day! 💪",
  "Consistency is key - you're building unstoppable momentum! 🔥",
  "Your dedication is paying off! Keep pushing your limits! 🚀",
  "Every rep counts towards your goal! You've got this! ⭐",
  "Progress isn't always linear, but you're definitely moving forward! 📈",
  "Your future self will thank you for the work you're putting in today! 🌟",
  "Champions are made in the gym, one workout at a time! 🏆",
  "You're not just building muscle, you're building character! 💎"
]

export class MCPWorkoutAgent {
  private userId: string
  private workoutHistory: any[] = []
  private userGoals: any[] = []
  private currentWorkout: any = null
  private restTimer: NodeJS.Timeout | null = null
  private restTimeRemaining: number = 0

  constructor(userId: string) {
    this.userId = userId
    this.loadWorkoutHistory()
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

  // Voice Input Processing
  async processVoiceInput(audioBlob: Blob): Promise<{
    success: boolean
    text?: string
    error?: string
  }> {
    try {
      // Simulate voice-to-text processing
      // In a real implementation, you'd integrate with a speech-to-text service
      return {
        success: true,
        text: "Bench press 3 sets of 8 at 80kg", // Simulated result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Voice processing failed'
      }
    }
  }

  // Live Workout Mode
  startLiveWorkout(workout: z.infer<typeof WorkoutSchema>) {
    this.currentWorkout = workout
    this.startRestTimer(90) // Default 90 second rest
  }

  private startRestTimer(seconds: number) {
    this.restTimeRemaining = seconds
    this.restTimer = setInterval(() => {
      this.restTimeRemaining--
      if (this.restTimeRemaining <= 0) {
        this.stopRestTimer()
      }
    }, 1000)
  }

  stopRestTimer() {
    if (this.restTimer) {
      clearInterval(this.restTimer)
      this.restTimer = null
    }
  }

  // Progressive Overload Suggestions
  suggestNextSet(exercise: string, lastSet: z.infer<typeof ExerciseSetSchema>): {
    weight: number
    reps: number
    rpe?: number
  } {
    const history = this.getExerciseHistory(exercise)
    const lastWorkout = history[history.length - 1]
    
    if (!lastWorkout) {
      return {
        weight: lastSet.weight,
        reps: lastSet.reps,
        rpe: lastSet.rpe
      }
    }

    // Calculate suggested progression
    const progression = PROGRESSIVE_OVERLOAD_RULES.strength
    const suggestedWeight = Math.round(lastSet.weight * (1 + progression.weightIncrease))
    const suggestedReps = lastSet.reps + progression.repRange[1]

    return {
      weight: suggestedWeight,
      reps: suggestedReps,
      rpe: lastSet.rpe
    }
  }

  // Safety Checks
  checkExerciseSafety(exercise: string, weight: number, reps: number): {
    warnings: string[]
    suggestions: string[]
  } {
    const warnings: string[] = []
    const suggestions: string[] = []

    // Check against safety rules
    const rules = SAFETY_RULES[exercise as keyof typeof SAFETY_RULES] || []
    warnings.push(...rules)

    // Check for potential form issues based on weight/reps
    if (weight > 0 && reps > 0) {
      const history = this.getExerciseHistory(exercise)
      const lastWorkout = history[history.length - 1]

      if (lastWorkout) {
        // Check for sudden weight increases
        if (weight > lastWorkout.weight * 1.2) {
          warnings.push(`Sudden weight increase detected. Consider gradual progression.`)
        }

        // Check for high volume
        if (reps * weight > lastWorkout.reps * lastWorkout.weight * 1.3) {
          warnings.push(`High volume increase detected. Monitor fatigue.`)
        }
      }
    }

    return { warnings, suggestions }
  }

  // Enhanced Workout Parsing
  async parseWorkoutInput(input: string): Promise<{
    success: boolean
    workout?: z.infer<typeof WorkoutSchema>
    suggestions?: string[]
    error?: string
  }> {
    try {
      const workout = this.parseWorkoutText(input)
      const validatedWorkout = WorkoutSchema.parse(workout)
      
      // Add coaching enhancements
      validatedWorkout.exercises = await this.enhanceExercisesWithCoaching(validatedWorkout.exercises)
      validatedWorkout.motivationalMessage = this.getMotivationalMessage()

      return {
        success: true,
        workout: validatedWorkout
      }
    } catch (error) {
      return {
        success: false,
        error: 'Could not parse your workout. Try describing it more clearly.',
        suggestions: [
          'Bench Press 3x8 @80kg',
          'Squats: 100kg x 5, 110kg x 3, 120kg x 1',
          'Push-ups 3 sets of 15 reps'
        ]
      }
    }
  }

  private calculateTotalVolume(workout: z.infer<typeof WorkoutSchema>): number {
    return workout.exercises.reduce((total, exercise) => {
      return total + exercise.sets.reduce((exerciseTotal, set) => {
        return exerciseTotal + (set.weight * set.reps)
      }, 0)
    }, 0)
  }

  private calculateAverageIntensity(workout: z.infer<typeof WorkoutSchema>): number {
    // Implementation would use estimated 1RM calculations
    return 0.75 // Placeholder: 75% of 1RM
  }

  private estimateWorkoutDuration(workout: z.infer<typeof WorkoutSchema>): number {
    const totalSets = workout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)
    const averageRestTime = 90 // seconds
    return Math.ceil((totalSets * averageRestTime) / 60) // Convert to minutes
  }

  private async loadWorkoutHistory() {
    try {
      const response = await fetch(`/api/workouts?userId=${this.userId}`)
      const data = await response.json()
      this.workoutHistory = data
    } catch (error) {
      console.error('Failed to load workout history:', error)
    }
  }

  private getExerciseHistory(exercise: string) {
    return this.workoutHistory
      .flatMap(workout => workout.exercises)
      .filter(ex => ex.name === exercise)
      .flatMap(ex => ex.sets)
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

  private async enhanceExercisesWithCoaching(exercises: any[]): Promise<any[]> {
    return exercises.map(exercise => ({
      ...exercise,
      coachingTips: COACHING_TIPS[exercise.name as keyof typeof COACHING_TIPS] || [],
      safetyWarnings: SAFETY_RULES[exercise.name as keyof typeof SAFETY_RULES] || [],
      sets: exercise.sets.map((set: any) => ({
        ...set,
        coachFeedback: this.generateSetCoaching(exercise.name, set)
      }))
    }))
  }

  private parseWorkoutText(input: string): any {
    const lines = input.split('\n').filter(line => line.trim())
    let workoutName = 'Workout'
    let exercises: any[] = []

    lines.forEach(line => {
      if (line.toLowerCase().includes('workout:') || (!line.includes('x') && !line.includes('sets'))) {
        workoutName = line.replace(/workout:\s*/i, '').trim()
      } else {
        const exercise = this.parseExerciseLine(line)
        if (exercise) exercises.push(exercise)
      }
    })

    const totalVolume = this.calculateTotalVolume({ exercises })
    const intensity = this.calculateAverageIntensity({ exercises })
    const duration = this.estimateWorkoutDuration({ exercises })

    return {
      name: workoutName,
      date: new Date().toISOString().split('T')[0],
      exercises,
      totalVolume,
      intensity,
      duration
    }
  }

  private generateSetCoaching(exerciseName: string, set: any): string {
    const rpe = set.rpe || 8
    const tips = [
      `Focus on perfect form - quality over quantity!`,
      `You've got ${set.reps} strong reps at ${set.weight}kg!`,
      `Breathe deeply and stay focused!`,
      `Control the weight, don't let it control you!`,
      `Each rep brings you closer to your goal!`
    ]

    if (rpe >= 9) {
      tips.push(`That was intense! Great job pushing your limits!`)
    } else if (rpe <= 6) {
      tips.push(`You've got more in the tank! Consider adding weight next time.`)
    }

    return tips[Math.floor(Math.random() * tips.length)]
  }

  private getMotivationalMessage(): string {
    return MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]
  }

  async generateWorkout(params: {
    goalType: string
    exercise?: string
    currentProgress?: number
    timeframe?: number
    recentWorkouts?: any[]
  }) {
    const { goalType, exercise, currentProgress, timeframe, recentWorkouts } = params

    // Generate workout name based on goal type
    const workoutName = `Progressive ${goalType.charAt(0).toUpperCase() + goalType.slice(1)} Training`

    // Generate exercises based on goal type and recent workout history
    const exercises = this.generateSmartExercises(goalType, exercise, recentWorkouts)

    // Generate coaching notes
    const coachNotes = this.generateCoachingNotes(goalType, exercise, currentProgress, timeframe)

    // Generate motivational message
    const motivationalMessage = this.generateMotivationalMessage()

    return {
      name: workoutName,
      exercises,
      coachNotes,
      motivationalMessage
    }
  }

  private generateSmartExercises(goalType: string, specificExercise?: string, recentWorkouts?: any[]) {
    const exerciseTemplates = {
      strength: [
        { name: specificExercise || 'Squats', sets: '5x3', weight: '85-95%', rpe: '8-9', focus: 'Maximum strength' },
        { name: 'Bench Press', sets: '4x5', weight: '80-85%', rpe: '7-8', focus: 'Strength endurance' },
        { name: 'Deadlifts', sets: '3x5', weight: '85-90%', rpe: '8-9', focus: 'Power development' }
      ],
      muscle_gain: [
        { name: 'Bench Press', sets: '4x8-10', weight: '70-75%', rpe: '7-8', focus: 'Hypertrophy' },
        { name: 'Squats', sets: '4x10-12', weight: '65-70%', rpe: '7-8', focus: 'Volume' },
        { name: 'Rows', sets: '3x12-15', weight: '60-70%', rpe: '6-7', focus: 'Muscle building' }
      ],
      endurance: [
        { name: 'Squats', sets: '3x15-20', weight: '50-60%', rpe: '6-7', focus: 'Muscular endurance' },
        { name: 'Push-ups', sets: '4x12-20', weight: 'Bodyweight', rpe: '6-8', focus: 'Endurance' },
        { name: 'Plank', sets: '3x60s', weight: 'Bodyweight', rpe: '7-8', focus: 'Core strength' }
      ],
      fat_loss: [
        { name: 'Squats', sets: '3x12-15', weight: '60-70%', rpe: '7-8', focus: 'Metabolic conditioning' },
        { name: 'Burpees', sets: '3x20', weight: 'Bodyweight', rpe: '8-9', focus: 'HIIT' },
        { name: 'Mountain Climbers', sets: '3x30s', weight: 'Bodyweight', rpe: '8-9', focus: 'Cardio' }
      ],
      performance: [
        { name: 'Squats', sets: '5x5', weight: '75-80%', rpe: '7-8', focus: 'Power' },
        { name: 'Box Jumps', sets: '4x8', weight: 'Bodyweight', rpe: '7-8', focus: 'Explosiveness' },
        { name: 'Sprint Intervals', sets: '6x30s', weight: 'Bodyweight', rpe: '8-9', focus: 'Speed' }
      ]
    }

    // If we have recent workouts, adjust the template based on user's history
    if (recentWorkouts && recentWorkouts.length > 0) {
      // Analyze recent workouts to avoid overtraining and ensure variety
      const recentExercises = new Set(recentWorkouts.flatMap(w => 
        w.exercises.map((e: any) => e.name)
      ))

      // Filter out exercises that were done in the last 2 workouts
      const filteredExercises = exerciseTemplates[goalType as keyof typeof exerciseTemplates]
        .filter(ex => !recentExercises.has(ex.name))

      // If we filtered out too many exercises, add some back
      if (filteredExercises.length < 2) {
        return exerciseTemplates[goalType as keyof typeof exerciseTemplates]
      }

      return filteredExercises
    }

    return exerciseTemplates[goalType as keyof typeof exerciseTemplates] || exerciseTemplates.strength
  }

  private generateCoachingNotes(goalType: string, exercise?: string, currentProgress?: number, timeframe?: number) {
    const timeRemaining = timeframe ? `${timeframe} weeks` : 'your timeframe'
    const progress = currentProgress ? `${currentProgress}%` : 'your current progress'
    
    return `🎯 Goal-focused training for ${exercise || goalType}. You have ${timeRemaining} to reach your target. Based on your current progress (${progress}), focus on progressive overload and consistent execution.`
  }

  private generateMotivationalMessage() {
    const messages = [
      "🔥 Champions are made one rep at a time! Keep pushing your limits!",
      "💪 Your consistency is your superpower - use it wisely!",
      "🚀 Every workout is a step closer to your strongest self!",
      "⭐ Progress isn't always linear, but it's always worth it!",
      "🏆 Your future self will thank you for the work you put in today!",
      "💎 You're not just building muscle, you're building character!",
      "🌟 The only bad workout is the one that didn't happen!"
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
}

// Export helper functions for use in components
export function createMCPAgent(userId: string) {
  return new MCPWorkoutAgent(userId)
}

export { WorkoutSchema, ExerciseSchema, ExerciseSetSchema } 