import type { RequestHandler } from '@sveltejs/kit';
import { DOCKER_HUB_URL } from '$lib/consts';
import { decrypt } from '$lib/utils/crypto';
import { type AccountData } from '$lib/stores/config';
import { getDockerHubToken, isTokenExpired } from '$lib/utils/common';

export const GET: RequestHandler = async ({ params, request, url, cookies }) => {
	const tokenFromCookie = cookies.get('DTVAuth');
	let accessToken = null;
	const encryptedAccountHeader = request.headers.get('Account');
	if (!encryptedAccountHeader) {
		return new Response('Account is missing', { status: 400 });
	}
	const account = decrypt(encryptedAccountHeader) as AccountData;

	if (!params.proxyPath) {
		return new Response('Proxy path is missing', { status: 400 });
	}

	if (!tokenFromCookie || isTokenExpired(tokenFromCookie)) {
		const newAccessToken = await getDockerHubToken(account.user, account.token);
		const tokenToStore = newAccessToken.access_token;
		if (tokenToStore) {
			accessToken = tokenToStore;
			cookies.set('DTVAuth', JSON.stringify(accessToken), {
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'strict' as const
			});
		}
	} else {
		accessToken = JSON.parse(tokenFromCookie);
	}

	const pathParts = params.proxyPath.split('/');

	const remainingPath = pathParts.slice(2).join('/');
	const finalPath = `v2/repositories/${account.organization}${remainingPath ? `/${remainingPath}` : ''}`;
	const targetUrl = `${DOCKER_HUB_URL}/${finalPath}${url.search}`;

	const headersToForward = new Headers();
	headersToForward.set('Authorization', `Bearer ${accessToken}`);

	const acceptHeader = request.headers.get('accept');
	if (acceptHeader) {
		headersToForward.set('accept', acceptHeader);
	}

	try {
		const dockerResponse = await fetch(targetUrl, {
			headers: headersToForward
		});

		const responseHeaders = new Headers();
		const contentType = dockerResponse.headers.get('content-type');
		if (contentType) {
			responseHeaders.set('content-type', contentType);
		}

		return new Response(dockerResponse.body, {
			status: dockerResponse.status,
			statusText: dockerResponse.statusText,
			headers: responseHeaders
		});
	} catch (error) {
		console.error('Proxy error:', error);
		return new Response('Proxy error', { status: 500 });
	}
};
