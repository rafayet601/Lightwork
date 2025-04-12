'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExerciseProgress {
  date: string;
  weight: number;
  reps: number;
  volume: number; // weight * reps
}

interface ExerciseData {
  name: string;
  data: ExerciseProgress[];
}

interface ProgressTrackerProps {
  userId: string;
  exerciseName?: string;
}

export default function ProgressTracker({ userId, exerciseName }: ProgressTrackerProps) {
  const [exercises, setExercises] = useState<string[]>([])
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [progressData, setProgressData] = useState<ExerciseProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeFrame, setTimeFrame] = useState<'30days' | '90days' | '365days'>('30days')
  
  // Fetch the list of exercises for this user
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await fetch(`/api/progress/exercises?userId=${userId}`)
        if (!response.ok) throw new Error('Failed to fetch exercises')
        
        const data = await response.json()
        setExercises(data)
        
        // If an exercise name was passed in props, select it
        if (exerciseName && data.includes(exerciseName)) {
          setSelectedExercise(exerciseName)
        } else if (data.length > 0) {
          setSelectedExercise(data[0])
        }
        
      } catch (error) {
        console.error('Error fetching exercises:', error)
      }
    }
    
    fetchExercises()
  }, [userId, exerciseName])
  
  // Fetch progress data when an exercise is selected or time frame changes
  useEffect(() => {
    if (!selectedExercise) {
      setIsLoading(false)
      return
    }
    
    const fetchProgressData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/progress/data?userId=${userId}&exercise=${encodeURIComponent(selectedExercise)}&timeFrame=${timeFrame}`
        )
        
        if (!response.ok) throw new Error('Failed to fetch progress data')
        
        const data = await response.json()
        
        // Format the data for the chart
        const formattedData = data.map((entry: any) => ({
          date: new Date(entry.date).toLocaleDateString(),
          weight: entry.weight,
          reps: entry.reps,
          volume: entry.weight * entry.reps
        }))
        
        setProgressData(formattedData)
      } catch (error) {
        console.error('Error fetching progress data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProgressData()
  }, [userId, selectedExercise, timeFrame])
  
  // Placeholder UI for when no data is available
  if (exercises.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Progress Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No exercise data available yet. Log some workouts to start tracking your progress!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Helper function to calculate the maximum value for the Y axis
  const getMaxValue = (data: ExerciseProgress[], key: keyof ExerciseProgress) => {
    if (data.length === 0) return 0
    const max = Math.max(...data.map(item => Number(item[key])))
    return Math.ceil(max * 1.2) // Add 20% padding
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Progress Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Exercise selector */}
        <div className="mb-4">
          <label htmlFor="exercise-select" className="block text-sm font-medium mb-1">
            Select Exercise
          </label>
          <select
            id="exercise-select"
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="w-full p-2 border rounded-md bg-background"
          >
            {exercises.map((exercise) => (
              <option key={exercise} value={exercise}>
                {exercise}
              </option>
            ))}
          </select>
        </div>
        
        {/* Time frame selector */}
        <div className="flex space-x-2 mb-6">
          <Button
            variant={timeFrame === '30days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFrame('30days')}
          >
            30 Days
          </Button>
          <Button
            variant={timeFrame === '90days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFrame('90days')}
          >
            3 Months
          </Button>
          <Button
            variant={timeFrame === '365days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFrame('365days')}
          >
            1 Year
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-80">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : progressData.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">
              No data available for {selectedExercise} in the selected time period.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Weight progress chart */}
            <div>
              <h3 className="text-sm font-medium mb-2">Weight Progress (kg)</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, getMaxValue(progressData, 'weight')]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#3b82f6" 
                      activeDot={{ r: 8 }} 
                      name="Weight (kg)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Volume progress chart */}
            <div>
              <h3 className="text-sm font-medium mb-2">Volume Progress (weight × reps)</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, getMaxValue(progressData, 'volume')]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="volume" 
                      stroke="#10b981" 
                      activeDot={{ r: 8 }} 
                      name="Volume"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 