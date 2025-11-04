"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit3, Eye, Save, FileText } from "lucide-react";
import axios from "axios";
import { ApiResponse } from "@/types/response";
import { QuestionResponse } from "@/types/question";
import MDEditor from "@uiw/react-md-editor";
import { NoteResponse } from "@/types/note";
import { useToast } from "./ui/use-toast";
import { ConfirmationDialog } from "./confirmation-dialog";

interface NotesDialogProps {
  selectedQuestion: QuestionResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotesDialog({
  selectedQuestion,
  open,
  onOpenChange,
}: NotesDialogProps) {
  const { toast } = useToast();
  const [note, setNote] = useState<NoteResponse>();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [editorText, setEditorText] = useState<string>("");
  const [loadingNote, setLoadingNote] = useState(false);

  useEffect(() => {
    async function fetchNote() {
      try {
        setLoadingNote(true);
        const result = await axios.get<ApiResponse<NoteResponse>>(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/notes/${selectedQuestion.noteId}`,
          { withCredentials: true }
        );

        if (!result.data.success) {
          console.error(
            "Error in fetching note from server: ",
            result.data.errorMessage
          );

          toast({
            title: "Error",
            description: "Error in fetching note",
            variant: "destructive",
          });

          return;
        }

        setNote(result.data.data);
        setEditorText(result.data.data.text);
      } catch (error) {
        console.error("Error fetching note:", error);
      } finally {
        setLoadingNote(false);
      }
    }

    if (selectedQuestion.noteId !== undefined) {
      fetchNote();
    } else {
      setNote(undefined);
      setEditorText("");
    }
  }, [selectedQuestion]);

  useEffect(() => {
    if (note) {
      setEditorText(note.text || "");
    }
  }, [note]);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "auto";
    }
  }, [open]);

  const handleSave = async () => {
    try {
      setSaving(true);
      let result;

      if (note?.id.trim()) {
        // Save to existing note
        result = await axios.put<ApiResponse<NoteResponse>>(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/notes/${note?.id}`,
          {
            text: editorText,
          },
          { withCredentials: true }
        );
      } else {
        // Add a new note
        result = await axios.post<ApiResponse<NoteResponse>>(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/notes`,
          {
            questionId: selectedQuestion.id,
            text: editorText,
          },
          { withCredentials: true }
        );
        selectedQuestion.noteId = result.data.data.id;
      }

      if (!result.data.success) {
        console.error("Error in saving notes: ", result.data.errorMessage);

        toast({
          title: "Error",
          description: "Error in saving notes",
          variant: "destructive",
        });

        return;
      }

      setNote(result.data.data);
      setIsEditing(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({
        title: "Error",
        description: "Error in saving notes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    console.log(note);
    setEditorText(note?.text || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      setConfirmCloseOpen(true);
      return;
    }
    setEditorText(note?.text || "");
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setConfirmCloseOpen(true);
      return;
    }
    setIsEditing(false);
    setHasUnsavedChanges(false);
    onOpenChange(false);
  };

  const confirmClose = () => {
    setEditorText(note?.text || "");
    setIsEditing(false);
    setHasUnsavedChanges(false);
    onOpenChange(false);
    setConfirmCloseOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="!max-w-[80vw] !w-[80vw] h-[95vh] flex flex-col p-0 gap-0 bg-[#0e0e0e] text-gray-200 border border-[#3d3d3d] shadow-2xl"
        style={{ maxWidth: "95vw", width: "95vw" }}
      >
        {/* Header */}
        <div className="border-b border-[#3d3d3d] p-6 flex-shrink-0">
          <DialogHeader className="space-y-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-indigo-600 to-[#0170f2] rounded-xl shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-1">
                  <DialogTitle className="text-2xl font-bold text-white">
                    {selectedQuestion.title}
                  </DialogTitle>
                </div>
              </div>

              <div className="flex items-center justify-center mr-5 gap-5">
                {hasUnsavedChanges && (
                  <Badge className="text-white border-0 shadow-lg animate-pulse">
                    <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                    Unsaved changes
                  </Badge>
                )}
                {note !== undefined && note.text.trim() && (
                  <Button
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-gradient-to-r from-indigo-600 to-[#0170f2] hover:from-indigo-700 hover:to-[#0170f2] text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isEditing ? (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Notes
                      </>
                    ) : (
                      <>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Notes
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-6">
          {loadingNote ? (
            // 🔄 Loader Section
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center text-gray-400">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
                <p className="text-sm">Loading notes...</p>
              </div>
            </div>
          ) : !isEditing ? (
            <div className="h-full">
              {note === undefined || !note.text.trim() ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <div className="relative mb-8">
                      <div className="relative p-6 bg-[#0e0e0e] rounded-full shadow-xl">
                        <FileText className="h-16 w-16 text-gray-600 mx-auto" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      Start taking notes
                    </h3>
                    <p className="text-gray-400 mb-8 leading-relaxed">
                      Capture your thoughts, solutions, and insights about this
                      problem.
                    </p>
                    <Button
                      onClick={handleEdit}
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8"
                    >
                      <Edit3 className="h-5 w-5 mr-2" />
                      Create Your First Note
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-y-auto">
                  <div className="bg-[#0d1117] rounded-2xl shadow-xl border border-[#1a1a1a] p-8 w-full max-w-none">
                    <div className="prose prose-invert prose-xl max-w-none">
                      <MDEditor.Markdown source={editorText || ""} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full">
              <div className="h-full rounded-2xl overflow-hidden shadow-xl border border-[#1a1a1a] bg-[#0e0e0e] w-full">
                <MDEditor
                  value={editorText}
                  onChange={(val) => {
                    setEditorText(val || "");
                    setHasUnsavedChanges(true);
                  }}
                  height={window.innerHeight * 0.7}
                  data-color-mode="dark"
                  preview="edit"
                  className="text-gray-200"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {isEditing && (
          <div className="bg-[#0e0e0e] border-t border-[#1a1a1a] p-6 flex-shrink-0">
            <DialogFooter>
              <div className="flex items-center gap-3">
                <>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !hasUnsavedChanges}
                    className="bg-gradient-to-r from-emerald-600 to-green-600 ..."
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Notes"}
                  </Button>

                  <Button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="bg-gray-700 text-white hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                </>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>

      <ConfirmationDialog
        open={confirmCloseOpen}
        onOpenChange={setConfirmCloseOpen}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to close?"
        confirmText="Close Anyway"
        onConfirm={confirmClose}
      />
    </Dialog>
  );
}
