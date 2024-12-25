// import { VoteHistory } from "@/components/vote-history"
import { CreatePollForm } from "@/components/create-poll-form";
import { Header } from "@/components/header";

export default async function CreatePoll() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4 mt-3">
        
        <div>
          <CreatePollForm />
        </div>
      </main>
    </div>
  );
}
