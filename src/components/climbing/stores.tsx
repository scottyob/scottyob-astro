import { atom } from 'nanostores';

// Datastore to find highlights between islands.
export const $highlightedDatesStore = atom<{ [key: string]: string[] }>({});