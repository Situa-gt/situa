// Name of the floor plan on screen in the model page, shared with the contact form.
let current: string | null = null
const listeners = new Set<() => void>()

export function setSelectedFloorplanLabel(label: string | null) {
  if (label === current) return
  current = label
  for (const listener of listeners) listener()
}

export function subscribeSelectedFloorplan(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSelectedFloorplanLabel() {
  return current
}
