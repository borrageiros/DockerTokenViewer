import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
	try {
		cookies.delete('DTVAuth', { path: '/' });
		cookies.delete('DTVRepository', { path: '/' });

		return new Response('Logout successful', { status: 200 });
	} catch (error) {
		console.error('Logout error:', error);
		return new Response('An error occurred during logout', { status: 500 });
	}
};
