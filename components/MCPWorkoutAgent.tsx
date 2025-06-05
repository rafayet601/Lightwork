'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter } from 'next/navigation'
import { createMCPAgent } from '@/lib/mcp-agent'
import MesocyclePlanner from './MesocyclePlanner'
import { Bot, Send, Sparkles, CheckCircle, AlertCircle, Target, Calendar } from 'lucide-react'

interface MCPWorkoutAgentProps {
  userId: string
}

export default function MCPWorkoutAgent({ userId }: MCPWorkoutAgentProps) {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    workout?: any
    suggestions?: string[]
    error?: string
    workoutId?: string
  } | null>(null)

  const handleSubmit = async () => {
    if (!input.trim()) return

    setIsProcessing(true)
    setResult(null)

    try {
      const agent = createMCPAgent(userId)
      
      // Parse the input
      const parseResult = await agent.parseWorkoutInput(input)
      
      if (parseResult.success && parseResult.workout) {
        // Submit the workout
        const submitResult = await agent.submitWorkout(parseResult.workout)
        
        setResult({
          success: submitResult.success,
          workout: parseResult.workout,
          workoutId: submitResult.workoutId,
          error: submitResult.error
        })

        if (submitResult.success) {
          // Clear input on success
          setInput('')
          // Refresh the page to show new workout
          router.refresh()
        }
      } else {
        setResult(parseResult)
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExampleClick = (example: string) => {
    setInput(example)
  }

  const examples = [
    "Workout: Push Day\nBench Press 3x8 @80kg rpe 8\nOverhead Press 3x10 @50kg\nDips 3 sets of 12",
    "Squats: 100kg x 5, 110kg x 3, 120kg x 1 rpe 9\nRomanian Deadlifts 3x8 @80kg\nLeg Press 3x15 @200kg",
    "Push-ups 3 sets of 20\nPull-ups 5 sets of 8\nPlanks 3 sets of 60 seconds"
  ]

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          AI Fitness Assistant
          <Sparkles className="h-4 w-4 text-yellow-500" />
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Log workouts instantly or create long-term training plans to reach your strength goals
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs defaultValue="workout" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="workout" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Quick Workout Log
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Training Plan
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="workout" className="mt-6 space-y-4">
            {/* Input Section */}
            <div className="space-y-2">
              <label htmlFor="workout-input" className="text-sm font-medium">
                Describe your workout:
              </label>
              <Textarea
                id="workout-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Example: Bench Press 3x8 @80kg rpe 8, Squats 100kg x 5, 110kg x 3, Push-ups 3 sets of 15"
                className="min-h-[100px]"
                disabled={isProcessing}
              />
            </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          disabled={!input.trim() || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Bot className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Log Workout
            </>
          )}
        </Button>

        {/* Examples */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Try these examples:</p>
          <div className="space-y-2">
            {examples.map((example, index) => (
              <Card 
                key={index}
                className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleExampleClick(example)}
              >
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {example}
                </pre>
              </Card>
            ))}
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div className="space-y-4">
            {result.success && result.workout ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-2">
                    <p className="font-medium">
                      Workout "{result.workout.name}" logged successfully!
                    </p>
                    {result.workoutId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/workouts/${result.workoutId}`)}
                      >
                        View Workout Details
                      </Button>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="space-y-2">
                    <p className="font-medium">Could not parse your workout</p>
                    {result.error && (
                      <p className="text-sm">{result.error}</p>
                    )}
                    {result.suggestions && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Try these formats:</p>
                        <ul className="text-xs space-y-1">
                          {result.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-1">
                              <span>•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Parsed Workout Preview */}
            {result.workout && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Parsed Workout Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{result.workout.name}</Badge>
                    <Badge variant="outline">{result.workout.date}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {result.workout.exercises.map((exercise: any, index: number) => (
                      <Card key={index} className="p-3">
                        <h4 className="font-medium">{exercise.name}</h4>
                        <div className="mt-2 space-y-1">
                          {exercise.sets.map((set: any, setIndex: number) => (
                            <div key={setIndex} className="text-sm text-muted-foreground">
                              Set {setIndex + 1}: {set.weight}kg × {set.reps} reps
                              {set.rpe && ` @ RPE ${set.rpe}`}
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
          </TabsContent>
          
          <TabsContent value="plan" className="mt-6">
            <MesocyclePlanner userId={userId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 