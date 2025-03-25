import { signal } from '@lit-labs/signals';

export const notions = signal([]);
export const sequences = signal([]);

export const toggleNotion = (notionTitle: string) => {
  const current = notions.get();
  const notionIndex = current.findIndex(notion => notion === notionTitle);

  if (notionIndex === -1) {
    notions.set([...current, notionTitle]);
  } else {
    const newNotions = [...current];
    newNotions.splice(notionIndex, 1);
    notions.set(newNotions);
  }
}

export const toggleSequence = (sequenceTitle: string) => {
  const current = sequences.get();
  const sequenceIndex = current.findIndex(sequence => sequence === sequenceTitle);

  if (sequenceIndex === -1) {
    sequences.set([...current, sequenceTitle]);
  } else {
    const newSequences = [...current];
    newSequences.splice(sequenceIndex, 1);
    sequences.set(newSequences);
  }
}