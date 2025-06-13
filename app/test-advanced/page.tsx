'use client'

import { useState } from 'react'
import { 
  createAdvancedPeriodizationEngine,
  estimateTrainingReadiness,
  calculateOptimalVelocityLoss,
  type AdvancedTrainingParams,
  type ReadinessFactors
} from '@/lib/advanced-periodization'

export default function TestAdvancedPage() {
  const [result, setResult] = useState<any>(null)
  const [readiness, setReadiness] = useState<ReadinessFactors>({
    sleepQuality: 8,
    stressLevel: 3,
    energyLevel: 8,
    musclesoreness: 3,
    motivation: 9
  })

  const generateAdvancedWorkout = () => {
    try {
      // Test the advanced periodization system
      const params: AdvancedTrainingParams = {
        exercise: 'Squat',
        currentMax: 225,
        targetMax: 275,
        timeframe: 12,
        enableVBT: true,
        periodizationModel: 'dup_hps',
        autoregulationMethod: 'readiness',
        targetVelocityLoss: calculateOptimalVelocityLoss('strength'),
        experienceLevel: 'intermediate',
        primaryAdaptation: 'maximal_strength',
        recoverability: 'average',
        trainingAge: 3
      }

      const engine = createAdvancedPeriodizationEngine(params)
      
      const session = engine.generateSmartWorkout({
        weekNumber: 4,
        sessionNumber: 2, // Power day in HPS rotation
        readiness,
        recentPerformance: [
          { exercise: 'Squat', rpe: 8, velocityLoss: 22 }
        ]
      })

      const readinessAssessment = estimateTrainingReadiness(readiness)

      setResult({
        session,
        readinessAssessment,
        params
      })
    } catch (error) {
      console.error('Error:', error)
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🧠 Advanced AI Training System Test
          </h1>

          {/* Readiness Assessment */}
          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              📊 Training Readiness Assessment
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Sleep Quality
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={readiness.sleepQuality}
                  onChange={(e) => setReadiness(prev => ({
                    ...prev,
                    sleepQuality: parseInt(e.target.value)
                  }))}
                  className="w-full"
                />
                <span className="text-sm text-blue-600">{readiness.sleepQuality}/10</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Stress Level
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={readiness.stressLevel}
                  onChange={(e) => setReadiness(prev => ({
                    ...prev,
                    stressLevel: parseInt(e.target.value)
                  }))}
                  className="w-full"
                />
                <span className="text-sm text-blue-600">{readiness.stressLevel}/10</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Energy Level
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={readiness.energyLevel}
                  onChange={(e) => setReadiness(prev => ({
                    ...prev,
                    energyLevel: parseInt(e.target.value)
                  }))}
                  className="w-full"
                />
                <span className="text-sm text-blue-600">{readiness.energyLevel}/10</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Muscle Soreness
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={readiness.musclesoreness}
                  onChange={(e) => setReadiness(prev => ({
                    ...prev,
                    musclesoreness: parseInt(e.target.value)
                  }))}
                  className="w-full"
                />
                <span className="text-sm text-blue-600">{readiness.musclesoreness}/10</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Motivation
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={readiness.motivation}
                  onChange={(e) => setReadiness(prev => ({
                    ...prev,
                    motivation: parseInt(e.target.value)
                  }))}
                  className="w-full"
                />
                <span className="text-sm text-blue-600">{readiness.motivation}/10</span>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="text-center mb-8">
            <button
              onClick={generateAdvancedWorkout}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              🚀 Generate Advanced Workout
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-6">
              {result.error ? (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h3 className="text-red-800 font-semibold">Error:</h3>
                  <p className="text-red-700">{result.error}</p>
                </div>
              ) : (
                <>
                  {/* Training Parameters */}
                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4">
                      🔬 Training Parameters
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-purple-700 font-medium">Exercise:</span>
                        <div className="text-purple-900">{result.params.exercise}</div>
                      </div>
                      <div>
                        <span className="text-purple-700 font-medium">Current Max:</span>
                        <div className="text-purple-900">{result.params.currentMax} lbs</div>
                      </div>
                      <div>
                        <span className="text-purple-700 font-medium">Target Max:</span>
                        <div className="text-purple-900">{result.params.targetMax} lbs</div>
                      </div>
                      <div>
                        <span className="text-purple-700 font-medium">Periodization:</span>
                        <div className="text-purple-900">{result.params.periodizationModel.toUpperCase()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Readiness Assessment */}
                  <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-4">
                      🧠 Readiness Assessment Results
                    </h3>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-yellow-800">
                          {Math.round(result.readinessAssessment.score * 10)}/10
                        </div>
                        <div className="text-yellow-700">Readiness Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-semibold text-yellow-800 capitalize">
                          {result.readinessAssessment.recommendation}
                        </div>
                        <div className="text-yellow-700">Recommendation</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-semibold text-yellow-800">
                          {Math.round((result.readinessAssessment.adjustment - 1) * 100)}%
                        </div>
                        <div className="text-yellow-700">Load Adjustment</div>
                      </div>
                    </div>
                  </div>

                  {/* Workout Session */}
                  <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">
                      💪 Generated Workout Session
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <span className="text-green-700 font-medium">Session Type:</span>
                          <div className="text-green-900 capitalize">{result.session.type}</div>
                        </div>
                        <div>
                          <span className="text-green-700 font-medium">Focus:</span>
                          <div className="text-green-900">{result.session.focus}</div>
                        </div>
                        <div>
                          <span className="text-green-700 font-medium">Duration:</span>
                          <div className="text-green-900">{result.session.estimatedDuration} min</div>
                        </div>
                        <div>
                          <span className="text-green-700 font-medium">Total Volume:</span>
                          <div className="text-green-900">{result.session.totalVolume || 'TBD'}</div>
                        </div>
                      </div>

                      {/* Exercise Details */}
                      {result.session.exercises.map((exercise: any, index: number) => (
                        <div key={index} className="bg-white p-4 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-900 mb-3">{exercise.name}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
                            <div>
                              <span className="text-green-700">Sets:</span>
                              <div className="font-medium">{exercise.sets}</div>
                            </div>
                            <div>
                              <span className="text-green-700">Reps:</span>
                              <div className="font-medium">
                                {Array.isArray(exercise.reps) ? exercise.reps.join(', ') : exercise.reps}
                              </div>
                            </div>
                            <div>
                              <span className="text-green-700">Intensity:</span>
                              <div className="font-medium">
                                {typeof exercise.intensity === 'number' 
                                  ? `${Math.round(exercise.intensity * 100)}%` 
                                  : exercise.intensity}
                              </div>
                            </div>
                            <div>
                              <span className="text-green-700">RPE Target:</span>
                              <div className="font-medium">{exercise.rpeTarget || 'N/A'}</div>
                            </div>
                            <div>
                              <span className="text-green-700">Velocity Loss:</span>
                              <div className="font-medium">{exercise.velocityLossTarget || 'N/A'}%</div>
                            </div>
                            <div>
                              <span className="text-green-700">Rest:</span>
                              <div className="font-medium">
                                {exercise.restPeriods?.join('-') || '180'}s
                              </div>
                            </div>
                          </div>
                          {exercise.notes && (
                            <div className="mt-3 p-3 bg-green-100 rounded-md">
                              <span className="text-green-800 text-sm font-medium">Coaching Notes:</span>
                              <p className="text-green-700 text-sm mt-1">{exercise.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Scientific Rationale */}
                      {result.session.scientificRationale && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-2">
                            📚 Scientific Rationale
                          </h4>
                          <pre className="text-sm text-blue-800 whitespace-pre-wrap">
                            {result.session.scientificRationale}
                          </pre>
                        </div>
                      )}

                      {/* Coaching Notes */}
                      {result.session.coachingNotes && (
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                          <h4 className="font-semibold text-indigo-900 mb-2">
                            🎯 Coaching Notes
                          </h4>
                          <pre className="text-sm text-indigo-800 whitespace-pre-wrap">
                            {result.session.coachingNotes}
                          </pre>
                        </div>
                      )}

                      {/* VBT Protocol */}
                      {result.session.vbtProtocol && (
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <h4 className="font-semibold text-purple-900 mb-2">
                            ⚡ VBT Protocol
                          </h4>
                          <div className="text-sm space-y-2">
                            <div>
                              <span className="text-purple-700 font-medium">Load Selection:</span>
                              <span className="ml-2 text-purple-800">{result.session.vbtProtocol.loadSelection}</span>
                            </div>
                            <div>
                              <span className="text-purple-700 font-medium">Stop Criteria:</span>
                              <span className="ml-2 text-purple-800">{result.session.vbtProtocol.stopCriteria}</span>
                            </div>
                            <div>
                              <span className="text-purple-700 font-medium">Feedback:</span>
                              <span className="ml-2 text-purple-800">{result.session.vbtProtocol.feedbackType}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 