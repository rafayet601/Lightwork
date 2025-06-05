'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import { Trophy, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

interface AchievementsClientProps {
  achievements: Achievement[];
}

export default function AchievementsClient({ achievements }: AchievementsClientProps) {
  // Group achievements by locked/unlocked
  const unlockedAchievements = achievements.filter(achievement => achievement.unlocked);
  const lockedAchievements = achievements.filter(achievement => !achievement.unlocked);
  
  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight gradient-text mb-4 sm:mb-0 flex items-center">
          <Trophy className="h-8 w-8 mr-3 text-primary" />
          Achievements
        </h1>
        <div className="bg-muted px-4 py-2 rounded-md text-muted-foreground flex items-center">
          <span className="font-medium text-foreground mr-2">{unlockedAchievements.length}</span> 
          of {achievements.length} unlocked
        </div>
      </motion.div>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-semibold">Unlocked Achievements</h2>
            <div className="h-px flex-grow bg-border ml-4"></div>
          </div>
          
          <motion.div
            variants={container}
            initial="hidden"
            animate="show" 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {unlockedAchievements.map((achievement) => (
              <motion.div key={achievement.id} variants={item}>
                <Card className="h-full border-glow bg-card/80 backdrop-blur-sm overflow-hidden">
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl">
                    Completed
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-4xl mr-4" aria-hidden="true">{achievement.icon}</span>
                        <div>
                          <CardTitle>{achievement.title}</CardTitle>
                          <CardDescription>{achievement.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span className="font-medium">{achievement.progress}/{achievement.maxProgress}</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" size="sm" className="w-full">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Achievement
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
      
      {/* Locked Achievements */}
      <div>
        <div className="flex items-center mb-6">
          <h2 className="text-2xl font-semibold">Next Challenges</h2>
          <div className="h-px flex-grow bg-border ml-4"></div>
        </div>
        
        <motion.div
          variants={container}
          initial="hidden"
          animate="show" 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {lockedAchievements.map((achievement) => (
            <motion.div key={achievement.id} variants={item}>
              <Card className="h-full bg-muted/50 border-muted">
                <CardHeader className="pb-2 opacity-70">
                  <div className="flex items-center">
                    <span className="text-4xl mr-4 grayscale" aria-hidden="true">{achievement.icon}</span>
                    <div>
                      <CardTitle>{achievement.title}</CardTitle>
                      <CardDescription>{achievement.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span className="font-medium">{achievement.progress}/{achievement.maxProgress}</span>
                  </div>
                  <Progress 
                    value={(achievement.progress / achievement.maxProgress) * 100} 
                    className="h-2"
                  />
                </CardContent>
                <CardFooter className="pt-0">
                  {achievement.progress > 0 && achievement.progress / achievement.maxProgress > 0.5 && (
                    <p className="text-xs text-center w-full text-muted-foreground">
                      Almost there! {Math.round((1 - achievement.progress / achievement.maxProgress) * 100)}% to go
                    </p>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
} 