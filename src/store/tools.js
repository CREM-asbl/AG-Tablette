import { signal } from '@lit-labs/signals';

export const tools = signal([])

export const resetToolsVisibility = () => {
  const current = tools.get()
  current.forEach(tool => tool.isVisible = true)
  tools.set([...current])
}