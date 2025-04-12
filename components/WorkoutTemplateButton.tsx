'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, ButtonProps } from '@/components/ui/button'

interface Set {
  weight: number
  reps: number
  rpe?: number | null
}

interface Exercise {
  name: string
  sets: Set[]
}

interface WorkoutTemplate {
  name: string
  description: string
  exercises: Exercise[]
  displaySets?: string
}

interface WorkoutTemplateButtonProps extends ButtonProps {
  workout: WorkoutTemplate
  templateId?: string  // Optional template ID for the API
  children: React.ReactNode
}

export default function WorkoutTemplateButton({ 
  workout, 
  templateId,
  children, 
  className,
  ...props 
}: WorkoutTemplateButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const createWorkoutFromTemplate = async () => {
    try {
      setIsLoading(true)
      
      let response;
      
      if (templateId) {
        // Use the templates API if template ID is provided
        response = await fetch('/api/templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ templateId })
        });
      } else {
        // Fall back to using the workout data directly
        const workoutData = {
          name: workout.name,
          date: new Date().toISOString().split('T')[0], // Current date
          exercises: workout.exercises
        };
        
        response = await fetch('/api/workouts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(workoutData)
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error creating workout from template')
      }
      
      const data = await response.json()
      
      // Show success message
      console.log('Workout created successfully:', data);
      
      // Redirect to the workout details page
      router.push(`/workouts/${data.id}`)
      router.refresh()
      
    } catch (error) {
      console.error('Error creating workout from template:', error)
      alert('Failed to create workout. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Button
      onClick={createWorkoutFromTemplate}
      disabled={isLoading}
      className={className}
      {...props}
    >
      {isLoading ? 'Creating...' : children}
    </Button>
  )
} 