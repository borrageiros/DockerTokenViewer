import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { STORAGE_KEY } from '$lib/consts';
import { goto } from '$app/navigation';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'es' | 'en';
export interface Account {
	id: string;
	organization: string;
	data: string; // encrypted object with user and token
	isActive: boolean;
}

export interface AccountData {
	user: string;
	token: string;
	organization: string;
}

export interface TableSettings {
	repositories: Record<string, boolean>;
	tags: Record<string, boolean>;
}

export interface Config {
	theme: Theme;
	language: Language;
	accounts: Account[];
	tableSettings: TableSettings;
}

function getDefaultConfig(): Config {
	if (!browser) {
		return {
			theme: 'system',
			language: 'es',
			accounts: [],
			tableSettings: { repositories: {}, tags: {} }
		};
	}

	const browserLang = navigator.language.split('-')[0];
	const language = ['es', 'en'].includes(browserLang) ? (browserLang as Language) : 'es';
	return {
		theme: 'system',
		language,
		accounts: [],
		tableSettings: {
			repositories: {},
			tags: {}
		}
	};
}

function getInitialConfig(): Config {
	if (!browser) return getDefaultConfig();
	const defaultConfig = getDefaultConfig();

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			if (parsed.tableSettings) {
				parsed.tableSettings = {
					...defaultConfig.tableSettings,
					...parsed.tableSettings
				};
			}
			return { ...defaultConfig, ...parsed };
		}
	} catch (error) {
		console.error('Error loading config:', error);
	}

	return defaultConfig;
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

export function generateUniqueId(): string {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).substring(2, 10);
	return `${timestamp}-${random}`;
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
		setTableSettings: (table: keyof TableSettings, settings: Record<string, boolean>) => {
			update((config) => {
				const newConfig = {
					...config,
					tableSettings: {
						...config.tableSettings,
						[table]: settings
					}
				};
				saveToStorage(newConfig);
				return newConfig;
			});
		},
		addAccount: (organization: string, dataAccount: string) => {
			update((config) => {
				const newConfig = {
					...config,
					accounts: [
						...config.accounts.map((acc) => ({ ...acc, isActive: false })),
						{ id: generateUniqueId(), organization, data: dataAccount, isActive: true }
					]
				};
				saveToStorage(newConfig);
				return newConfig;
			});
		},
		deleteAccount: (accountId: string) => {
			update((config) => {
				const wasActive = config.accounts.find((acc) => acc.id === accountId)?.isActive;

				const remainingAccounts = config.accounts.filter((acc) => acc.id !== accountId);

				// If there is no accounts, redirect to login
				if (remainingAccounts.length === 0) {
					const newConfig = { ...config, accounts: [] };
					saveToStorage(newConfig);
					setTimeout(() => goto('/login'), 0);
					return newConfig;
				}

				// If the active account is deleted, activate the first available account
				let updatedAccounts = remainingAccounts;
				if (wasActive) {
					updatedAccounts = remainingAccounts.map((acc, i) => ({
						...acc,
						isActive: i === 0 // activate only the first account
					}));
				}

				const newConfig = {
					...config,
					accounts: updatedAccounts
				};

				saveToStorage(newConfig);
				return newConfig;
			});
		},
		setActiveAccount: (accountId: string) => {
			update((config) => {
				const newAccounts = config.accounts.map((acc) => ({
					...acc,
					isActive: acc.id === accountId
				}));
				const newConfig = {
					...config,
					accounts: newAccounts
				};
				saveToStorage(newConfig);
				return newConfig;
			});
		},
		getActiveAccount: () => {
			return derived(config, ($config) => $config.accounts.find((acc) => acc.isActive));
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
