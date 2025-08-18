"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { NotebookPen } from "lucide-react";

interface NotesDialogProps {
  questionId: string;
  questionTitle: string;
  currentNotes?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNotesUpdated: () => void;
}

export function NotesDialog({
  questionId,
  questionTitle,
  currentNotes = "",
  open,
  onOpenChange,
  onNotesUpdated,
}: NotesDialogProps) {
  const [notes, setNotes] = useState(currentNotes);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      storage.updateNotes(questionId, notes);
      toast({
        title: "Notes saved",
        description: "Your notes have been updated successfully.",
      });
      onNotesUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error saving notes",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <NotebookPen className="h-5 w-5" />
            Notes for "{questionTitle}"
          </DialogTitle>
          <DialogDescription>
            Add your personal notes, solution approach, or key insights for this
            problem.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            placeholder="Write your notes here... (e.g., solution approach, time complexity, key insights)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[200px] resize-none"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setNotes(currentNotes); // reset to original
              onOpenChange(false);
            }}
            disabled={isSaving}
          >
            Cancel
          </Button>

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Notes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
