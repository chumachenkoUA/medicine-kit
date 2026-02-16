import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PagePlaceholderProps {
  title?: string
  description: string
}

export function PagePlaceholder({
  title = "Сторінка в розробці",
  description,
}: PagePlaceholderProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{description}</CardContent>
    </Card>
  )
}
