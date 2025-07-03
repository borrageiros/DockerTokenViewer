<script lang="ts">
	import { currentLanguage } from '$lib/stores/i18n';

	function setLanguage(language: 'es' | 'en') {
		currentLanguage.set(language);
	}
</script>

<div class="flex items-center space-x-2 rounded-lg bg-gray-200 p-1 dark:bg-gray-700">
	<button
		on:click={() => setLanguage('es')}
		aria-label="Español"
		class="flex items-center justify-center rounded-md p-2 transition-colors"
		class:bg-white={$currentLanguage === 'es'}
		class:dark:bg-gray-900={$currentLanguage === 'es'}
		class:text-blue-500={$currentLanguage === 'es'}
		class:hover:bg-gray-300={$currentLanguage !== 'es'}
		class:dark:hover:bg-gray-600={$currentLanguage !== 'es'}
		class:text-gray-500={$currentLanguage !== 'es'}
		class:dark:text-gray-400={$currentLanguage !== 'es'}
	>
		<span class="text-sm font-medium">ES</span>
	</button>

	<button
		on:click={() => setLanguage('en')}
		aria-label="English"
		class="flex items-center justify-center rounded-md p-2 transition-colors"
		class:bg-white={$currentLanguage === 'en'}
		class:dark:bg-gray-900={$currentLanguage === 'en'}
		class:text-blue-500={$currentLanguage === 'en'}
		class:hover:bg-gray-300={$currentLanguage !== 'en'}
		class:dark:hover:bg-gray-600={$currentLanguage !== 'en'}
		class:text-gray-500={$currentLanguage !== 'en'}
		class:dark:text-gray-400={$currentLanguage !== 'en'}
	>
		<span class="text-sm font-medium">EN</span>
	</button>
</div>
