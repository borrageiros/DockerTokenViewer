<script lang="ts">
	import { config, theme, type Theme } from '$lib/stores/config';

	function setTheme(newTheme: Theme) {
		config.setTheme(newTheme);
	}
</script>

<div class="flex items-center rounded-lg bg-gray-200 p-1 dark:bg-gray-700">
	<button
		aria-label="Set light theme"
		class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors"
		class:bg-white={$theme === 'light'}
		class:dark:bg-gray-900={$theme === 'light'}
		class:text-blue-500={$theme === 'light'}
		class:hover:bg-gray-300={$theme !== 'light'}
		class:dark:hover:bg-gray-600={$theme !== 'light'}
		class:text-gray-500={$theme !== 'light'}
		class:dark:text-gray-400={$theme !== 'light'}
		on:click={() => setTheme('light')}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="h-5 w-5"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
			/>
		</svg>
	</button>
	<button
		aria-label="Set dark theme"
		class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors"
		class:bg-white={$theme === 'dark'}
		class:dark:bg-gray-900={$theme === 'dark'}
		class:text-blue-500={$theme === 'dark'}
		class:hover:bg-gray-300={$theme !== 'dark'}
		class:dark:hover:bg-gray-600={$theme !== 'dark'}
		class:text-gray-500={$theme !== 'dark'}
		class:dark:text-gray-400={$theme !== 'dark'}
		on:click={() => setTheme('dark')}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="h-5 w-5"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25c0 5.385 4.365 9.75 9.75 9.75 2.572 0 4.921-.996 6.752-2.648z"
			/>
		</svg>
	</button>
	<button
		aria-label="Set system theme"
		class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors"
		class:bg-white={$theme === 'system'}
		class:dark:bg-gray-900={$theme === 'system'}
		class:text-blue-500={$theme === 'system'}
		class:hover:bg-gray-300={$theme !== 'system'}
		class:dark:hover:bg-gray-600={$theme !== 'system'}
		class:text-gray-500={$theme !== 'system'}
		class:dark:text-gray-400={$theme !== 'system'}
		on:click={() => setTheme('system')}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="h-5 w-5"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z"
			/>
		</svg>
	</button>
</div>
