import { writable } from 'svelte/store';

export const baseRepository = writable<string | null>(null);

export function setBaseRepository(repo: string | null) {
	baseRepository.set(repo);
}
