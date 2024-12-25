'use client'

import { useState } from "react"
import { Loader2, Wand2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { createPoll, generatePollOptions } from "@/lib/actions"
import { useRouter } from 'next/navigation'
import { useUser } from "@clerk/nextjs"

export function CreatePollForm() {
  const [topic, setTopic] = useState("")
  const [options, setOptions] = useState(["", "", "", ""])
  const [isPublic, setIsPublic] = useState(true)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()
  const { user } = useUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error("You must be logged in to create a poll")
      return
    }
    if (!topic.trim()) {
      toast.error("Please enter a topic for your poll")
      return
    }
    if (options.some(opt => !opt.trim())) {
      toast.error("Please fill in all option fields")
      return
    }
    if (!startTime || !endTime) {
      toast.error("Please set start and end times for your poll")
      return
    }

    const formData = new FormData()
    formData.append('topic', topic)
    formData.append('options', JSON.stringify(options))
    formData.append('isPublic', isPublic.toString())
    formData.append('startTime', startTime)
    formData.append('endTime', endTime)

    try {
      const poll = await createPoll(formData)
      toast.success("Poll created successfully!")
      router.push(`/poll/${poll.id}`)
    } catch (error) {
      toast.error("Failed to create poll. Please try again.")
    }
  }

  const handleGenerateOptions = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic first")
      return
    }
    setIsGenerating(true)
    try {
      const result = await generatePollOptions(topic)
      if (result.success && result.data) {
        setOptions(result.data)
        toast.success("Options generated successfully!")
      } else {
        throw new Error("Failed to generate options")
      }
    } catch (error) {
      toast.error("Failed to generate options. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create a New Poll</CardTitle>
        <CardDescription>
          Enter your poll topic, options, and settings. Let AI generate options for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Poll Topic</Label>
            <Input
              id="topic"
              placeholder="Enter your poll topic..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Options</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateOptions}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Options
                  </>
                )}
              </Button>
            </div>
            {options.map((option, index) => (
              <Input
                key={index}
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) => {
                  const newOptions = [...options]
                  newOptions[index] = e.target.value
                  setOptions(newOptions)
                }}
              />
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <Label htmlFor="public">Make poll public</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" className="w-full">
            Create Poll
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

