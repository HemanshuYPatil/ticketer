import { Header } from "@/components/header"
import { VoterTable } from "@/components/voter-table"
import { getPollById } from "@/lib/actions"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function VoterListPage({ params }: { params: { id: string } }) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const poll = await getPollById(params.id)

  if (!poll) {
    redirect('/404')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold">Voters for: {poll.topic}</h1>
          <VoterTable pollId={poll.id} />
        </div>
      </main>
    </div>
  )
}

