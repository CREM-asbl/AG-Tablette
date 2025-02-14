import { signal } from '@lit-labs/signals';

export const kit = signal({})

export const getFamily = (name) => {
  return kit.get().families.find(family => family.name === name)
}

export const loadKit = async (name) => {
  const module = await import(`./kits/${name}.json`);
  kit.set(module.default);
  resetKitVisibility()
}

export const resetKitVisibility = () => {
  const current = kit.get()
  current.families.forEach(family => family.isVisible = true)
  kit.set({ ...current })
}

export const setFamiliesVisibility = (families) => {
  const current = kit.get()
  current.families.forEach(family => family.isVisible = families.find(f => f.name == family.name).isVisible)
  kit.set({ ...current })
}

export const toggleAllFamiliesVisibility = (visible) => {
  const current = kit.get()
  current.families.forEach(family => family.isVisible = visible)
  kit.set({ ...current })
}

export const toggleFamilyVisibility = (familyName) => {
  const current = kit.get()
  const family = current.families.find(family => family.name === familyName)
  family.isVisible = !family.isVisible
  kit.set({ ...current })
}