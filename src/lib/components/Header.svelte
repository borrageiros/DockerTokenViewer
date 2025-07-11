<script lang="ts">
	import AccountSwitcher from './AccountSwitcher.svelte';
	import ThemeSwitcher from './ThemeSwitcher.svelte';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import { goto } from '$app/navigation';
	import { currentLanguage, t } from '$lib/stores/i18n';
	import { APP_NAME } from '$lib/consts';

	let isMenuOpen = false;
	let translations: Record<string, string> = {};

	$: {
		const language = $currentLanguage;
		translations = {
			language: t('header.language', language),
			theme: t('header.theme', language),
			session: t('header.session', language)
		};
	}

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function closeMenu() {
		isMenuOpen = false;
	}
</script>

<header class="border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between">
			<div class="flex items-center">
				<div
					class="flex cursor-pointer items-center space-x-3"
					on:click={() => goto('/')}
					on:keydown={(e) => {}}
					role="button"
					tabindex="0"
				>
					<img src="/docker.svg" alt={APP_NAME} class="h-8 w-8" />
					<h1 class="hidden text-xl font-bold text-gray-900 sm:block dark:text-white">
						{APP_NAME}
					</h1>
				</div>
			</div>

			<!-- Desktop menu -->
			<div class="hidden items-center space-x-4 md:flex">
				<LanguageSwitcher />
				<ThemeSwitcher />
				<AccountSwitcher />
			</div>

			<!-- Mobile menu button -->
			<div class="md:hidden">
				<button
					on:click={toggleMenu}
					class="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-inset dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
					aria-expanded={isMenuOpen}
					aria-label="Abrir menú"
				>
					<svg
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
					>
						{#if isMenuOpen}
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						{:else}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
							/>
						{/if}
					</svg>
				</button>
			</div>
		</div>

		<!-- Mobile menu -->
		{#if isMenuOpen}
			<div class="border-t border-gray-200 pt-4 pb-3 md:hidden dark:border-gray-700">
				<div class="flex flex-col space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-gray-700 dark:text-gray-300"
							>{translations.language}</span
						>
						<div on:click={closeMenu} on:keydown={() => {}} role="button" tabindex="0">
							<LanguageSwitcher />
						</div>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-gray-700 dark:text-gray-300"
							>{translations.theme}</span
						>
						<div on:click={closeMenu} on:keydown={() => {}} role="button" tabindex="0">
							<ThemeSwitcher />
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</header>
