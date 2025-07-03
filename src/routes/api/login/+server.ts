import type { RequestHandler } from '@sveltejs/kit';
import { DOCKER_HUB_URL } from '$lib/consts';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { token, repository, remember } = await request.json();

		if (!token || !repository) {
			return new Response('Token and repository are required', { status: 400 });
		}

		const validationUrl = `${DOCKER_HUB_URL}/v2/repositories/${repository}`;
		const validationResponse = await fetch(validationUrl, {
			headers: {
				Authorization: `JWT ${token}`,
				Accept: 'application/json'
			}
		});

		if (!validationResponse.ok) {
			return new Response('Invalid credentials or permissions', {
				status: validationResponse.status
			});
		}

		const cookieOptions = {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'strict' as const
		};

		const maxAge = remember ? 365 * 24 * 60 * 60 * 100 : 24 * 60 * 60;

		cookies.set('DTVAuth', JSON.stringify(token), {
			...cookieOptions,
			maxAge
		});

		cookies.set('DTVRepository', JSON.stringify(repository), {
			...cookieOptions,
			maxAge
		});

		return new Response('Login successful', { status: 200 });
	} catch (error) {
		console.error('Login error:', error);
		return new Response('An error occurred during login', { status: 500 });
	}
};
