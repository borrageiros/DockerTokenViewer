<script lang="ts">
	import { logout } from '$lib/api';
	import { goto } from '$app/navigation';

	async function handleLogout() {
		try {
			await logout();
			location.href = '/login';
		} catch (error) {
			console.error('Logout error:', error);
			location.href = '/login';
		}
	}
</script>

<button
	on:click={handleLogout}
	class="flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-800"
	aria-label="Logout"
>
	<svg
		class="h-4 w-4"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		stroke-width="1.5"
		stroke="currentColor"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
		/>
	</svg>
</button>
