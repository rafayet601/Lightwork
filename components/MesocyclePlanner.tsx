'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter } from 'next/navigation'
import { createMCPAgent } from '@/lib/mcp-agent'
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  Brain, 
  CheckCircle, 
  AlertTriangle,
  PlayCircle,
  BarChart3,
  Zap,
  Award,
  Clock,
  Dumbbell
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Mesocycle } from '@/lib/mesocycle-planner'

interface MesocyclePlannerProps {
  userId: string
}

export default function MesocyclePlanner({ userId }: MesocyclePlannerProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    exercise: 'Bench Press',
    currentMax: 225,
    targetMax: 315,
    timeframe: 16,
    experience: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    method: 'linear' as 'linear' | 'undulating' | 'block',
    trainingDays: 3
  })
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [mesocycle, setMesocycle] = useState<Mesocycle | null>(null)
  const [validation, setValidation] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState(1)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
    setValidation(null)
  }

  const generatePlan = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const agent = createMCPAgent(userId)
      
      // Create natural language input from form
      const input = `
        Exercise: ${formData.exercise}
        Current max: ${formData.currentMax}lbs
        Target goal: ${formData.targetMax}lbs
        Timeframe: ${formData.timeframe} weeks
        Experience: ${formData.experience}
        Method: ${formData.method}
        Training days: ${formData.trainingDays} times per week
      `
      
      const result = await agent.createTrainingPlan(input)
      
      if (result.success && result.mesocycle) {
        setMesocycle(result.mesocycle)
        setValidation(result.validation)
      } else {
        setError(result.error || 'Failed to generate plan')
        setValidation(result.validation)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateSessionWorkout = async (week: number, day: number) => {
    if (!mesocycle) return
    
    try {
      const agent = createMCPAgent(userId)
      const result = await agent.generateSessionFromPlan(mesocycle, week, day)
      
      if (result.success && result.workout) {
        // Submit the workout
        const submitResult = await agent.submitWorkout(result.workout)
        
        if (submitResult.success) {
          router.push(`/workouts/${submitResult.workoutId}`)
          router.refresh()
        } else {
          setError(submitResult.error || 'Failed to create workout')
        }
      } else {
        setError(result.error || 'Failed to generate session')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const getWeekTypeColor = (type: string) => {
    switch (type) {
      case 'build': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'intensify': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'deload': return 'bg-green-100 text-green-800 border-green-200'
      case 'test': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const progressPercentage = mesocycle 
    ? ((mesocycle.projectedMax - mesocycle.currentMax) / (mesocycle.targetMax - mesocycle.currentMax)) * 100
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Target className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold">Mesocycle Planner</h2>
          <Brain className="h-8 w-8 text-primary" />
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Create a personalized training program to reach your strength goals. 
          Our AI will generate a complete periodized plan with progressive overload.
        </p>
      </div>

      {/* Goal Setting Form */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Set Your Training Goal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Exercise Selection */}
            <div className="space-y-2">
              <Label htmlFor="exercise">Exercise</Label>
              <Select value={formData.exercise} onValueChange={(value) => handleInputChange('exercise', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bench Press">Bench Press</SelectItem>
                  <SelectItem value="Squat">Squat</SelectItem>
                  <SelectItem value="Deadlift">Deadlift</SelectItem>
                  <SelectItem value="Overhead Press">Overhead Press</SelectItem>
                  <SelectItem value="Barbell Row">Barbell Row</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Current Max */}
            <div className="space-y-2">
              <Label htmlFor="currentMax">Current Max (lbs)</Label>
              <Input
                id="currentMax"
                type="number"
                value={formData.currentMax}
                onChange={(e) => handleInputChange('currentMax', parseInt(e.target.value) || 0)}
                className="text-center font-semibold"
              />
            </div>

            {/* Target Max */}
            <div className="space-y-2">
              <Label htmlFor="targetMax">Target Goal (lbs)</Label>
              <Input
                id="targetMax"
                type="number"
                value={formData.targetMax}
                onChange={(e) => handleInputChange('targetMax', parseInt(e.target.value) || 0)}
                className="text-center font-semibold text-primary"
              />
            </div>

            {/* Timeframe */}
            <div className="space-y-2">
              <Label htmlFor="timeframe">Timeframe (weeks)</Label>
              <Select value={formData.timeframe.toString()} onValueChange={(value) => handleInputChange('timeframe', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8 weeks</SelectItem>
                  <SelectItem value="12">12 weeks</SelectItem>
                  <SelectItem value="16">16 weeks</SelectItem>
                  <SelectItem value="20">20 weeks</SelectItem>
                  <SelectItem value="24">24 weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Experience Level */}
            <div className="space-y-2">
              <Label htmlFor="experience">Experience Level</Label>
              <Select value={formData.experience} onValueChange={(value: any) => handleInputChange('experience', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Training Days */}
            <div className="space-y-2">
              <Label htmlFor="trainingDays">Training Days/Week</Label>
              <Select value={formData.trainingDays.toString()} onValueChange={(value) => handleInputChange('trainingDays', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 days</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="4">4 days</SelectItem>
                  <SelectItem value="5">5 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Periodization Method */}
          <div className="space-y-3">
            <Label>Training Method</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { 
                  value: 'linear', 
                  title: 'Linear Periodization', 
                  description: 'Gradual increase in intensity, great for beginners',
                  icon: <TrendingUp className="h-4 w-4" />
                },
                { 
                  value: 'undulating', 
                  title: 'Daily Undulating', 
                  description: 'Varying intensity daily, prevents adaptation',
                  icon: <BarChart3 className="h-4 w-4" />
                },
                { 
                  value: 'block', 
                  title: 'Block Periodization', 
                  description: 'Distinct training phases, for advanced lifters',
                  icon: <Zap className="h-4 w-4" />
                }
              ].map((method) => (
                <Card 
                  key={method.value}
                  className={`cursor-pointer transition-all duration-200 ${
                    formData.method === method.value 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleInputChange('method', method.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{method.icon}</div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm">{method.title}</h4>
                        <p className="text-xs text-muted-foreground">{method.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Validation Results */}
          {validation && !validation.realistic && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <div className="space-y-2">
                  <p className="font-medium">{validation.reason}</p>
                  {validation.suggestion && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Suggested target:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInputChange('targetMax', validation.suggestion)}
                      >
                        {validation.suggestion}lbs
                      </Button>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Display */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Generate Button */}
          <Button 
            onClick={generatePlan}
            disabled={isGenerating}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Brain className="h-5 w-5 mr-2 animate-pulse" />
                Generating Your Plan...
              </>
            ) : (
              <>
                <Target className="h-5 w-5 mr-2" />
                Generate Training Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Plan Display */}
      <AnimatePresence>
        {mesocycle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-6xl mx-auto space-y-6"
          >
            {/* Plan Overview */}
            <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-6 w-6 text-primary" />
                  Your Training Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold text-primary">{mesocycle.currentMax}lbs</div>
                    <div className="text-sm text-muted-foreground">Current Max</div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold text-green-600">{mesocycle.projectedMax}lbs</div>
                    <div className="text-sm text-muted-foreground">Projected Max</div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold text-orange-600">{mesocycle.targetMax}lbs</div>
                    <div className="text-sm text-muted-foreground">Target Goal</div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold">{mesocycle.weeks.length}</div>
                    <div className="text-sm text-muted-foreground">Weeks</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress to Goal</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Weekly Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Weekly Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedWeek.toString()} onValueChange={(value) => setSelectedWeek(parseInt(value))}>
                  <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
                    {mesocycle.weeks.slice(0, 8).map((week) => (
                      <TabsTrigger 
                        key={week.week} 
                        value={week.week.toString()}
                        className="text-xs"
                      >
                        W{week.week}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {mesocycle.weeks.slice(0, 8).map((week) => (
                    <TabsContent key={week.week} value={week.week.toString()} className="mt-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">Week {week.week}</h3>
                          <Badge className={getWeekTypeColor(week.type)}>
                            {week.type.charAt(0).toUpperCase() + week.type.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {week.sessions.map((session) => (
                            <Card key={session.day} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-semibold">Day {session.day}</h4>
                                    <Badge variant="outline">{Math.round(session.intensity * 100)}%</Badge>
                                  </div>
                                  
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span>Sets:</span>
                                      <span className="font-medium">{session.sets}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Reps:</span>
                                      <span className="font-medium">
                                        {Array.isArray(session.reps) ? session.reps.join(', ') : session.reps}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>RPE:</span>
                                      <span className="font-medium">{session.rpe}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Weight:</span>
                                      <span className="font-medium text-primary">
                                        {Math.round(mesocycle.currentMax * session.intensity)}lbs
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {session.notes && (
                                    <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                      {session.notes}
                                    </p>
                                  )}
                                  
                                  <Button 
                                    onClick={() => generateSessionWorkout(week.week, session.day)}
                                    size="sm" 
                                    className="w-full"
                                    variant="outline"
                                  >
                                    <PlayCircle className="h-4 w-4 mr-2" />
                                    Start Session
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
                
                {mesocycle.weeks.length > 8 && (
                  <div className="mt-6 text-center">
                    <Button variant="outline" onClick={() => {/* Show all weeks */}}>
                      <Clock className="h-4 w-4 mr-2" />
                      View All {mesocycle.weeks.length} Weeks
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 