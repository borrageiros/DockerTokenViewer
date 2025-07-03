import type { RequestHandler } from '@sveltejs/kit';
import { DOCKER_HUB_URL } from '$lib/consts';

export const GET: RequestHandler = async ({ params, request, url, cookies }) => {
	const tokenCookie = cookies.get('DTVAuth');
	const repositoryCookie = cookies.get('DTVRepository');

	if (!tokenCookie || !repositoryCookie) {
		cookies.delete('DTVAuth', { path: '/' });
		cookies.delete('DTVRepository', { path: '/' });
		return new Response('Unauthorized', { status: 401 });
	}

	let token: string;
	let repository: string;
	try {
		token = JSON.parse(tokenCookie);
		repository = JSON.parse(repositoryCookie);
	} catch {
		cookies.delete('DTVAuth', { path: '/' });
		cookies.delete('DTVRepository', { path: '/' });
		return new Response('Unauthorized', { status: 401 });
	}

	if (!params.proxyPath) {
		return new Response('Proxy path is missing', { status: 400 });
	}

	const pathParts = params.proxyPath.split('/');

	if (pathParts[0] !== 'v2' || pathParts[1] !== 'repositories') {
		return new Response('Invalid proxy path. Must start with v2/repositories', { status: 400 });
	}

	const remainingPath = pathParts.slice(2).join('/');
	const finalPath = `v2/repositories/${repository}${remainingPath ? `/${remainingPath}` : ''}`;
	const targetUrl = `${DOCKER_HUB_URL}/${finalPath}${url.search}`;

	const headersToForward = new Headers();
	headersToForward.set('Authorization', `JWT ${token}`);

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
