import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
	try {
		cookies.delete('DTVAuth', { path: '/' });
		return new Response('Deleted auth cookie successfully', { status: 200 });
	} catch (error) {
		console.error('Logout error:', error);
		return new Response('An error occurred during logout', { status: 500 });
	}
};
