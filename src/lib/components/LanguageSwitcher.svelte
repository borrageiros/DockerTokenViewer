<script lang="ts">
	import { config, type Language } from '$lib/stores/config';
	import { currentLanguage } from '$lib/stores/i18n';
	import Button from './Button.svelte';

	function setLanguage(language: Language) {
		config.setLanguage(language);
	}
</script>

<div class="flex items-center rounded-lg bg-gray-200 p-1 dark:bg-gray-700">
	<Button
		variant="icon"
		active={$currentLanguage === 'es'}
		on:click={() => setLanguage('es')}
		aria-label="Español"
	>
		<span class="text-sm font-medium">ES</span>
	</Button>

	<Button
		variant="icon"
		active={$currentLanguage === 'en'}
		on:click={() => setLanguage('en')}
		aria-label="English"
	>
		<span class="text-sm font-medium">EN</span>
	</Button>
</div>
