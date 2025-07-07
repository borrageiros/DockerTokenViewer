import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { STORAGE_KEY } from '$lib/consts';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'es' | 'en';

export interface Config {
	theme: Theme;
	language: Language;
}

function getDefaultConfig(): Config {
	if (!browser) {
		return { theme: 'system', language: 'es' };
	}
	const browserLang = navigator.language.split('-')[0];
	const language = ['es', 'en'].includes(browserLang) ? (browserLang as Language) : 'es';
	return {
		theme: 'system',
		language
	};
}

function getInitialConfig(): Config {
	if (!browser) return getDefaultConfig();

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return { ...getDefaultConfig(), ...parsed };
		}
	} catch (error) {
		console.error('Error loading config:', error);
	}

	return migrateFromOldFormat();
}

function saveToStorage(config: Config) {
	if (browser) {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
		} catch (error) {
			console.error('Error saving config:', error);
		}
	}
}

function migrateFromOldFormat(): Config {
	if (!browser) return getDefaultConfig();

	const config = getDefaultConfig();

	try {
		const oldTheme = localStorage.getItem('DTVTheme') as Theme;
		if (oldTheme && ['light', 'dark', 'system'].includes(oldTheme)) {
			config.theme = oldTheme;
			localStorage.removeItem('DTVTheme');
		}

		const oldLanguage = localStorage.getItem('DTVLanguage') as Language;
		if (oldLanguage && ['es', 'en'].includes(oldLanguage)) {
			config.language = oldLanguage;
			localStorage.removeItem('DTVLanguage');
		}
	} catch (error) {
		console.error('Error migrating old config:', error);
	}

	saveToStorage(config);
	return config;
}

function createConfigStore() {
	const { subscribe, set, update } = writable<Config>(getInitialConfig());

	return {
		subscribe,
		setTheme: (theme: Theme) => {
			update((config) => {
				const newConfig = { ...config, theme };
				saveToStorage(newConfig);
				return newConfig;
			});
		},
		setLanguage: (language: Language) => {
			update((config) => {
				const newConfig = { ...config, language };
				saveToStorage(newConfig);
				return newConfig;
			});
		},
		reset: () => {
			const newConfig = getDefaultConfig();
			saveToStorage(newConfig);
			set(newConfig);
		}
	};
}

export const config = createConfigStore();

export const theme = derived(config, ($config) => $config.theme);
