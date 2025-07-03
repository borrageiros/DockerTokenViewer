import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const tokenCookie = cookies.get('DTVAuth');
	const repositoryCookie = cookies.get('DTVRepository');

	if (tokenCookie && repositoryCookie) {
		try {
			JSON.parse(tokenCookie);
			JSON.parse(repositoryCookie);
			throw redirect(302, '/');
		} catch (error) {
			if (
				error instanceof Response ||
				(error && typeof error === 'object' && 'status' in error && 'location' in error)
			) {
				throw error;
			}
		}
	}

	return {};
};
