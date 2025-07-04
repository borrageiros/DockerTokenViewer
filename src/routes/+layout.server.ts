import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const repositoryCookie = cookies.get('DTVRepository');

	let baseRepository: string | null = null;
	if (repositoryCookie) {
		try {
			baseRepository = JSON.parse(repositoryCookie);
		} catch (error) {
			console.error('Error parsing repository cookie:', error);
		}
	}

	return {
		baseRepository
	};
};
