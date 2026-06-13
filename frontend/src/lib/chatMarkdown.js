import React from "react"
import { cn } from "./utils.js"

export const markdownComponents = {
  p({ className, ...props }) {
    return React.createElement("p", {
      className: cn("mb-2 last:mb-0", className),
      ...props,
    })
  },
  ul({ className, ...props }) {
    return React.createElement("ul", {
      className: cn("my-2 list-disc space-y-1 pl-5", className),
      ...props,
    })
  },
  ol({ className, ...props }) {
    return React.createElement("ol", {
      className: cn("my-2 list-decimal space-y-1 pl-5", className),
      ...props,
    })
  },
  li({ className, ...props }) {
    return React.createElement("li", {
      className: cn("pl-1", className),
      ...props,
    })
  },
  strong({ className, ...props }) {
    return React.createElement("strong", {
      className: cn("font-semibold", className),
      ...props,
    })
  },
  em({ className, ...props }) {
    return React.createElement("em", {
      className: cn("italic", className),
      ...props,
    })
  },
  code({ className, ...props }) {
    return React.createElement("code", {
      className: cn(
        "rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em]",
        className,
      ),
      ...props,
    })
  },
  a({ className, ...props }) {
    return React.createElement("a", {
      className: cn("font-medium underline underline-offset-4", className),
      target: "_blank",
      rel: "noreferrer",
      ...props,
    })
  },
  table({ className, ...props }) {
    return React.createElement(
      "div",
      {
        className: "my-3 max-w-full overflow-x-auto rounded-xl border",
      },
      React.createElement("table", {
        className: cn("w-full min-w-max border-collapse text-left text-xs", className),
        ...props,
      }),
    )
  },
  thead({ className, ...props }) {
    return React.createElement("thead", {
      className: cn("bg-muted/70", className),
      ...props,
    })
  },
  tbody({ className, ...props }) {
    return React.createElement("tbody", {
      className: cn("divide-y", className),
      ...props,
    })
  },
  tr({ className, ...props }) {
    return React.createElement("tr", {
      className: cn("border-b last:border-b-0", className),
      ...props,
    })
  },
  th({ className, ...props }) {
    return React.createElement("th", {
      className: cn("px-3 py-2 font-semibold whitespace-nowrap", className),
      ...props,
    })
  },
  td({ className, ...props }) {
    return React.createElement("td", {
      className: cn("px-3 py-2 align-top", className),
      ...props,
    })
  },
}
