import { Header } from "@/components/header"
import { VoterList } from "@/components/voter-list"
import { getPollResults } from "@/lib/actions"

export default async function VoterListPage({ params }: { params: { pollId: string } }) {
  const { poll, votes } = await getPollResults(params.pollId)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold">Voters for: {poll.topic}</h1>
          <VoterList votes={votes} />
        </div>
      </main>
    </div>
  )
}

