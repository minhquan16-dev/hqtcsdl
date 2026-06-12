import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function Section({ id, title, description, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      {title || description ? (
        <div className="mb-4 flex flex-col gap-1">
          {title ? (
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          ) : null}
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function Panel({ title, description, children, className = "" }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
