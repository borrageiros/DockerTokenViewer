import { derived } from 'svelte/store';
import { config, type Language } from './config';

interface Translations {
	[key: string]: string | Translations;
}

export const currentLanguage = derived(config, ($config) => $config.language);

const translations: Record<Language, Translations> = {
	es: {},
	en: {}
};

async function loadTranslations(language: Language) {
	if (!translations[language] || Object.keys(translations[language]).length === 0) {
		try {
			const module = await import(`../i18n/${language}.json`);
			translations[language] = module.default;
		} catch (error) {
			console.error(`Failed to load translations for ${language}:`, error);
			translations[language] = {};
		}
	}
	return translations[language];
}

export function t(key: string, language: Language): string {
	const keys = key.split('.');
	let value: string | Translations = translations[language];

	for (const k of keys) {
		if (value && typeof value === 'object' && k in value) {
			value = value[k];
		} else {
			return key;
		}
	}

	return typeof value === 'string' ? value : key;
}

export async function loadLanguageTranslations(language: Language) {
	await loadTranslations(language);
}
