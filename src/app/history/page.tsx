import { VoteHistory } from "@/components/vote-history"
import { Header } from "@/components/header"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function HistoryPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold">Your Voting History</h1>
          <VoteHistory userId={userId} />
        </div>
      </main>
    </div>
  )
}

