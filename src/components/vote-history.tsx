'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getUserVoteHistory } from '@/lib/actions'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface VoteHistoryItem {
  id: string
  createdAt: string
  optionIndex: number
  poll: {
    id: string
    topic: string
    options: string[]
    isPublic: boolean
    endTime: string
  }
}

export function VoteHistory({ userId }: { userId: string }) {
  const [history, setHistory] = useState<VoteHistoryItem[]>([])

  useEffect(() => {
    const fetchHistory = async () => {
      const data = await getUserVoteHistory(userId)
      setHistory(data as any)
    }

    fetchHistory()

    const channel = supabase
      .channel(`user-${userId}-votes`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Vote', filter: `userId=eq.${userId}` }, 
        fetchHistory
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Voting History</CardTitle>
        <CardDescription>A list of polls you've participated in</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p>You haven't voted in any polls yet.</p>
        ) : (
          <ul className="space-y-4">
            {history.map((item) => (
              <li key={item.id} className="border-b pb-4">
                <h3 className="font-semibold">
                  <Link href={`/poll/${item.poll.id}`} className="hover:underline">
                    {item.poll.topic}
                  </Link>
                </h3>
                <p className="text-sm text-muted-foreground">
                  {item.poll.isPublic ? 'Public' : 'Private'} | 
                  Voted on: {new Date(item.createdAt).toLocaleString()}
                </p>
                <p className="text-sm mt-1">
                  Your vote: <span className="font-medium">{item.poll.options[item.optionIndex]}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(item.poll.endTime) > new Date() ? 'Ongoing' : 'Ended'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

