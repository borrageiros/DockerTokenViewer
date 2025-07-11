<script lang="ts">
	import { config } from '$lib/stores/config';
	import { createEventDispatcher } from 'svelte';
	import { deleteAuthCookie } from '$lib/api';
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';
	import { currentLanguage, t, loadLanguageTranslations } from '$lib/stores/i18n';
	import { page } from '$app/stores';
	let translations: Record<string, string> = {};
	let isOpen = false;
	$: accounts = $config.accounts;
	$: activeAccount = get(config.getActiveAccount());

	$: loadTranslations($currentLanguage);

	async function loadTranslations(language: 'es' | 'en') {
		await loadLanguageTranslations(language);
		translations = {
			savedAccounts: t('accountSwitcher.savedAccounts', language),
			deleteAccountTitle: t('accountSwitcher.deleteAccountTitle', language),
			noAccounts: t('accountSwitcher.noAccounts', language),
			addAccount: t('accountSwitcher.addAccount', language)
		};
	}

	async function handleSwitchAccount(accountId: string) {
		if (accountId === activeAccount?.id) {
			isOpen = false;
			return;
		}

		await deleteAuthCookie();
		config.setActiveAccount(accountId);
		isOpen = false;

		const currentPath = get(page).url.pathname;

		if (currentPath !== '/') {
			goto('/');
		} else {
			// Force reload if already in "/"
			if (typeof window !== 'undefined') {
				window.location.reload();
			}
		}
	}

	async function handleRemoveAccount(accountId: string, event: Event) {
		event.stopPropagation();
		const isRemovingActive = activeAccount?.id === accountId;
		await config.deleteAccount(accountId);
		if (isRemovingActive && typeof window !== 'undefined') {
			window.location.reload();
		}
	}

	function handleAddAccount() {
		goto('/login');
	}

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function closeDropdown() {
		isOpen = false;
	}
</script>

<svelte:window on:click={closeDropdown} />

<div class="relative z-100 inline-block text-left">
	<div>
		<button
			type="button"
			class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-gray-200 p-1 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
			on:click|stopPropagation={toggleDropdown}
		>
			<div class="flex items-center px-2 py-1">
				<div class="flex-shrink-0">
					<div class="h-2 w-2 rounded-full bg-green-400"></div>
				</div>
				<div class="ml-2 text-left">
					<p class="text-sm">
						{activeAccount?.organization || ''}
					</p>
				</div>
				{#if isOpen}
					<!-- Arrow up -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="ml-2 h-5 w-5 text-gray-400"><polyline points="18 15 12 9 6 15" /></svg
					>
				{:else}
					<!-- Arrow down -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="ml-2 h-5 w-5 text-gray-400"><polyline points="6 9 12 15 18 9" /></svg
					>
				{/if}
			</div>
		</button>
	</div>

	{#if isOpen}
		<div
			class="ring-opacity-5 absolute right-0 z-10 mt-2 w-80 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black focus:outline-none dark:divide-gray-700 dark:bg-gray-800 dark:ring-gray-600"
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="menu"
			tabindex="0"
		>
			<div class="px-4 py-3">
				<p class="text-sm text-gray-500 dark:text-gray-400">
					{translations.savedAccounts}
				</p>
			</div>

			<div class="max-h-60 overflow-y-auto py-1">
				{#each accounts as account (account.id)}
					<button
						type="button"
						class="group flex w-full cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100 {account.isActive
							? 'bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300'
							: ''}"
						on:click={() => handleSwitchAccount(account.id)}
					>
						<div class="flex w-full items-center justify-between">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div
										class="h-2 w-2 rounded-full {account.isActive
											? 'bg-blue-400'
											: 'bg-gray-300 dark:bg-gray-600'}"
									></div>
								</div>
								<div class="ml-3 text-left">
									<p class="text-xs text-gray-500 dark:text-gray-400">
										{account.organization}
									</p>
								</div>
							</div>
							<div
								class="ml-2 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none"
								on:click={(event) => handleRemoveAccount(account.id, event)}
								on:keydown={(event) =>
									event.key === 'Enter' && handleRemoveAccount(account.id, event)}
								title={translations.deleteAccountTitle}
								tabindex="0"
								role="button"
							>
								<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
									<path
										fill-rule="evenodd"
										d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
						</div>
					</button>
				{/each}

				{#if accounts.length === 0}
					<div class="px-4 py-6 text-center">
						<p class="text-sm text-gray-500 dark:text-gray-400">
							{translations.noAccounts}
						</p>
					</div>
				{/if}
			</div>

			<div class="py-1">
				<button
					type="button"
					class="group flex w-full cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
					on:click={handleAddAccount}
				>
					<svg class="mr-3 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
						<path
							d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"
						/>
					</svg>
					{translations.addAccount}
				</button>
			</div>
		</div>
	{/if}
</div>
