'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Mic, MicOff, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

// TypeScript declarations for Speech Recognition API
declare global {
  interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }
}

interface VoiceInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  label?: string
}

export default function VoiceInput({ 
  value, 
  onChange, 
  placeholder = "Type or speak...", 
  className = "",
  label 
}: VoiceInputProps) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const [supported, setSupported] = useState(true)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Check if speech recognition is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSupported(false)
    }
  }, [])

  const startListening = () => {
    setError('')
    setTranscript('')
    
    if (!supported) {
      setError('Voice recognition not supported in this browser.')
      return
    }

    try {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.lang = 'en-US'
      recognition.interimResults = true
      recognition.maxAlternatives = 1
      recognition.continuous = false

      recognition.onstart = () => {
        setListening(true)
        setError('')
      }

      recognition.onresult = (event: any) => {
        const current = event.resultIndex
        const transcript = event.results[current][0].transcript
        
        if (event.results[current].isFinal) {
          onChange(value + (value ? ' ' : '') + transcript)
          setTranscript('')
        } else {
          setTranscript(transcript)
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        let errorMessage = 'Voice recognition error'
        
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.'
            break
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.'
            break
          case 'network':
            errorMessage = 'Network error. Please check your connection.'
            break
          default:
            errorMessage = `Voice recognition error: ${event.error}`
        }
        
        setError(errorMessage)
        setListening(false)
        setTranscript('')
      }

      recognition.onend = () => {
        setListening(false)
        setTranscript('')
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      setError('Failed to start voice recognition.')
      setListening(false)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setListening(false)
    setTranscript('')
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-purple-200">{label}</label>}
      
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full p-3 pr-12 border border-purple-600 rounded-lg bg-slate-800 text-purple-100 placeholder:text-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${className}`}
        />
        
        {supported && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={listening ? stopListening : startListening}
            className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full transition-all duration-200 border ${
              listening 
                ? 'bg-red-950/80 text-red-400 hover:bg-red-900/80 animate-pulse border-red-800' 
                : 'bg-slate-900/80 text-purple-400 hover:bg-slate-800/80 border-purple-700'
            }`}
            aria-label={listening ? 'Stop voice input' : 'Start voice input'}
          >
            {listening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Live transcript preview */}
      {transcript && (
        <div className="text-sm text-blue-300 bg-blue-900/50 p-2 rounded-md border border-blue-600">
          <Volume2 className="h-3 w-3 inline mr-1" />
          Hearing: "{transcript}"
        </div>
      )}

      {/* Status messages */}
      {listening && (
        <div className="text-sm text-blue-300 flex items-center gap-2">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          Listening... Speak now
        </div>
      )}

      {error && (
        <div className="text-sm text-red-300 bg-red-900/50 p-2 rounded-md border border-red-600">
          {error}
        </div>
      )}

      {!supported && (
        <div className="text-sm text-amber-300 bg-amber-900/50 p-2 rounded-md border border-amber-600">
          Voice input not supported in this browser. Try Chrome or Edge.
        </div>
      )}
    </div>
  )
} 