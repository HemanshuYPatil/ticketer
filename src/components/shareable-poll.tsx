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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { votePoll } from "@/lib/actions"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { supabase } from '@/lib/supabase'

interface ShareablePollProps {
  pollId: string
  topic: string
  options: string[]
  startTime: string
  endTime: string
}

export function ShareablePoll({ pollId, topic, options, startTime, endTime }: ShareablePollProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [votes, setVotes] = useState<number[]>(new Array(options.length).fill(0))
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date().getTime()
      const start = new Date(startTime).getTime()
      const end = new Date(endTime).getTime()

      if (now < start) {
        setTimeLeft(start - now)
      } else if (now < end) {
        setTimeLeft(end - now)
      } else {
        setTimeLeft(0)
      }
    }

    updateTimeLeft()
    const timer = setInterval(updateTimeLeft, 1000)

    const fetchVotes = async () => {
      const { data, error } = await supabase
        .from('Vote')
        .select('optionIndex')
        .eq('pollId', pollId)

      if (error) {
        console.error('Error fetching votes:', error)
        return
      }

      const newVotes = new Array(options.length).fill(0)
      data.forEach((vote) => {
        newVotes[vote.optionIndex]++
      })
      setVotes(newVotes)
    }

    fetchVotes()

    const channel = supabase
      .channel(`poll-${pollId}`)
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
      clearInterval(timer)
      supabase.removeChannel(channel)
    }
  }, [pollId, startTime, endTime, options.length])

  const handleVote = async () => {
    if (!isLoaded) return

    if (!user) {
      toast.error("You must be logged in to vote")
      router.push('/sign-in')
      return
    }

    if (selectedOption !== null && !hasVoted && isPollActive) {
      try {
        await votePoll(pollId, selectedOption, user.id)
        setHasVoted(true)
        toast.success("Your vote has been recorded!")
      } catch (error) {
        toast.error("Failed to submit vote. Please try again.")
      }
    }
  }

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`
  }

  const isPollActive = timeLeft !== null && timeLeft > 0 && new Date().getTime() >= new Date(startTime).getTime()
  const isPollNotStarted = new Date().getTime() < new Date(startTime).getTime()

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{topic}</CardTitle>
        <CardDescription>
          {isPollNotStarted
            ? "This poll hasn't started yet"
            : isPollActive
            ? "Select an option and cast your vote"
            : "This poll has ended"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {timeLeft !== null && (
          <div className="mb-4 text-center">
            <p className="text-2xl font-bold">{formatTime(timeLeft)}</p>
            <p className="text-sm text-muted-foreground">
              {isPollNotStarted ? "until poll starts" : isPollActive ? "left to vote" : "Poll has ended"}
            </p>
          </div>
        )}
        <RadioGroup
          className="space-y-4"
          onValueChange={(value) => setSelectedOption(Number(value))}
          disabled={!isPollActive || hasVoted}
        >
          {options.map((option, index) => (
            <div key={index} className="flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`}>{option}</Label>
              </div>
              <span className="text-sm text-muted-foreground">{votes[index]} votes</span>
            </div>
          ))}
        </RadioGroup>
        <Button
          onClick={handleVote}
          className="w-full mt-4"
          disabled={selectedOption === null || !isPollActive || hasVoted || !isLoaded}
        >
          {!isLoaded ? 'Loading...' : hasVoted ? 'Vote Recorded' : 'Vote'}
        </Button>
      </CardContent>
    </Card>
  )
}

