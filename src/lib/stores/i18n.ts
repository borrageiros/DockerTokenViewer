import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Language = 'es' | 'en';

interface Translations {
	[key: string]: string | Translations;
}

const defaultLanguage: Language = 'es';

function createI18nStore() {
	const { subscribe, set } = writable<Language>(defaultLanguage);

	return {
		subscribe,
		set: (language: Language) => {
			if (browser) {
				localStorage.setItem('DTVLanguage', language);
			}
			set(language);
		},
		init: () => {
			if (browser) {
				const stored = localStorage.getItem('DTVLanguage') as Language;
				if (stored && (stored === 'es' || stored === 'en')) {
					set(stored);
				} else {
					const browserLang = navigator.language.split('-')[0];
					const language =
						browserLang === 'es' || browserLang === 'en'
							? (browserLang as Language)
							: defaultLanguage;
					set(language);
				}
			}
		}
	};
}

export const currentLanguage = createI18nStore();

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
