"use client"

import * as React from "react"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Topic {
  id: string
  name: string
}

export function TopicCombobox({
  existingTopics,
  selectedTopic,
  onSelectTopic,
}: {
  existingTopics: Topic[]
  selectedTopic: string | null
  onSelectTopic: (value: string) => void
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="space-y-2">
      <label className="text-sm text-muted-foreground">
        Select from existing topics:
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedTopic
              ? existingTopics.find((t) => t.name === selectedTopic)?.name
              : "Choose existing topic"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0">
          <Command>
            <CommandInput placeholder="Search topics..." />
            <CommandList>
              <CommandEmpty>No topics found.</CommandEmpty>
              <CommandGroup>
                {existingTopics.map((topic) => (
                  <CommandItem
                    key={topic.id}
                    value={topic.name}
                    onSelect={(currentValue) => {
                      onSelectTopic(currentValue)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedTopic === topic.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {topic.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
