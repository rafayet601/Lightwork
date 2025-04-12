import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

// Sample workout templates
const workoutTemplates = {
  "full-body": {
    name: "Full Body Workout",
    description: "A balanced workout targeting all major muscle groups",
    exercises: [
      { name: "Bench Press", sets: [{ weight: 60, reps: 10, rpe: 7 }, { weight: 65, reps: 8, rpe: 8 }, { weight: 70, reps: 6, rpe: 9 }] },
      { name: "Squats", sets: [{ weight: 80, reps: 10, rpe: 7 }, { weight: 85, reps: 8, rpe: 8 }, { weight: 90, reps: 6, rpe: 9 }] },
      { name: "Bent Over Rows", sets: [{ weight: 50, reps: 10, rpe: 7 }, { weight: 55, reps: 8, rpe: 8 }, { weight: 60, reps: 6, rpe: 9 }] },
      { name: "Shoulder Press", sets: [{ weight: 40, reps: 10, rpe: 7 }, { weight: 45, reps: 8, rpe: 8 }, { weight: 50, reps: 6, rpe: 9 }] }
    ]
  },
  "upper-body": {
    name: "Upper Body Focus",
    description: "Concentrate on chest, back, and arms",
    exercises: [
      { name: "Push-Ups", sets: [{ weight: 0, reps: 15, rpe: 7 }, { weight: 0, reps: 12, rpe: 8 }, { weight: 0, reps: 10, rpe: 9 }] },
      { name: "Pull-Ups", sets: [{ weight: 0, reps: 8, rpe: 7 }, { weight: 0, reps: 6, rpe: 8 }, { weight: 0, reps: 5, rpe: 9 }] },
      { name: "Dips", sets: [{ weight: 0, reps: 12, rpe: 7 }, { weight: 0, reps: 10, rpe: 8 }, { weight: 0, reps: 8, rpe: 9 }] },
      { name: "Bicep Curls", sets: [{ weight: 15, reps: 12, rpe: 7 }, { weight: 17.5, reps: 10, rpe: 8 }, { weight: 20, reps: 8, rpe: 9 }] }
    ]
  },
  "lower-body": {
    name: "Lower Body Focus",
    description: "Build strong legs and glutes",
    exercises: [
      { name: "Squats", sets: [{ weight: 80, reps: 10, rpe: 7 }, { weight: 85, reps: 8, rpe: 8 }, { weight: 90, reps: 6, rpe: 9 }] },
      { name: "Deadlifts", sets: [{ weight: 100, reps: 8, rpe: 7 }, { weight: 110, reps: 6, rpe: 8 }, { weight: 120, reps: 4, rpe: 9 }] },
      { name: "Leg Press", sets: [{ weight: 120, reps: 12, rpe: 7 }, { weight: 140, reps: 10, rpe: 8 }, { weight: 160, reps: 8, rpe: 9 }] },
      { name: "Lunges", sets: [{ weight: 40, reps: 10, rpe: 7 }, { weight: 45, reps: 8, rpe: 8 }, { weight: 50, reps: 6, rpe: 9 }] }
    ]
  }
}

// GET - List all available templates or get a specific template
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')
    
    if (templateId) {
      // Return a specific template
      const template = workoutTemplates[templateId as keyof typeof workoutTemplates]
      
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
      
      return NextResponse.json(template)
    } else {
      // Return list of all available templates
      const templates = Object.entries(workoutTemplates).map(([id, template]) => ({
        id,
        name: template.name,
        description: template.description,
        exerciseCount: template.exercises.length
      }))
      
      return NextResponse.json(templates)
    }
  } catch (error: any) {
    console.error('Error with templates:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// POST - Create a workout from a template
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const data = await request.json()
    const { templateId } = data
    
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }
    
    const template = workoutTemplates[templateId as keyof typeof workoutTemplates]
    
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    
    // Log the session user ID for debugging
    console.log('Creating workout from template with user ID:', session.user.id)
    
    // First verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    
    if (!user) {
      console.error('User not found in database:', session.user.id);
      
      // Try to create the user if it's the demo user
      if (session.user.id === 'demo-1') {
        try {
          const newUser = await prisma.user.create({
            data: {
              id: 'demo-1',
              name: session.user.name || 'Demo User',
              email: session.user.email || 'demo@example.com',
              image: session.user.image || 'https://ui-avatars.com/api/?name=Demo+User&background=0D8ABC&color=fff'
            }
          });
          console.log('Created missing demo user on the fly:', newUser);
        } catch (createError) {
          console.error('Failed to create missing demo user:', createError);
          return NextResponse.json(
            { error: 'Failed to create user account' }, 
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'User not found in database' }, 
          { status: 500 }
        );
      }
    }
    
    // Create workout with exercises and sets from the template
    const workout = await prisma.workout.create({
      data: {
        name: template.name,
        date: new Date(),
        userId: session.user.id,
        exercises: {
          create: template.exercises.map((exercise: any) => ({
            name: exercise.name,
            sets: {
              create: exercise.sets.map((set: any) => ({
                weight: set.weight,
                reps: set.reps,
                rpe: set.rpe || null,
              })),
            },
          })),
        },
      },
      include: {
        exercises: {
          include: {
            sets: true,
          },
        },
      },
    })
    
    console.log('Workout created successfully from template:', workout.id);
    return NextResponse.json(workout)
  } catch (error: any) {
    console.error('Error creating workout from template:', error)
    // Add more detailed error information
    if (error.meta) {
      console.error('Error metadata:', error.meta)
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
} 