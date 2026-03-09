import { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { scrumCallApi } from "@/api/scrumCallApi";
import { toast } from "sonner";

export default function ScrumCallNotesDialog({ open, onOpenChange, scrumCall, onSuccess }) {
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (scrumCall) {
            setNotes(scrumCall.notes || "");
        }
    }, [scrumCall]);

    if (!scrumCall) return null;

    const handleSave = async () => {
        try {
            setSaving(true);
            await scrumCallApi.updateNotes(scrumCall.id, { notes });
            toast.success("Notes saved");
            onSuccess?.();
            onOpenChange(false);
        } catch (err) {
            toast.error("Failed to save notes");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Meeting Notes — {scrumCall.title}</DialogTitle>
                </DialogHeader>
                <Textarea
                    placeholder="What was discussed in this meeting..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={6}
                    className="text-sm"
                />
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Notes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
