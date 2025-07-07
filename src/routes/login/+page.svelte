<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { login } from '$lib/api';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import { currentLanguage, t, loadLanguageTranslations } from '$lib/stores/i18n';
	import { setBaseRepository } from '$lib/stores/repository';
	import { APP_NAME } from '$lib/consts';

	let token = '';
	let repository = '';
	let remember = false;
	let isLoading = false;
	let error: string | null = null;
	let translations: Record<string, string> = {};

	onMount(() => {
		loadTranslations($currentLanguage);
	});

	async function loadTranslations(language: 'es' | 'en') {
		await loadLanguageTranslations(language);
		translations = {
			title: t('login.title', language),
			subtitle: t('login.subtitle', language),
			repository: t('login.repository', language),
			token: t('login.token', language),
			remember: t('login.remember', language),
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
			loginSuccess: t('login.success', language)
		};
	}

	async function handleSubmit() {
		if (!token || !repository) {
			error = translations.errorRequired;
			return;
		}

		isLoading = true;
		error = null;

		try {
			const response = await login(token, repository, remember);

			if (!response.ok) {
				if (response.status === 401) {
					error = translations.errorUnauthorized;
				} else {
					error = `Error: ${response.status} ${response.statusText}`;
				}
				return;
			}

			setBaseRepository(repository);
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
		<form class="mt-8 space-y-6" on:submit|preventDefault={handleSubmit}>
			<div class="-space-y-px rounded-md shadow-sm">
				<div>
					<label for="repository" class="sr-only">{translations.repository}</label>
					<input
						id="repository"
						name="repository"
						type="text"
						required
						bind:value={repository}
						class="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
						placeholder={translations.repository}
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

			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<input
						id="remember"
						name="remember"
						type="checkbox"
						bind:checked={remember}
						class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
					/>
					<label for="remember" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
						{translations.remember}
					</label>
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
