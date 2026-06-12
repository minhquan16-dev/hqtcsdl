import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts"

const axisTick = {
  fill: "var(--muted-foreground)",
  fontSize: 12,
}

function formatAxisLabel(value) {
  const label = String(value ?? "")
  return label.length > 14 ? `${label.slice(0, 13)}…` : label
}

function formatBarAxisLabel(value) {
  const label = String(value ?? "")
  return label.length > 10 ? `${label.slice(0, 9)}…` : label
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const title = label || payload[0]?.payload?.__label || payload[0]?.name
  return (
    <div className="rounded-2xl border bg-popover px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{title}</p>
      <div className="mt-1 flex flex-col gap-1 text-muted-foreground">
        {payload.map((item) => (
          <span key={item.dataKey}>
            {item.name}: {item.value}
          </span>
        ))}
      </div>
    </div>
  )
}

function ScatterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null

  return (
    <div className="rounded-2xl border bg-popover px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{point.__label}</p>
      <div className="mt-1 flex flex-col gap-1 text-muted-foreground">
        <span>Số tin: {point.soTin}</span>
        <span>Lương TB: {point.luongTrungBinh ?? "Chưa có dữ liệu"}</span>
        <span>Vị trí khác nhau: {point.soViTriKhacNhau ?? "Chưa có dữ liệu"}</span>
      </div>
    </div>
  )
}

const donutColors = [
  "var(--chart-4)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-1)",
  "var(--chart-5)",
]

const treemapPastelColors = [
  "oklch(0.84 0.07 28)",
  "oklch(0.83 0.07 195)",
  "oklch(0.86 0.065 82)",
  "oklch(0.84 0.07 145)",
  "oklch(0.84 0.06 285)",
]

function getColor(index) {
  return donutColors[index % donutColors.length]
}

function getTreemapColor(index) {
  return treemapPastelColors[index % treemapPastelColors.length]
}

function formatRange(value) {
  if (!Array.isArray(value)) return value
  return `${value[0]} - ${value[1]}`
}

function SalaryTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-2xl border bg-popover px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{label}</p>
      <div className="mt-1 flex flex-col gap-1 text-muted-foreground">
        {payload.map((item) => (
          <span key={item.dataKey}>
            {item.name}: {formatRange(item.value)}
          </span>
        ))}
      </div>
    </div>
  )
}

function formatTreemapLabel(name, width) {
  const label = String(name ?? "")
  const maxCharacters = Math.max(3, Math.floor((width - 18) / 7))
  return label.length > maxCharacters
    ? `${label.slice(0, Math.max(2, maxCharacters - 1))}…`
    : label
}

function TreemapTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload
  if (!item) return null

  return (
    <div className="rounded-2xl border bg-popover px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{item.name}</p>
      <div className="mt-1 flex flex-col gap-1 text-muted-foreground">
        <span>Số tin: {item.value}</span>
        {item.percent !== undefined ? <span>Tỷ lệ: {item.percent}%</span> : null}
      </div>
    </div>
  )
}

function TreemapCell({ x, y, width, height, name, value, index }) {
  if (width < 24 || height < 24) return null
  const canShowLabel = width > 42 && height > 34
  const canShowValue = width > 52 && height > 52

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={12}
        ry={12}
        fill={getTreemapColor(index)}
        stroke="var(--card)"
        strokeWidth={3}
      />
      {canShowLabel ? (
        <>
          <text
            x={x + 12}
            y={y + 22}
            fill="var(--foreground)"
            fontSize={12}
            fontWeight={600}
          >
            {formatTreemapLabel(name, width)}
          </text>
          {canShowValue ? (
            <text
              x={x + 12}
              y={y + 40}
              fill="var(--foreground)"
              fillOpacity={0.62}
              fontSize={11}
            >
              {value}
            </text>
          ) : null}
        </>
      ) : null}
    </g>
  )
}

export function TrendAreaChart({
  data,
  labelKey,
  valueKey,
  valueName = "Số tin",
  secondaryKey,
  secondaryName = "Tin có lương",
  height = 280,
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 10 }}>
          <defs>
            <linearGradient id="trendPrimary" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.55} />
              <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="trendSecondary" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.45} />
              <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey={labelKey}
            tickLine={false}
            axisLine={false}
            tick={axisTick}
            tickFormatter={formatAxisLabel}
            tickMargin={10}
            interval={0}
            minTickGap={0}
            height={36}
          />
          <YAxis tickLine={false} axisLine={false} tick={axisTick} width={56} />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey={valueKey}
            name={valueName}
            stroke="var(--chart-4)"
            strokeWidth={2.4}
            fill="url(#trendPrimary)"
          />
          {secondaryKey ? (
            <Area
              type="monotone"
              dataKey={secondaryKey}
              name={secondaryName}
              stroke="var(--chart-2)"
              strokeWidth={2.4}
              fill="url(#trendSecondary)"
            />
          ) : null}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SalaryRangeChart({
  data,
  labelKey,
  height = 320,
}) {
  const chartData = (data || []).map((item) => ({
    ...item,
    salaryRange: [
      Number(item.luongMin ?? item.luongTrungBinh ?? 0),
      Number(item.luongMax ?? item.luongTrungBinh ?? 0),
    ],
  }))

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 12, right: 12, left: 0, bottom: 54 }}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey={labelKey}
            tickLine={false}
            axisLine={false}
            tick={axisTick}
            tickFormatter={formatBarAxisLabel}
            tickMargin={12}
            interval={0}
            minTickGap={0}
            angle={-30}
            textAnchor="end"
            height={76}
          />
          <YAxis tickLine={false} axisLine={false} tick={axisTick} width={56} />
          <Tooltip content={<SalaryTooltip />} />
          <Bar
            dataKey="salaryRange"
            name="Khoảng lương"
            fill="var(--chart-4)"
            radius={[8, 8, 8, 8]}
          />
          <Line
            type="monotone"
            dataKey="luongTrungBinh"
            name="Lương trung bình"
            stroke="var(--chart-2)"
            strokeWidth={2.4}
            dot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CategoryTreemap({
  data,
  labelKey,
  valueKey,
  percentKey,
  height = 300,
}) {
  const chartData = (data || []).map((item) => ({
    name: item[labelKey],
    value: Number(item[valueKey]) || 0,
    percent: percentKey ? item[percentKey] : undefined,
  }))

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={chartData}
          dataKey="value"
          nameKey="name"
          aspectRatio={4 / 3}
          content={<TreemapCell />}
        >
          <Tooltip content={<TreemapTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  )
}

export function LevelRadialChart({
  data,
  labelKey,
  valueKey,
  height = 280,
}) {
  const chartData = (data || []).map((item, index) => ({
    ...item,
    fill: getColor(index),
  }))

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius="18%"
          outerRadius="92%"
          barSize={18}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            dataKey={valueKey}
            name={labelKey}
            cornerRadius={10}
            background={{ fill: "var(--muted)" }}
          />
          <Tooltip content={<ChartTooltip />} />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SimpleBarChart({
  data,
  labelKey,
  valueKey,
  valueName = "Số tin",
  secondaryKey,
  secondaryName = "Tin có lương",
  height = 260,
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey={labelKey}
            tickLine={false}
            axisLine={false}
            tick={axisTick}
            tickFormatter={formatBarAxisLabel}
            tickMargin={12}
            interval={0}
            minTickGap={0}
            angle={-35}
            textAnchor="end"
            height={72}
          />
          <YAxis tickLine={false} axisLine={false} tick={axisTick} width={56} />
          <Tooltip content={<ChartTooltip />} />
          <Bar
            dataKey={valueKey}
            name={valueName}
            fill="var(--chart-4)"
            radius={[8, 8, 0, 0]}
          />
          {secondaryKey ? (
            <Bar
              dataKey={secondaryKey}
              name={secondaryName}
              fill="var(--chart-2)"
              radius={[8, 8, 0, 0]}
            />
          ) : null}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function HorizontalBarChart({
  data,
  labelKey,
  valueKey,
  valueName = "Số tin",
  height = 300,
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
        >
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis type="number" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis
            type="category"
            dataKey={labelKey}
            tickLine={false}
            axisLine={false}
            tick={axisTick}
            tickFormatter={formatAxisLabel}
            width={92}
          />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey={valueKey} name={valueName} fill="var(--chart-2)" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DonutChart({ data, labelKey, valueKey, valueName = "Tỷ lệ", height = 280 }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<ChartTooltip />} />
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={labelKey}
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={2}
            name={valueName}
          >
            {data.map((item, index) => (
              <Cell key={item[labelKey]} fill={donutColors[index % donutColors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MarketScatterChart({
  data,
  labelKey,
  xKey = "soTin",
  yKey = "luongTrungBinh",
  zKey = "soViTriKhacNhau",
  height = 320,
}) {
  const chartData = data.map((item) => ({
    ...item,
    __label: item[labelKey],
    [yKey]: item[yKey] ?? 0,
    [zKey]: item[zKey] ?? 1,
  }))

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey={xKey}
            name="Số tin"
            tickLine={false}
            axisLine={false}
            tick={axisTick}
          />
          <YAxis
            type="number"
            dataKey={yKey}
            name="Lương TB"
            tickLine={false}
            axisLine={false}
            tick={axisTick}
            width={56}
          />
          <ZAxis type="number" dataKey={zKey} range={[80, 520]} />
          <Tooltip content={<ScatterTooltip />} />
          <Scatter data={chartData} fill="var(--chart-2)" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SimpleLineChart({
  data,
  labelKey,
  valueKey,
  valueName = "Số tin",
  secondaryKey,
  secondaryName = "Tin có lương",
  height = 260,
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 10 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey={labelKey}
            tickLine={false}
            axisLine={false}
            tick={axisTick}
            tickFormatter={formatAxisLabel}
            tickMargin={10}
            interval={0}
            minTickGap={0}
            height={36}
          />
          <YAxis tickLine={false} axisLine={false} tick={axisTick} width={56} />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey={valueKey}
            name={valueName}
            stroke="var(--chart-4)"
            strokeWidth={2.4}
            dot={{ r: 4 }}
          />
          {secondaryKey ? (
            <Line
              type="monotone"
              dataKey={secondaryKey}
              name={secondaryName}
              stroke="var(--chart-2)"
              strokeWidth={2.4}
              dot={{ r: 4 }}
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
