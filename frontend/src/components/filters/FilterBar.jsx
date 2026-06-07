import { ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FILTER_DEFAULTS } from "@/lib/constants";
import { SearchableCombobox } from "./SearchableCombobox";

function SelectFilter({ label, value, options = [], placeholder, onChange }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Select
        value={value || "all"}
        onValueChange={(next) => onChange(next === "all" ? "" : next)}
      >
        <SelectTrigger className="h-9 w-full bg-muted/50">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">Tất cả</SelectItem>
            {options.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

export function FilterBar({
  filters,
  filterOptions,
  onChange,
  onReset,
  onApply,
}) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="border-b pb-5">
      <div className="grid items-end gap-3 md:grid-cols-2 xl:grid-cols-[0.7fr_0.7fr_1fr_1fr_1fr_1fr_1.4fr_auto]">
        <SelectFilter
          label="Năm"
          value={filters.year}
          options={filterOptions?.nam || []}
          placeholder="Chọn năm"
          onChange={(value) => update("year", value)}
        />
        <SelectFilter
          label="Quý"
          value={filters.quarter}
          options={(filterOptions?.nhanQuy || []).map((label) => {
            const match = String(label).match(/Q([1-4])/i);
            return match ? match[1] : label;
          })}
          placeholder="Chọn quý"
          onChange={(value) => update("quarter", value)}
        />
        <SearchableCombobox
          label="Thành phố"
          value={filters.city}
          options={filterOptions?.tenThanhPho || []}
          placeholder="Tất cả thành phố"
          onChange={(value) => update("city", value)}
        />
        <SearchableCombobox
          label="Cấp bậc"
          value={filters.level}
          options={filterOptions?.tenCapBac || []}
          placeholder="Tất cả cấp bậc"
          onChange={(value) => update("level", value)}
        />
        <SearchableCombobox
          label="Vị trí"
          value={filters.position}
          options={filterOptions?.tenViTriChuan || []}
          placeholder="Tất cả vị trí"
          onChange={(value) => update("position", value)}
        />
        <SearchableCombobox
          label="Kỹ năng"
          value={filters.skill}
          options={filterOptions?.tenKyNang || []}
          placeholder="Tất cả kỹ năng"
          onChange={(value) => update("skill", value)}
        />
        <div className="md:col-span-2 xl:col-span-1">
          <SearchableCombobox
            label="Công ty"
            value={filters.company}
            options={filterOptions?.tenCongTy || []}
            placeholder="Tất cả công ty"
            onChange={(value) => update("company", value)}
          />
        </div>
        <div className="flex items-center gap-2 md:justify-self-end xl:justify-self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 whitespace-nowrap"
            onClick={() => onReset(FILTER_DEFAULTS)}
          >
            Xóa bộ lọc
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-9 whitespace-nowrap"
            onClick={onApply}
          >
            <ListFilter data-icon="inline-start"/>
            Lọc
          </Button>
        </div>
      </div>
    </div>
  );
}
