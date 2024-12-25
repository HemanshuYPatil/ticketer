'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { getVoterDetails, getPollById } from "@/lib/actions"
import { supabase } from '@/lib/supabase'
import { Download } from 'lucide-react'
import { jsPDF } from "jspdf"
import "jspdf-autotable"

interface Voter {
  id: string
  name: string
  email: string
  votedAt: string
}

export function VoterTable({ pollId }: { pollId: string }) {
  const [voters, setVoters] = useState<Voter[]>([])
  const [pollDetails, setPollDetails] = useState<any>(null)

  useEffect(() => {
    const fetchVoters = async () => {
      const data = await getVoterDetails(pollId)
      setVoters(data)
    }

    const fetchPollDetails = async () => {
      const data = await getPollById(pollId)
      setPollDetails(data)
    }

    fetchVoters()
    fetchPollDetails()

    const channel = supabase
      .channel(`poll-${pollId}-voters`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Vote', filter: `pollId=eq.${pollId}` }, 
        fetchVoters
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [pollId])

  const downloadPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text(`Poll: ${pollDetails?.topic}`, 14, 22)
    doc.setFontSize(11)
    doc.text(`Start Time: ${new Date(pollDetails?.startTime).toLocaleString()}`, 14, 30)
    doc.text(`End Time: ${new Date(pollDetails?.endTime).toLocaleString()}`, 14, 38)

    doc.autoTable({
      head: [['Name', 'Email', 'Voted At']],
      body: voters.map(voter => [
        voter.name,
        voter.email,
        new Date(voter.votedAt).toLocaleString()
      ]),
      startY: 45
    })

    doc.save(`voters_${pollId}.pdf`)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Voter List</CardTitle>
        <Button onClick={downloadPDF}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Voted At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {voters.map((voter) => (
              <TableRow key={voter.id}>
                <TableCell>{voter.name}</TableCell>
                <TableCell>{voter.email}</TableCell>
                <TableCell>{new Date(voter.votedAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

