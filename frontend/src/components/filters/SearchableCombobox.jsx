import { ChevronsUpDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function SearchableCombobox({
  label,
  value,
  options = [],
  placeholder = "Chọn giá trị",
  onChange,
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="h-9 w-full justify-between overflow-hidden bg-muted/50"
          >
            <span className="truncate">{value || placeholder}</span>
            <ChevronsUpDownIcon data-icon="inline-end" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
          <Command>
            <CommandInput placeholder={`Tìm ${label.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>Không tìm thấy lựa chọn phù hợp.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="__all__"
                  data-checked={!value}
                  onSelect={() => onChange("")}
                >
                  Tất cả
                </CommandItem>
                {options.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    data-checked={value === option}
                    onSelect={() => onChange(option)}
                  >
                    <span className="truncate" title={option}>
                      {option}
                    </span>
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
