import { signal } from '@lit-labs/signals';

export const tools = signal([]);

export const resetToolsVisibility = () => {
  const current = tools.get();
  current.forEach((tool) => (tool.isVisible = true));
  tools.set([...current]);
};

export const setToolsVisibility = (toolsVisibility) => {
  const current = tools.get();
  current.forEach((tool) => {
    const toolVisibility = toolsVisibility.find((t) => t.name === tool.name);
    if (toolVisibility && toolVisibility.isVisible !== undefined) {
      tool.isVisible = toolVisibility.isVisible;
    }
  });
  tools.set([...current]);
};

export const toggleAllToolsVisibility = (visible) => {
  const current = tools.get();
  current.forEach((tool) => (tool.isVisible = visible));
  tools.set([...current]);
};

export const toggleToolVisibility = (toolName) => {
  const current = tools.get();
  const tool = current.find((tool) => tool.name === toolName);
  tool.isVisible = !tool.isVisible;
  tools.set([...current]);
};
