'use client'

import { useState } from "react"
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

interface VotePollProps {
  topic: string
  options: string[]
  onVote: (optionIndex: number) => void
}

export function VotePoll({ topic, options, onVote }: VotePollProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  const handleVote = () => {
    if (selectedOption !== null) {
      onVote(selectedOption)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{topic}</CardTitle>
        <CardDescription>Select an option and cast your vote</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup className="space-y-4" onValueChange={(value) => setSelectedOption(Number(value))}>
          {options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={index.toString()} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>
        <Button onClick={handleVote} className="w-full mt-4" disabled={selectedOption === null}>
          Vote
        </Button>
      </CardContent>
    </Card>
  )
}

