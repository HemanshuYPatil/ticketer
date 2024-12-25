'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "")

async function getOrCreateUser(clerkId: string, email: string, name: string | null) {
  let user = await prisma.user.findUnique({
    where: { clerkId },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId,
        email,
        name,
      },
    })
  }

  return user
}

export async function createPoll(formData: FormData) {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("User not authenticated")
  }

  const user = await getOrCreateUser(userId, 'user@example.com', 'User Name') // Replace with actual user data from Clerk

  const topic = formData.get('topic') as string
  const options = JSON.parse(formData.get('options') as string)
  const isPublic = formData.get('isPublic') === 'true'
  const startTime = new Date(formData.get('startTime') as string)
  const endTime = new Date(formData.get('endTime') as string)

  const poll = await prisma.poll.create({
    data: {
      topic,
      options,
      isPublic,
      startTime,
      endTime,
      createdBy: user.id,
    },
  })

  // Add Supabase insert
  await supabase.from('Poll').insert(poll)

  revalidatePath('/')
  return poll
}

export async function getPublicPolls() {
  return prisma.poll.findMany({
    where: {
      isPublic: true,
      endTime: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getPollById(id: string) {
  const poll = await prisma.poll.findUnique({
    where: { id },
  })

  if (!poll) {
    return null
  }

  return {
    ...poll,
    startTime: poll.startTime.toISOString(),
    endTime: poll.endTime.toISOString(),
  }
}

export async function votePoll(pollId: string, optionIndex: number, userId: string) {
  const vote = await prisma.vote.create({
    data: {
      pollId,
      userId,
      optionIndex,
    },
  })

  // Add Supabase insert
  await supabase.from('Vote').insert(vote)

  revalidatePath(`/poll/${pollId}`)
  return vote
}

export async function getUserVoteHistory(userId: string) {
  return prisma.vote.findMany({
    where: { userId },
    include: {
      poll: {
        select: {
          id: true,
          topic: true,
          options: true,
          isPublic: true,
          endTime: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getPollResults(pollId: string) {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      votes: {
        select: {
          optionIndex: true,
          userId: true,
        },
      },
    },
  })

  if (!poll) throw new Error('Poll not found')

  const results = poll.options.map((_, index) => 
    poll.votes.filter(vote => vote.optionIndex === index).length
  )

  return { poll, results, votes: poll.votes }
}

export async function generatePollOptions(topic: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const result = await model.generateContent(`
      Generate 4 creative and diverse options for a poll on the topic: "${topic}"
      Format the response as a JSON array of strings.
      Example: ["Option 1", "Option 2", "Option 3", "Option 4"]
    `)

    const response = result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('Invalid response format')
    }

    const options = JSON.parse(jsonMatch[0])
    return { success: true, data: options }
  } catch (error) {
    console.error('Error generating poll options:', error)
    return { success: false, error: 'Failed to generate poll options' }
  }
}


export async function analyzeResults(pollId: string) {
  const { poll, results } = await getPollResults(pollId)

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const result = await model.generateContent(`
      Analyze the results of a poll on the topic: "${poll.topic}"
      Options and votes:
      ${poll.options.map((opt: string, i: number) => `${opt}: ${results[i]} votes`).join('\n')}

      Provide a brief analysis of the results, including:
      1. The winning option and its significance
      2. Any surprising outcomes or close races
      3. Possible reasons for the voting distribution
      4. Suggestions for a follow-up poll or action based on these results

      Format the response as a JSON object with the following structure:
      {
        "winner": "Winning option",
        "analysis": "Brief analysis of the results",
        "followUp": "Suggestion for a follow-up poll or action"
      }
    `)

    const response = result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid response format')
    }

    const analysis = JSON.parse(jsonMatch[0])
    if (analysis.success) {
      // Add Supabase update
      await supabase
        .from('Poll')
        .update({ analysis: analysis.data })
        .eq('id', pollId)
    }

    return analysis
  } catch (error) {
    console.error('Error analyzing poll results:', error)
    return { success: false, error: 'Failed to analyze poll results' }
  }
}


export async function getDashboardStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user) throw new Error('User not found')

  const totalPolls = await prisma.poll.count({
    where: { createdBy: user.id },
  })

  const totalVotes = await prisma.vote.count({
    where: { poll: { createdBy: user.id } },
  })

  const mostPopularPoll = await prisma.poll.findFirst({
    where: { createdBy: user.id },
    orderBy: { votes: { _count: 'desc' } },
    select: {
      topic: true,
      _count: { select: { votes: true } },
    },
  })

  return {
    totalPolls,
    totalVotes,
    mostPopularPoll: mostPopularPoll
      ? { topic: mostPopularPoll.topic, votes: mostPopularPoll._count.votes }
      : null,
  }
}
export async function getUserPolls(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    const polls = await prisma.poll.findMany({
      where: { createdBy: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return polls
  } catch (error) {
    console.error('Error fetching user polls:', error)
    return []
  }
}

export async function getVoterDetails(pollId: string) {
  const votes = await prisma.vote.findMany({
    where: { pollId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return votes.map(vote => ({
    id: vote.id,
    name: vote.user.name || 'Anonymous',
    email: vote.user.email || 'N/A',
    votedAt: vote.createdAt.toISOString(),
  }))
}

export async function syncWithSupabase() {
  const { data: polls, error: pollsError } = await supabase
    .from('Poll')
    .select('*')

  if (pollsError) {
    console.error('Error fetching polls:', pollsError)
    return
  }

  for (const poll of polls) {
    await prisma.poll.upsert({
      where: { id: poll.id },
      update: poll,
      create: poll,
    })
  }

  const { data: votes, error: votesError } = await supabase
    .from('Vote')
    .select('*')

  if (votesError) {
    console.error('Error fetching votes:', votesError)
    return
  }

  for (const vote of votes) {
    await prisma.vote.upsert({
      where: { id: vote.id },
      update: vote,
      create: vote,
    })
  }

  console.log('Database sync completed')
}