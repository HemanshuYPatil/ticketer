'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getDashboardStats } from '@/app/actions'
import { supabase } from '@/lib/supabase'

interface DashboardStatsProps {
  userId: string
}

interface Stats {
  totalPolls: number
  totalVotes: number
  mostPopularPoll: {
    topic: string
    votes: number
  } | null
}

export function DashboardStats({ userId }: DashboardStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      const data = await getDashboardStats(userId)
      setStats(data)
    }

    fetchStats()

    const channel = supabase
      .channel(`user-${userId}-stats`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Poll' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Vote' }, fetchStats)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  if (!stats) {
    return <div>Loading...</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Total Polls</CardTitle>
          <CardDescription>Number of polls you've created</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.totalPolls}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total Votes</CardTitle>
          <CardDescription>Number of votes across all your polls</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.totalVotes}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Most Popular Poll</CardTitle>
          <CardDescription>Your poll with the most votes</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.mostPopularPoll ? (
            <>
              <p className="font-semibold">{stats.mostPopularPoll.topic}</p>
              <p className="text-sm text-muted-foreground">{stats.mostPopularPoll.votes} votes</p>
            </>
          ) : (
            <p>No polls with votes yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

