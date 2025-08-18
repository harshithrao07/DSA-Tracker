"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { StickyNote, Edit3 } from "lucide-react"
import { updateNotes } from "@/lib/storage"

interface NotesModalProps {
  questionId: string
  currentNotes?: string
  onNotesUpdate?: () => void
}

export function NotesModal({ questionId, currentNotes = "", onNotesUpdate }: NotesModalProps) {
  const [notes, setNotes] = useState(currentNotes)
  const [isOpen, setIsOpen] = useState(false)

  const handleSave = () => {
    updateNotes(questionId, notes)
    onNotesUpdate?.()
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-9 w-9 p-0 rounded-md ${
            currentNotes
              ? "text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
          title={currentNotes ? "View/Edit Notes" : "Add Notes"}
        >
          {currentNotes ? <StickyNote className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="gradient-text-primary">Notes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Add your notes, approach, or solution details... (Markdown supported)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[400px] resize-y font-mono text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="gradient-primary text-white">
              Save Notes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
