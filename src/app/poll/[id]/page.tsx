import { ShareablePoll } from "@/components/shareable-poll"
import { PollResults } from "@/components/poll-results"
import { SharePoll } from "@/components/share-poll"
import { Header } from "@/components/header"
import { getPollById, getPollResults } from "@/lib/actions"
import { notFound } from "next/navigation"

export default async function PollPage({ params }: { params: { id: string } }) {
  const poll = await getPollById(params.id)

  if (!poll) {
    notFound()
  }

  const { results } = await getPollResults(params.id)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">{poll.topic}</h1>
            <SharePoll pollId={poll.id} topic={poll.topic} />
          </div>
          <ShareablePoll
            pollId={poll.id}
            topic={poll.topic}
            options={poll.options}
            startTime={poll.startTime}
            endTime={poll.endTime}
          />
          <PollResults
            pollId={poll.id}
            topic={poll.topic}
            options={poll.options}
            initialVotes={results}
          />
        </div>
      </main>
    </div>
  )
}

