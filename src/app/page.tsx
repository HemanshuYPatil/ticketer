import { LivePolls } from "@/components/live-polls"
import { Header } from "@/components/header"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              AI-Powered Voting App
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Create polls, share with others, and get AI-generated insights on the results.
            </p>
          </div>
          <LivePolls />
        </div>
      </main>
    </div>
  )
}

