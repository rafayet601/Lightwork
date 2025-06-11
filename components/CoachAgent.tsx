'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'
import { Target, Trophy, Zap, TrendingUp, Calendar, User, Award, Star, Brain, Heart, Sparkles, CheckCircle2, Edit3, Plus } from 'lucide-react'
import VoiceInput from './VoiceInput'

interface Goal {
  id: string
  type: 'strength' | 'muscle_gain' | 'endurance' | 'fat_loss' | 'performance'
  exercise?: string
  current: number
  target: number
  timeframe: number
  priority: 'low' | 'medium' | 'high'
  status: 'active' | 'paused' | 'completed' | 'failed'
  createdAt: string
  deadline: string
  progressPercentage?: number
  onTrack?: boolean
}

interface CoachAgentProps {
  userId: string
}

export default function CoachAgent({ userId }: CoachAgentProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('goals')
  const [goals, setGoals] = useState<Goal[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [newGoal, setNewGoal] = useState({
    type: 'strength' as const,
    exercise: '',
    current: '',
    target: '',
    timeframe: '',
    priority: 'medium' as const
  })
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [motivationalMessage, setMotivationalMessage] = useState('')
  const [workoutRecommendation, setWorkoutRecommendation] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const initializeData = async () => {
      await loadUserGoals()
      generateMotivationalMessage()
    }
    initializeData()
  }, [])

  const loadUserGoals = async () => {
    try {
      const response = await fetch(`/api/goals?userId=${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch goals')
      }
      const userGoals = await response.json()
      setGoals(userGoals)
      generateRecommendations(userGoals)
    } catch (error) {
      console.error('Error loading goals:', error)
      // Fallback to empty goals array if fetch fails
      setGoals([])
      setRecommendations(['Unable to load goals. Please try again later.'])
    }
  }

  const generateMotivationalMessage = () => {
    const messages = [
      "🔥 Champions are made one rep at a time! Keep pushing your limits!",
      "💪 Your consistency is your superpower - use it wisely!",
      "🚀 Every workout is a step closer to your strongest self!",
      "⭐ Progress isn't always linear, but it's always worth it!",
      "🏆 Your future self will thank you for the work you put in today!",
      "💎 You're not just building muscle, you're building character!",
      "🌟 The only bad workout is the one that didn't happen!",
      "💪 Fail fast, fail gracefully! You're not a failure, you're a work in progress!"
    ]  
    setMotivationalMessage(messages[Math.floor(Math.random() * messages.length)])
  }

  const generateRecommendations = (userGoals: Goal[]) => {
    const recs: string[] = []
    
    userGoals.forEach(goal => {
      if (goal.progressPercentage && goal.progressPercentage < 30) {
        recs.push(`📈 Your ${goal.exercise || goal.type} progress needs acceleration. Consider increasing training frequency.`)
      } else if (goal.progressPercentage && goal.progressPercentage > 80) {
        recs.push(`🎯 Excellent progress on ${goal.exercise || goal.type}! You're on track to exceed your goal!`)
      }
      
      if (!goal.onTrack) {
        recs.push(`⚡ Let's boost your ${goal.exercise || goal.type} training with progressive overload techniques.`)
      }
    })

    if (recs.length === 0) {
      recs.push("🌟 You're making fantastic progress across all goals! Keep up the momentum!")
    }

    setRecommendations(recs)
  }

  const handleCreateGoal = async () => {
    setFormError(null)
    setFormSuccess(null)
    setFormLoading(true)
    // Validate
    if (!newGoal.exercise) {
      setFormError('Please enter an exercise or goal.'); setFormLoading(false); return
    }
    if (!newGoal.current || !newGoal.target || !newGoal.timeframe) {
      setFormError('Please fill in all fields.'); setFormLoading(false); return
    }
    const current = parseFloat(newGoal.current)
    const target = parseFloat(newGoal.target)
    const timeframe = parseInt(newGoal.timeframe)
    if (isNaN(current) || isNaN(target) || isNaN(timeframe)) {
      setFormError('Please enter valid numbers.'); setFormLoading(false); return
    }
    if (current >= target) {
      setFormError('Target must be greater than current.'); setFormLoading(false); return
    }
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newGoal,
          current,
          target,
          timeframe,
          userId
        })
      })
      if (!response.ok) throw new Error('Failed to create goal')
      const goal = await response.json()
      setGoals([...goals, goal])
      setNewGoal({
        type: 'strength',
        exercise: '',
        current: '',
        target: '',
        timeframe: '',
        priority: 'medium'
      })
      setFormSuccess('Goal created!')
      generateRecommendations([...goals, goal])
    } catch (error) {
      setFormError('Error creating goal. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateGoal = async (goalId: string, current: number) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: goalId,
          current
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update goal')
      }

      const updatedGoal = await response.json()
      setGoals(goals.map(g => g.id === goalId ? updatedGoal : g))
      generateRecommendations(goals.map(g => g.id === goalId ? updatedGoal : g))
    } catch (error) {
      console.error('Error updating goal:', error)
      // You might want to show an error message to the user here
    }
  }

  const handleCompleteGoal = async (goalId: string) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: goalId,
          status: 'completed'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to complete goal')
      }

      const updatedGoal = await response.json()
      setGoals(goals.map(g => g.id === goalId ? updatedGoal : g))
      generateRecommendations(goals.map(g => g.id === goalId ? updatedGoal : g))
    } catch (error) {
      console.error('Error completing goal:', error)
      // You might want to show an error message to the user here
    }
  }

  const generateWorkoutPlan = async (goalId?: string) => {
    setIsLoading(true)
    
    try {
      const primaryGoal = goalId ? goals.find(g => g.id === goalId) : goals[0]
      
      if (!primaryGoal) {
        // If no goals exist, provide a default basic workout instead of failing
        const basicWorkout = {
          name: "Basic Fitness Workout",
          exercises: [
            { name: 'Push-ups', sets: '3x10-15', weight: 'Bodyweight', rpe: '7-8', focus: 'Upper body strength' },
            { name: 'Bodyweight Squats', sets: '3x15-20', weight: 'Bodyweight', rpe: '7-8', focus: 'Lower body strength' },
            { name: 'Plank', sets: '3x30-60s', weight: 'Bodyweight', rpe: '7-8', focus: 'Core stability' },
            { name: 'Lunges', sets: '3x12 each leg', weight: 'Bodyweight', rpe: '7-8', focus: 'Leg strength' }
          ],
          coachNotes: "🎯 This is a basic starter workout. Create your first goal above to get personalized AI-generated workouts tailored to your specific objectives!",
          motivationalMessage: "💪 Every expert was once a beginner! Start with this foundation and build your goals for personalized training."
        }
        setWorkoutRecommendation(basicWorkout)
        return
      }

      const response = await fetch('/api/generate-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          goalId: primaryGoal.id,
          goalType: primaryGoal.type,
          exercise: primaryGoal.exercise,
          currentProgress: primaryGoal.progressPercentage,
          timeframe: primaryGoal.timeframe
        })
      })

      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText)
        // Fallback to smart exercises based on goal if API fails
        const fallbackWorkout = {
          name: `${primaryGoal.type.charAt(0).toUpperCase() + primaryGoal.type.slice(1)} Training Session`,
          exercises: generateSmartExercises(primaryGoal),
          coachNotes: generateCoachingNotes(primaryGoal),
          motivationalMessage: "🚀 This workout is generated based on your goal. Our AI services are temporarily unavailable, but this smart template will help you progress!"
        }
        setWorkoutRecommendation(fallbackWorkout)
        return
      }

      const workout = await response.json()
      setWorkoutRecommendation(workout)
    } catch (error) {
      console.error('Error generating workout:', error)
      
      // Provide a meaningful fallback based on available goals
      if (goals.length > 0) {
        const goal = goals[0]
        const fallbackWorkout = {
          name: `${goal.type.charAt(0).toUpperCase() + goal.type.slice(1)} Recovery Session`,
          exercises: generateSmartExercises(goal),
          coachNotes: "⚠️ Having trouble connecting to our AI service, but here's a solid workout based on your goals. Try again later for enhanced AI recommendations!",
          motivationalMessage: "💪 Consistency beats perfection! Keep moving forward even when technology has hiccups."
        }
        setWorkoutRecommendation(fallbackWorkout)
      } else {
        // Last resort fallback
        const emergencyWorkout = {
          name: "Quick Bodyweight Circuit",
          exercises: [
            { name: 'Jumping Jacks', sets: '3x30s', weight: 'Bodyweight', rpe: '6-7', focus: 'Cardio warm-up' },
            { name: 'Push-ups', sets: '3x8-12', weight: 'Bodyweight', rpe: '7-8', focus: 'Upper body' },
            { name: 'Squats', sets: '3x12-15', weight: 'Bodyweight', rpe: '7-8', focus: 'Lower body' },
            { name: 'Plank Hold', sets: '3x20-45s', weight: 'Bodyweight', rpe: '7-8', focus: 'Core' }
          ],
          coachNotes: "🛠️ Technical issues detected. Here's a reliable bodyweight workout to keep you moving. Set up your goals for personalized training!",
          motivationalMessage: "🌟 The best workout is the one you actually do. Let's get moving!"
        }
        setWorkoutRecommendation(emergencyWorkout)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const generateSmartExercises = (goal: Goal) => {
    const exerciseTemplates: Record<string, Array<{
      name: string
      sets: string
      weight: string
      rpe: string
      focus: string
    }>> = {
      strength: [
        { name: goal.exercise || 'Squats', sets: '5x3', weight: '85-95%', rpe: '8-9', focus: 'Maximum strength' },
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

    return exerciseTemplates[goal.type] || exerciseTemplates.strength
  }

  const generateCoachingNotes = (goal: Goal) => {
    const timeRemaining = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7))
    
    return `🎯 Goal-focused training for ${goal.exercise || goal.type}. You have ${timeRemaining} weeks to reach your target. Based on your current progress (${goal.progressPercentage}%), ${goal.onTrack ? "you're on track to succeed!" : "let's increase intensity to catch up!"} Focus on progressive overload and consistent execution.`
  }

  const getGoalTypeIcon = (type: string) => {
    const icons = {
      strength: <Trophy className="h-4 w-4" />,
      muscle_gain: <Zap className="h-4 w-4" />,
      endurance: <TrendingUp className="h-4 w-4" />,
      fat_loss: <Target className="h-4 w-4" />,
      performance: <Star className="h-4 w-4" />
    }
    return icons[type as keyof typeof icons] || <Target className="h-4 w-4" />
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    }
    return colors[priority as keyof typeof colors] || colors.medium
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Header with subtle dark styling */}
      <Card className="bg-slate-900/60 border-slate-700/50 shadow-sm backdrop-blur-sm">
        <CardHeader className="text-center py-6">
          <CardTitle className="flex items-center justify-center gap-3 text-xl">
            <Brain className="h-6 w-6 text-slate-400" />
            <span className="text-slate-200">
              Your Progressive Coach
            </span>
            <Heart className="h-5 w-5 text-slate-500" />
          </CardTitle>
          <p className="text-slate-400 text-sm mt-2">
            AI-powered coaching to help you achieve your fitness goals
          </p>
        </CardHeader>
      </Card>

      {/* Subtle Motivational Banner */}
      <Alert className="border-slate-700/50 bg-slate-900/40 shadow-sm backdrop-blur-sm">
        <Sparkles className="h-4 w-4 text-slate-400" />
        <AlertDescription className="text-slate-300 font-medium">
          {motivationalMessage}
        </AlertDescription>
      </Alert>

      {/* Dark Tabs */}
      <Card className="shadow-sm bg-slate-900/80 border-slate-700/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-10 bg-slate-950/60">
              <TabsTrigger value="goals" className="flex items-center gap-2 data-[state=active]:bg-slate-800 data-[state=active]:text-slate-200 data-[state=active]:shadow-sm text-slate-500 hover:text-slate-400 text-xs">
                <Target className="h-3 w-3" />
                Goals
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-2 data-[state=active]:bg-slate-800 data-[state=active]:text-slate-200 data-[state=active]:shadow-sm text-slate-500 hover:text-slate-400 text-xs">
                <TrendingUp className="h-3 w-3" />
                Progress
              </TabsTrigger>
              <TabsTrigger value="workout" className="flex items-center gap-2 data-[state=active]:bg-slate-800 data-[state=active]:text-slate-200 data-[state=active]:shadow-sm text-slate-500 hover:text-slate-400 text-xs">
                <Zap className="h-3 w-3" />
                Smart Training
              </TabsTrigger>
              <TabsTrigger value="coach" className="flex items-center gap-2 data-[state=active]:bg-slate-800 data-[state=active]:text-slate-200 data-[state=active]:shadow-sm text-slate-500 hover:text-slate-400 text-xs">
                <User className="h-3 w-3" />
                Coach Insights
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="goals" className="mt-6 space-y-4">
              {/* Subtle Create New Goal Form */}
              <Card className="bg-slate-900/60 border-slate-700/50 shadow-sm backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-200">
                    <Plus className="h-4 w-4 text-slate-400" />
                    Set a New Goal
                  </CardTitle>
                  <p className="text-xs text-slate-400">
                    Define your fitness target and let our AI guide your journey
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-300">Goal Type</label>
                      <select
                        value={newGoal.type}
                        onChange={e => setNewGoal({ ...newGoal, type: e.target.value as any })}
                        className="w-full p-2.5 border border-slate-700/50 rounded-md bg-slate-950/60 text-slate-200 text-sm focus:ring-1 focus:ring-slate-600 focus:border-transparent transition-all duration-200"
                      >
                        <option value="strength">💪 Strength Training</option>
                        <option value="muscle_gain">🔥 Muscle Gain</option>
                        <option value="endurance">🏃 Endurance</option>
                        <option value="fat_loss">⚡ Fat Loss</option>
                        <option value="performance">🚀 Performance</option>
                      </select>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Star className="h-2.5 w-2.5" />
                        What is your main focus?
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <VoiceInput
                        label="Exercise (if specific)"
                        value={newGoal.exercise}
                        onChange={value => setNewGoal({ ...newGoal, exercise: value })}
                        placeholder="e.g., Bench Press, Squat, Deadlift..."
                        className="text-sm"
                      />
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Edit3 className="h-2.5 w-2.5" />
                        Target a specific lift or skill (optional)
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-300">Current Level</label>
                      <input
                        type="number"
                        value={newGoal.current}
                        onChange={e => setNewGoal({ ...newGoal, current: e.target.value })}
                        placeholder="Current level"
                        className="w-full p-2.5 border border-slate-700/50 rounded-md bg-slate-950/60 text-slate-200 placeholder:text-slate-500 text-sm focus:ring-1 focus:ring-slate-600 focus:border-transparent transition-all duration-200"
                        min="0"
                        step="0.1"
                      />
                      <span className="text-xs text-slate-500">Where are you now?</span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-300">Target Level</label>
                      <input
                        type="number"
                        value={newGoal.target}
                        onChange={e => setNewGoal({ ...newGoal, target: e.target.value })}
                        placeholder="Target level"
                        className="w-full p-2.5 border border-slate-700/50 rounded-md bg-slate-950/60 text-slate-200 placeholder:text-slate-500 text-sm focus:ring-1 focus:ring-slate-600 focus:border-transparent transition-all duration-200"
                        min="0"
                        step="0.1"
                      />
                      <span className="text-xs text-slate-500">What is your goal?</span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-300">Timeframe</label>
                      <input
                        type="number"
                        value={newGoal.timeframe}
                        onChange={e => setNewGoal({ ...newGoal, timeframe: e.target.value })}
                        placeholder="12"
                        className="w-full p-2.5 border border-slate-700/50 rounded-md bg-slate-950/60 text-slate-200 placeholder:text-slate-500 text-sm focus:ring-1 focus:ring-slate-600 focus:border-transparent transition-all duration-200"
                        min="1"
                      />
                      <span className="text-xs text-slate-500">Weeks to achieve goal</span>
                    </div>
                  </div>
                  
                  <div className="pt-3 space-y-2">
                    {formError && (
                      <div className="text-red-300 text-xs bg-red-950/30 p-2 rounded-md border border-red-900/30 flex items-center gap-2">
                        <span className="text-red-400">⚠️</span>
                        {formError}
                      </div>
                    )}
                    {formSuccess && (
                      <div className="text-green-300 text-xs bg-green-950/30 p-2 rounded-md border border-green-900/30 flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-400" />
                        {formSuccess}
                      </div>
                    )}
                    <Button
                      onClick={handleCreateGoal}
                      className="w-full h-10 text-sm font-medium bg-slate-800 hover:bg-slate-700 transition-all duration-200 text-slate-200 border border-slate-600"
                      disabled={formLoading}
                    >
                      {formLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-300 mr-2"></div>
                          Creating Goal...
                        </>
                      ) : (
                        <>
                          <Target className="h-3 w-3 mr-2" />
                          Create Goal
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Subtle Active Goals */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-slate-400" />
                  Your Active Goals
                </h3>
                {goals.length === 0 ? (
                  <Card className="p-6 text-center bg-slate-900/40 border-dashed border border-slate-700/30 backdrop-blur-sm">
                    <Target className="h-8 w-8 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-300 font-medium text-sm">No active goals yet</p>
                    <p className="text-slate-500 text-xs">Create your first goal above to get started!</p>
                  </Card>
                ) : (
                  goals.map((goal) => (
                    <Card key={goal.id} className="p-4 bg-slate-900/60 border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-200 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getGoalTypeIcon(goal.type)}
                          <h4 className="font-medium text-slate-200 text-sm">
                            {goal.exercise || goal.type.charAt(0).toUpperCase() + goal.type.slice(1)}
                          </h4>
                          <Badge className={`${getPriorityColor(goal.priority)} text-xs`}>
                            {goal.priority}
                          </Badge>
                        </div>
                        <Badge variant={goal.onTrack ? "default" : "destructive"} className="text-xs">
                          {goal.onTrack ? "✅ On Track" : "⚠️ Behind"}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-300">
                          <span>{goal.current} → {goal.target}</span>
                          <span className="font-medium">{goal.progressPercentage}% complete</span>
                        </div>
                        <Progress value={goal.progressPercentage} className="h-2 bg-slate-950/60 [&>div]:bg-slate-600" />
                        <p className="text-xs text-slate-500">
                          📅 Deadline: {new Date(goal.deadline).toLocaleDateString()}
                        </p>
                        
                        {/* Subtle Progress Update Form */}
                        <div className="mt-3 p-3 bg-slate-950/40 rounded-md border border-slate-700/30">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={goal.current}
                              max={goal.target}
                              step={0.1}
                              placeholder="Update progress"
                              className="flex-1 p-1.5 border border-slate-700/50 rounded text-xs bg-slate-900/60 text-slate-200 placeholder:text-slate-500 focus:ring-1 focus:ring-slate-600 focus:border-transparent"
                              onChange={(e) => {
                                const value = parseFloat(e.target.value)
                                if (value >= goal.current && value <= goal.target) {
                                  handleUpdateGoal(goal.id, value)
                                }
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCompleteGoal(goal.id)}
                              disabled={goal.status === 'completed'}
                              className="bg-slate-900/60 border-slate-700/50 text-slate-400 hover:bg-slate-800/60 hover:border-slate-600 text-xs h-7"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Complete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="progress" className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 bg-slate-900/60 border-slate-700/50 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-slate-800/50 rounded-md">
                      <TrendingUp className="h-4 w-4 text-slate-400" />
                    </div>
                    <h3 className="font-medium text-sm text-slate-300">Overall Progress</h3>
                  </div>
                  <div className="text-2xl font-bold text-slate-200 mb-1">
                    {Math.round(goals.reduce((acc, g) => acc + (g.progressPercentage || 0), 0) / goals.length) || 0}%
                  </div>
                  <p className="text-xs text-slate-500">Average across all goals</p>
                </Card>
                
                <Card className="p-4 bg-slate-900/60 border-slate-700/50 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-slate-800/50 rounded-md">
                      <Target className="h-4 w-4 text-slate-400" />
                    </div>
                    <h3 className="font-medium text-sm text-slate-300">Goals On Track</h3>
                  </div>
                  <div className="text-2xl font-bold text-slate-200 mb-1">
                    {goals.filter(g => g.onTrack).length}/{goals.length}
                  </div>
                  <p className="text-xs text-slate-500">Meeting expected progress</p>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="workout" className="mt-6 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-slate-400" />
                    AI-Generated Workout
                  </h3>
                  <p className="text-slate-400 mt-1 text-xs">Personalized training based on your goals</p>
                </div>
                <Button 
                  onClick={() => generateWorkoutPlan()} 
                  disabled={isLoading}
                  className="bg-slate-800 hover:bg-slate-700 transition-all duration-200 text-slate-200 border border-slate-600 text-xs h-8"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-300 mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-2" />
                      Generate Smart Workout
                    </>
                  )}
                </Button>
              </div>

              {workoutRecommendation && (
                <Card className="bg-slate-900/60 border-slate-700/50 shadow-sm backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-slate-200">{workoutRecommendation.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className="border-slate-700/50 bg-slate-950/40">
                      <Brain className="h-3 w-3 text-slate-400" />
                      <AlertDescription className="text-slate-300 text-xs">
                        {workoutRecommendation.coachNotes}
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      {workoutRecommendation.exercises.map((exercise: any, index: number) => (
                        <Card key={index} className="p-3 bg-slate-950/40 border-slate-700/30 shadow-sm backdrop-blur-sm">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <h4 className="font-medium text-slate-200 text-sm">{exercise.name}</h4>
                              <p className="text-xs text-slate-400">
                                <span className="font-medium">{exercise.sets}</span> @ <span className="font-medium">{exercise.weight}</span> • RPE <span className="font-medium">{exercise.rpe}</span>
                              </p>
                              <Badge variant="outline" className="text-xs bg-slate-800/30 border-slate-600/30 text-slate-400">
                                {exercise.focus}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    <Button className="w-full h-10 text-sm font-medium bg-slate-800 hover:bg-slate-700 transition-all duration-200 text-slate-200 border border-slate-600" onClick={() => router.push('/dashboard')}>
                      <Zap className="h-4 w-4 mr-2" />
                      Start This Workout
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="coach" className="mt-6 space-y-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
                  <Award className="h-5 w-5 text-slate-400" />
                  Coach Recommendations
                </h3>
                <p className="text-slate-400 mt-1 text-xs">Personalized insights to optimize your training</p>
              </div>
              
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <Alert key={index} className="border-slate-700/50 bg-slate-950/40 shadow-sm backdrop-blur-sm">
                    <Award className="h-3 w-3 text-slate-400" />
                    <AlertDescription className="text-slate-300 text-xs">
                      {rec}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>

              <Card className="bg-slate-900/60 border-slate-700/50 shadow-sm backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <Button 
                    onClick={generateMotivationalMessage} 
                    variant="outline" 
                    className="bg-slate-900/60 border-slate-700/50 text-slate-400 hover:bg-slate-800/60 text-xs h-8"
                  >
                    <Sparkles className="h-3 w-3 mr-2" />
                    Get New Motivation
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 