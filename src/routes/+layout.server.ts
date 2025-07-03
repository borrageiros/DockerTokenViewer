import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const repositoryCookie = cookies.get('DTVRepository');

	let baseRepository: string | null = null;
	if (repositoryCookie) {
		try {
			baseRepository = JSON.parse(repositoryCookie);
			console.log('Base repository loaded from cookie:', baseRepository);
		} catch (error) {
			console.error('Error parsing repository cookie:', error);
		}
	} else {
		console.log('No repository cookie found');
	}

	return {
		baseRepository
	};
};
