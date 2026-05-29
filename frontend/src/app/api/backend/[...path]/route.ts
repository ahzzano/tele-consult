import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const hopByHopHeaders = new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
]);

function getBackendUrl(path: string[], request: Request) {
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
        throw new Error("BACKEND_URL is not configured");
    }

    const incomingUrl = new URL(request.url);
    const targetUrl = new URL(path.join("/"), `${backendUrl.replace(/\/$/, "")}/`);
    targetUrl.search = incomingUrl.search;

    return targetUrl;
}

function buildHeaders(request: Request, token?: string) {
    const headers = new Headers();

    for (const [key, value] of request.headers.entries()) {
        const lowerKey = key.toLowerCase();

        if (!hopByHopHeaders.has(lowerKey) && lowerKey !== "host" && lowerKey !== "cookie") {
            headers.set(key, value);
        }
    }

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
}

function buildResponseHeaders(response: Response) {
    const headers = new Headers();

    for (const [key, value] of response.headers.entries()) {
        if (!hopByHopHeaders.has(key.toLowerCase())) {
            headers.set(key, value);
        }
    }

    return headers;
}

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
    const { path } = await context.params;
    const token = (await cookies()).get("auth_token")?.value;
    const method = request.method.toUpperCase();
    const hasBody = method !== "GET" && method !== "HEAD";

    const response = await fetch(getBackendUrl(path, request), {
        method,
        headers: buildHeaders(request, token),
        body: hasBody ? await request.arrayBuffer() : undefined,
        cache: "no-store",
    });

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: buildResponseHeaders(response),
    });
}

export {
    proxy as DELETE,
    proxy as GET,
    proxy as PATCH,
    proxy as POST,
    proxy as PUT,
};
