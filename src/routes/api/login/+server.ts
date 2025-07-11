import { json, type RequestHandler } from '@sveltejs/kit';
import { encrypt } from '$lib/utils/crypto';
import { getDockerHubToken } from '$lib/utils/common';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { organization, user, token } = await request.json();

		if (!token || !organization || !user) {
			return new Response('Token, organization and user are required', { status: 400 });
		}

		const accessToken = await getDockerHubToken(user, token);

		if (!accessToken) {
			return new Response('Invalid credentials or permissions', {
				status: 401
			});
		}

		cookies.set('DTVAuth', JSON.stringify(accessToken.access_token), {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'strict' as const
		});

		return json({ data: encrypt({ user, token, organization }) });
	} catch (error) {
		console.error('Login error:', error);
		return new Response('An error occurred during login', { status: 500 });
	}
};
