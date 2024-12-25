'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { analyzeResults } from "@/lib/actions"

interface PollResultsProps {
  pollId: string
  topic: string
  options: string[]
  initialVotes: number[]
}

export function PollResults({ pollId, topic, options, initialVotes }: PollResultsProps) {
  const [analysis, setAnalysis] = useState<{ winner: string; analysis: string; followUp: string } | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [votes, setVotes] = useState(initialVotes)

  useEffect(() => {
    const channel = supabase
      .channel(`poll-${pollId}-results`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Vote', filter: `pollId=eq.${pollId}` }, 
        (payload) => {
          setVotes((prev) => {
            const newVotes = [...prev]
            newVotes[payload.new.optionIndex]++
            return newVotes
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [pollId])

  const totalVotes = votes.reduce((sum, count) => sum + count, 0)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      const result = await analyzeResults(pollId)
      setAnalysis(result)
    } catch (error) {
      console.error("Failed to analyze results:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{topic}</CardTitle>
        <CardDescription>Poll Results (Total Votes: {totalVotes})</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {options.map((option, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{option}</span>
              <span>{votes[index]} votes ({((votes[index] / totalVotes) * 100).toFixed(1)}%)</span>
            </div>
            <Progress value={(votes[index] / totalVotes) * 100} />
          </div>
        ))}
        <div className="flex justify-between items-center">
          <Button onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Results
              </>
            ) : (
              'Analyze Results'
            )}
          </Button>
          <Button asChild variant="outline">
            <Link href={`/poll/${pollId}/voters`}>
              <Users className="mr-2 h-4 w-4" />
              View Voters
            </Link>
          </Button>
        </div>
        {analysis && (
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold">Analysis</h3>
            <p><strong>Winner:</strong> {analysis.winner}</p>
            <p>{analysis.analysis}</p>
            <p><strong>Follow-up suggestion:</strong> {analysis.followUp}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

