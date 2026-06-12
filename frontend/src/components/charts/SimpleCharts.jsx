import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
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
