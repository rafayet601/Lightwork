'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Timer, Play, Pause, RotateCcw, SkipForward } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface WorkoutTimerProps {
  defaultRestTime?: number; // in seconds
  onTimerComplete?: () => void;
  onSkip?: () => void;
}

export default function WorkoutTimer({
  defaultRestTime = 90,
  onTimerComplete,
  onSkip
}: WorkoutTimerProps) {
  const [restTime, setRestTime] = useState(defaultRestTime);
  const [timeRemaining, setTimeRemaining] = useState(restTime);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/sounds/timer-complete.mp3');
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current as NodeJS.Timeout);
            setIsRunning(false);
            setIsCompleted(true);
            // Play sound when timer completes
            audioRef.current?.play().catch((e) => console.error('Error playing sound:', e));
            onTimerComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining, onTimerComplete]);

  const startTimer = () => {
    setIsRunning(true);
    setIsCompleted(false);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeRemaining(restTime);
    setIsCompleted(false);
  };

  const skipTimer = () => {
    setIsRunning(false);
    setTimeRemaining(0);
    setIsCompleted(true);
    onSkip?.();
  };

  const changeRestTime = (value: number[]) => {
    const newTime = value[0];
    setRestTime(newTime);
    if (!isRunning) {
      setTimeRemaining(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getProgressPercentage = () => {
    return Math.max(0, Math.min(100, ((restTime - timeRemaining) / restTime) * 100));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-0 right-0 mx-auto max-w-sm z-50"
    >
      <Card className="border-glow shadow-lg bg-card/90 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Timer className="h-5 w-5 mr-2 text-primary" />
            Rest Timer
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex flex-col items-center">
            <div className="relative w-full h-32 flex items-center justify-center mb-4">
              <div
                className="absolute bottom-0 left-0 h-1 bg-primary/10 rounded-full"
                style={{ width: '100%' }}
              />
              <div
                className="absolute bottom-0 left-0 h-1 bg-primary rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${getProgressPercentage()}%` }}
              />
              <AnimatePresence mode="wait">
                <motion.div
                  key={isCompleted ? 'completed' : 'time'}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-4xl font-bold"
                >
                  {isCompleted ? 'Rest Complete!' : formatTime(timeRemaining)}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {!isCompleted && (
              <div className="w-full mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Rest Duration</span>
                  <span>{formatTime(restTime)}</span>
                </div>
                <Slider
                  value={[restTime]}
                  min={15}
                  max={300}
                  step={15}
                  onValueChange={changeRestTime}
                  disabled={isRunning}
                />
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {isCompleted ? (
            <>
              <Button variant="outline" size="sm" onClick={resetTimer}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button variant="default" size="sm" onClick={onSkip}>
                <SkipForward className="h-4 w-4 mr-1" />
                Next Exercise
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={resetTimer}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              {isRunning ? (
                <Button variant="outline" size="sm" onClick={pauseTimer}>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
              ) : (
                <Button variant="default" size="sm" onClick={startTimer}>
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={skipTimer}>
                <SkipForward className="h-4 w-4 mr-1" />
                Skip
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
} 