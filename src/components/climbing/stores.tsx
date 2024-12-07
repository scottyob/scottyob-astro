import type { Climb } from '@libs/Climbing';
import { atom } from 'nanostores';

// Datastore to find highlights between islands.
export const $highlightedDatesStore = atom<{ [key: string]: string[] }>({});

export type Filter = (arr: Array<Climb>) => Array<Climb>;
export type FilterStore = { name: string; filter: Filter }[];
export const $climbingFilterStore = atom<FilterStore>([]);
