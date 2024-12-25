'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getPublicPolls } from '@/lib/actions'
import { supabase } from '@/lib/supabase'

interface Poll {
  id: string
  topic: string
  startTime: string
  endTime: string
}

export function LivePolls() {
  const [polls, setPolls] = useState<Poll[]>([])

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const data = await getPublicPolls()
        const now = new Date().getTime()
        const activePolls = data.filter((poll: Poll) => {
          const startTime = new Date(poll.startTime).getTime()
          const endTime = new Date(poll.endTime).getTime()
          return now >= startTime && now < endTime
        })
        setPolls(activePolls as any)
      } catch (error) {
        console.error('Failed to fetch polls:', error)
      }
    }

    fetchPolls()

    const channel = supabase
      .channel('public:Poll')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Poll' }, fetchPolls)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Polls</CardTitle>
        <CardDescription>Vote on ongoing public polls</CardDescription>
      </CardHeader>
      <CardContent>
        {polls.length === 0 ? (
          <p>No active polls at the moment.</p>
        ) : (
          <ul className="space-y-4">
            {polls.map((poll) => (
              <li key={poll.id} className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{poll.topic}</h3>
                  <p className="text-sm text-muted-foreground">
                    Ends: {new Date(poll.endTime).toLocaleString()}
                  </p>
                </div>
                <Button asChild>
                  <Link href={`/poll/${poll.id}`}>Vote</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

