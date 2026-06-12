export function getTabsWrapperClasses(allowWrap) {
  return ["pb-1", allowWrap ? "overflow-visible" : "overflow-x-auto"]
    .filter(Boolean)
    .join(" ");
}

export function getTabsListClasses(allowWrap, listClassName = "") {
  return [
    allowWrap ? "h-auto w-full min-w-0 flex-wrap justify-start" : "min-w-max",
    listClassName,
  ]
    .filter(Boolean)
    .join(" ");
}
