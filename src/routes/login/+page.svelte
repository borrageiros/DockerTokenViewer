<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { login } from '$lib/api';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import { currentLanguage, t, loadLanguageTranslations } from '$lib/stores/i18n';
	import { APP_NAME } from '$lib/consts';
	import { config } from '$lib/stores/config';

	let token = '';
	let organization = '';
	let user = '';
	let isLoading = false;
	let error: string | null = null;
	let translations: Record<string, string> = {};

	$: hasAccounts = $config.accounts.length > 0;

	$: loadTranslations($currentLanguage);

	async function loadTranslations(language: 'es' | 'en') {
		await loadLanguageTranslations(language);
		translations = {
			title: t('login.title', language),
			subtitle: t('login.subtitle', language),
			organization: t('login.organization', language),
			user: t('login.user', language),
			token: t('login.token', language),
			submit: t('login.submit', language),
			howToGetToken: t('login.howToGetToken', language),
			step1: t('login.step1', language),
			step1Link: t('login.step1Link', language),
			step2: t('login.step2', language),
			step3: t('login.step3', language),
			step4: t('login.step4', language),
			errorRequired: t('login.errors.required', language),
			errorUnauthorized: t('login.errors.unauthorized', language),
			errorConnection: t('login.errors.connection', language),
			loginButton: t('login.button', language),
			loginSuccess: t('login.success', language),
			backToDashboard: t('login.backToDashboard', language)
		};
	}

	function handleBackToDashboard() {
		goto('/');
	}

	async function handleSubmit() {
		if (!token || !organization || !user) {
			error = translations.errorRequired;
			return;
		}

		isLoading = true;
		error = null;

		try {
			const response = await login(token, organization, user);
			const data = await response.json();

			if (!response.ok) {
				if (response.status === 401) {
					error = translations.errorUnauthorized;
				} else {
					error = `Error: ${response.status} ${response.statusText}`;
				}
				return;
			}

			config.addAccount(organization, data.data);
			goto('/');
		} catch (e) {
			error = translations.errorConnection;
			console.error('Login error:', e);
		} finally {
			isLoading = false;
		}
	}
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900"
>
	<div class="absolute top-4 right-4 flex items-center gap-4">
		<LanguageSwitcher />
		<ThemeSwitcher />
	</div>
	<div class="w-full max-w-md space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
				{translations.title}
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
				{translations.subtitle}
			</p>
		</div>

		{#if hasAccounts}
			<div class="flex justify-center">
				<button
					type="button"
					on:click={handleBackToDashboard}
					class="inline-flex items-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
				>
					<svg
						class="mr-2 -ml-1 h-5 w-5"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
							clip-rule="evenodd"
						/>
					</svg>
					{translations.backToDashboard}
				</button>
			</div>
		{/if}

		<form class="mt-8 space-y-6" on:submit|preventDefault={handleSubmit}>
			<div class="-space-y-px rounded-md shadow-sm">
				<div>
					<label for="organization" class="sr-only">{translations.organization}</label>
					<input
						id="organization"
						name="organization"
						type="text"
						required
						bind:value={organization}
						class="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
						placeholder={translations.organization}
					/>
				</div>
				<div>
					<label for="user" class="sr-only">{translations.user}</label>
					<input
						id="user"
						name="user"
						type="text"
						required
						bind:value={user}
						class="relative block w-full appearance-none rounded-none border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
						placeholder={translations.user}
					/>
				</div>
				<div>
					<label for="token" class="sr-only">{translations.token}</label>
					<input
						id="token"
						name="token"
						type="password"
						required
						bind:value={token}
						class="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
						placeholder={translations.token}
					/>
				</div>
			</div>

			{#if error}
				<div class="border-l-4 border-red-400 bg-red-50 p-4 dark:border-red-400 dark:bg-red-900/20">
					<div class="flex">
						<div class="flex-shrink-0">
							<svg
								class="h-5 w-5 text-red-400"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								aria-hidden="true"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div class="ml-3">
							<p class="text-sm text-red-700 dark:text-red-400">{error}</p>
						</div>
					</div>
				</div>
			{/if}

			<div>
				<button
					type="submit"
					disabled={isLoading}
					class="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
				>
					{#if isLoading}
						<svg
							class="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							/>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
					{/if}
					{translations.submit}
				</button>
			</div>
		</form>

		<div class="mt-6">
			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="bg-gray-50 px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
						{translations.howToGetToken}
					</span>
				</div>
			</div>

			<div class="mt-6 text-sm text-gray-500 dark:text-gray-400">
				<ol class="list-decimal space-y-2 pl-5">
					<li>
						{translations.step1}
						<a
							href="https://hub.docker.com/settings/security"
							target="_blank"
							rel="noopener noreferrer"
							class="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
						>
							{translations.step1Link}
						</a>
					</li>
					<li>{translations.step2}</li>
					<li>{translations.step3}</li>
					<li>{translations.step4}</li>
				</ol>
			</div>
		</div>
	</div>
</div>

<svelte:head>
	<title>Login - {APP_NAME}</title>
</svelte:head>
