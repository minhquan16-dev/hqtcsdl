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
import { Slider } from "@/components/ui/slider";
import { FILTER_FIELD_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
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

function formatRangeValue(value, unit) {
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
  }).format(value)} ${unit}`;
}

function RangeFilter({ config, filters, onChange }) {
  const minValue = Number(filters[config.minKey] || config.min);
  const maxValue = Number(filters[config.maxKey] || config.max);
  const value = [minValue, maxValue];

  function handleChange([nextMin, nextMax]) {
    onChange({
      ...filters,
      [config.minKey]: nextMin === config.min ? "" : nextMin,
      [config.maxKey]: nextMax === config.max ? "" : nextMax,
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">
          {config.label}
        </span>
        <span className="shrink-0 text-xs font-medium text-foreground">
          {formatRangeValue(value[0], config.unit)} -{" "}
          {formatRangeValue(value[1], config.unit)}
        </span>
      </div>
      <Slider
        min={config.min}
        max={config.max}
        step={config.step}
        value={value}
        onValueChange={handleChange}
        aria-label={config.label}
      />
    </div>
  );
}

export function FilterBar({
  filters,
  filterKeys = [],
  filterOptions,
  onChange,
  onReset,
  onApply,
}) {
  const update = (key, value) => onChange({ ...filters, [key]: value });
  const activeFields = filterKeys
    .map((key) => ({
      key,
      config: FILTER_FIELD_CONFIG[key],
    }))
    .filter((field) => field.config);

  function renderFilterField({ key, config }) {
    if (config.type === "range-peer") return null;

    if (config.type === "range") {
      return (
        <div key={key} className={cn("min-w-0", config.className)}>
          <RangeFilter config={config} filters={filters} onChange={onChange} />
        </div>
      );
    }

    if (config.type === "select") {
      const options = (filterOptions?.[config.optionsKey] || []).map((option) => {
        if (key !== "quarter") return option;

        const match = String(option).match(/Q([1-4])/i);
        return match ? match[1] : option;
      });

      return (
        <div key={key} className={cn("min-w-0", config.className)}>
          <SelectFilter
            label={config.label}
            value={filters[key]}
            options={options}
            placeholder={config.placeholder}
            onChange={(value) => update(key, value)}
          />
        </div>
      );
    }

    return (
      <div key={key} className={cn("min-w-0", config.className)}>
        <SearchableCombobox
          label={config.label}
          value={filters[key]}
          options={filterOptions?.[config.optionsKey] || []}
          placeholder={config.placeholder}
          onChange={(value) => update(key, value)}
        />
      </div>
    );
  }

  return (
    <div className="rounded-3xl border bg-card/70 p-4 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-end">
        {activeFields.map(renderFilterField)}
        <div className="flex items-center gap-2 xl:ml-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 whitespace-nowrap"
            onClick={onReset}
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
