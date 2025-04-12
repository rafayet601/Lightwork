'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Trash2, Plus, Save } from 'lucide-react'

type ExerciseSet = {
  id?: string
  weight: number
  reps: number
  rpe?: number | null
}

type Exercise = {
  id: string
  name: string
  sets: ExerciseSet[]
}

type Workout = {
  id: string
  name: string
  date: string
  exercises: Exercise[]
}

interface EditWorkoutFormProps {
  workout: Workout
}

export default function EditWorkoutForm({ workout }: EditWorkoutFormProps) {
  const router = useRouter()
  const [workoutName, setWorkoutName] = useState(workout.name)
  const [workoutDate, setWorkoutDate] = useState(
    new Date(workout.date).toISOString().split('T')[0]
  )
  const [exercises, setExercises] = useState<Exercise[]>(workout.exercises)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Add a new exercise
  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        id: String(Date.now()),
        name: '',
        sets: [{ weight: 0, reps: 0 }]
      }
    ])
  }

  // Remove an exercise
  const removeExercise = (id: string) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter(exercise => exercise.id !== id))
    }
  }

  // Update exercise name
  const updateExerciseName = (id: string, name: string) => {
    setExercises(
      exercises.map(exercise => 
        exercise.id === id ? { ...exercise, name } : exercise
      )
    )
  }

  // Add a set to an exercise
  const addSet = (exerciseId: string) => {
    setExercises(
      exercises.map(exercise => 
        exercise.id === exerciseId 
          ? { 
              ...exercise, 
              sets: [...exercise.sets, { weight: 0, reps: 0 }] 
            } 
          : exercise
      )
    )
  }

  // Remove a set from an exercise
  const removeSet = (exerciseId: string, setIndex: number) => {
    setExercises(
      exercises.map(exercise => {
        if (exercise.id !== exerciseId || exercise.sets.length <= 1) {
          return exercise
        }
        
        const newSets = [...exercise.sets]
        newSets.splice(setIndex, 1)
        return { ...exercise, sets: newSets }
      })
    )
  }

  // Update set details
  const updateSet = (exerciseId: string, setIndex: number, field: keyof ExerciseSet, value: number) => {
    setExercises(
      exercises.map(exercise => {
        if (exercise.id !== exerciseId) {
          return exercise
        }
        
        const newSets = [...exercise.sets]
        newSets[setIndex] = { 
          ...newSets[setIndex], 
          [field]: value 
        }
        return { ...exercise, sets: newSets }
      })
    )
  }

  // Submit the updated workout
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!workoutName.trim()) {
      setError('Please enter a workout name')
      return
    }
    
    if (!exercises.some(exercise => exercise.name.trim())) {
      setError('Please add at least one exercise with a name')
      return
    }
    
    // Filter out any exercises without names
    const validExercises = exercises.filter(exercise => exercise.name.trim())
    
    if (validExercises.length === 0) {
      setError('Please add at least one valid exercise')
      return
    }
    
    try {
      setIsSubmitting(true)
      setError('')
      
      const response = await fetch(`/api/workouts/${workout.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: workoutName,
          date: workoutDate,
          exercises: validExercises
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json() as { error: string }
        throw new Error(errorData.error || 'Error updating workout')
      }
      
      // Navigate back to the workout details page
      router.push(`/workouts/${workout.id}`)
      router.refresh()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="workout-name" className="block text-sm font-medium mb-1">
            Workout Name
          </label>
          <Input
            id="workout-name"
            type="text"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="e.g., Leg Day, Upper Body, etc."
            className="w-full"
            required
          />
        </div>
        
        <div>
          <label htmlFor="workout-date" className="block text-sm font-medium mb-1">
            Date
          </label>
          <Input
            id="workout-date"
            type="date"
            value={workoutDate}
            onChange={(e) => setWorkoutDate(e.target.value)}
            className="w-full"
            required
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Exercises</h3>
          <Button 
            type="button" 
            onClick={addExercise}
            size="sm"
            variant="outline"
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> Add Exercise
          </Button>
        </div>
        
        {exercises.map((exercise, exerciseIndex) => (
          <Card key={exercise.id} className="p-4">
            <div className="flex flex-col space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <label htmlFor={`exercise-name-${exercise.id}`} className="block text-sm font-medium mb-1">
                    Exercise Name
                  </label>
                  <Input
                    id={`exercise-name-${exercise.id}`}
                    type="text"
                    value={exercise.name}
                    onChange={(e) => updateExerciseName(exercise.id, e.target.value)}
                    placeholder="e.g., Squat, Bench Press, etc."
                    className="w-full"
                  />
                </div>
                
                <Button
                  type="button"
                  onClick={() => removeExercise(exercise.id)}
                  disabled={exercises.length <= 1}
                  size="sm"
                  variant="ghost"
                  className="mt-6 ml-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Sets</h4>
                  <Button
                    type="button"
                    onClick={() => addSet(exercise.id)}
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                  >
                    Add Set
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs">
                        <th className="text-left font-medium py-2 w-16">Set</th>
                        <th className="text-left font-medium py-2 px-2">Weight (kg)</th>
                        <th className="text-left font-medium py-2 px-2">Reps</th>
                        <th className="text-left font-medium py-2 px-2">RPE (optional)</th>
                        <th className="text-right py-2 w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {exercise.sets.map((set, setIndex) => (
                        <tr key={setIndex} className="border-b border-opacity-50">
                          <td className="py-2">{setIndex + 1}</td>
                          <td className="py-2 px-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              value={set.weight}
                              onChange={(e) => updateSet(exercise.id, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                              className="w-full h-8"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <Input
                              type="number"
                              min="0"
                              value={set.reps}
                              onChange={(e) => updateSet(exercise.id, setIndex, 'reps', parseInt(e.target.value) || 0)}
                              className="w-full h-8"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              value={set.rpe || ''}
                              onChange={(e) => updateSet(exercise.id, setIndex, 'rpe', parseInt(e.target.value) || 0)}
                              className="w-full h-8"
                              placeholder="1-10"
                            />
                          </td>
                          <td className="py-2 text-right">
                            <Button
                              type="button"
                              onClick={() => removeSet(exercise.id, setIndex)}
                              disabled={exercise.sets.length <= 1}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
} 