'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Share2, Check, Copy } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "sonner"

interface SharePollProps {
  pollId: string
  topic: string
}

export function SharePoll({ pollId, topic }: SharePollProps) {
  const [isCopied, setIsCopied] = useState(false)
  const shareUrl = `${window.location.origin}/poll/${pollId}`

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setIsCopied(true)
    toast.success("Link copied to clipboard!")
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Vote on this poll: ${topic}`,
        url: shareUrl
      }).catch(console.error)
    } else {
      handleCopy()
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Share Poll
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium">Share this poll</h4>
          <div className="flex space-x-2">
            <Input 
              value={shareUrl} 
              readOnly 
              className="flex-grow"
            />
            <Button size="icon" onClick={handleCopy}>
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Button className="w-full" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

