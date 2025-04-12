'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface DeleteWorkoutButtonProps {
  workoutId: string
}

export default function DeleteWorkoutButton({ workoutId }: DeleteWorkoutButtonProps) {
  const router = useRouter()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Function to open the confirmation dialog
  const openConfirmDialog = () => {
    setIsConfirmOpen(true)
  }
  
  // Function to cancel deletion
  const cancelDelete = () => {
    setIsConfirmOpen(false)
  }
  
  // Function to confirm and execute deletion
  const confirmDelete = async () => {
    try {
      setIsDeleting(true)
      
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error deleting workout')
      }
      
      // Navigate back to dashboard after successful deletion
      router.push('/dashboard')
      router.refresh()
      
    } catch (error) {
      console.error('Error deleting workout:', error)
      alert('Failed to delete workout. Please try again.')
    } finally {
      setIsDeleting(false)
      setIsConfirmOpen(false)
    }
  }
  
  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={openConfirmDialog}
        className="flex items-center text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>
      
      {/* Confirmation Dialog */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Delete Workout</h3>
            <p className="mb-4 text-muted-foreground">
              Are you sure you want to delete this workout? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={cancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 