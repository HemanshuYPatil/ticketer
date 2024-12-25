'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from '@/lib/supabase'

interface Vote {
  userId: string
  optionIndex: number
}

interface VoterListProps {
  pollId: string
  initialVotes: Vote[]
}

export function VoterList({ pollId, initialVotes }: VoterListProps) {
  const [votes, setVotes] = useState<Vote[]>(initialVotes)

  useEffect(() => {
    const channel = supabase
      .channel(`poll-${pollId}-votes`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Vote', filter: `pollId=eq.${pollId}` }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setVotes(prev => [...prev, payload.new as Vote])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [pollId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voter List</CardTitle>
      </CardHeader>
      <CardContent>
        {votes.length === 0 ? (
          <p>No votes have been cast yet.</p>
        ) : (
          <ul className="space-y-2">
            {votes.map((vote, index) => (
              <li key={index} className="flex justify-between items-center">
                <span>User {vote.userId}</span>
                <span>Voted for Option {vote.optionIndex + 1}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

