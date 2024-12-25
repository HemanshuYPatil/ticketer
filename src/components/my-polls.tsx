'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getUserPolls } from '@/lib/actions'
import { supabase } from '@/lib/supabase'

interface Poll {
  id: string
  topic: string
  isPublic: boolean
  startTime: string
  endTime: string
}

export function MyPolls({ userId }: { userId: string }) {
  const [polls, setPolls] = useState<Poll[]>([])

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const data = await getUserPolls(userId)
        setPolls(data as any || [])
      } catch (error) {
        console.error('Failed to fetch polls:', error)
        setPolls([])
      }
    }

    fetchPolls()

    const channel = supabase
      .channel('poll-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Poll' }, fetchPolls)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Polls</CardTitle>
        <CardDescription>View and manage your created polls</CardDescription>
      </CardHeader>
      <CardContent>
        {!polls ? (
          <p>Loading...</p>
        ) : polls.length === 0 ? (
          <p>You haven't created any polls yet.</p>
        ) : (
          <ul className="space-y-4">
            {polls.map((poll) => (
              <li key={poll.id} className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{poll.topic}</h3>
                  <p className="text-sm text-muted-foreground">
                    {poll.isPublic ? 'Public' : 'Private'} | 
                    Ends: {new Date(poll.endTime).toLocaleString()}
                  </p>
                </div>
                <Button asChild>
                  <Link href={`/poll/${poll.id}`}>View</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

