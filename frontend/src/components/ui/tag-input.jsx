import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export function TagInput({ value = [], onChange, placeholder = "Type and press Enter..." }) {
    const [input, setInput] = useState("");

    const handleKeyDown = (e) => {
        if ((e.key === "Enter" || e.key === ",") && input.trim()) {
            e.preventDefault();
            const newTag = input.trim();
            if (!value.includes(newTag)) {
                onChange([...value, newTag]);
            }
            setInput("");
        }
        if (e.key === "Backspace" && !input && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove) => {
        onChange(value.filter((t) => t !== tagToRemove));
    };

    return (
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 min-h-[40px]">
            {value.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 px-2 py-0.5 text-xs">
                    {tag}
                    <button
                        type="button"
                        className="ml-0.5 rounded-full outline-none hover:bg-muted-foreground/20 focus:ring-1 focus:ring-ring"
                        onClick={() => removeTag(tag)}
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={value.length === 0 ? placeholder : ""}
                className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-[80px]"
            />
        </div>
    );
}
