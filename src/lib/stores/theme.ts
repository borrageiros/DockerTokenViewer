import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type Theme = 'light' | 'dark' | 'system';

const storageKey = 'DTVTheme';

const getInitialTheme = (): Theme => {
	if (!browser) {
		return 'system';
	}

	const stored = localStorage.getItem(storageKey);
	if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
		return stored;
	}

	return 'system';
};

const theme = writable<Theme>(getInitialTheme());

theme.subscribe((value) => {
	if (browser) {
		localStorage.setItem(storageKey, value);
	}
});

export default theme;
