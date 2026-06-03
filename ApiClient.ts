const BASE_API_URL: string = 'http://127.0.0.1:8000';

type ExtraRequestOptions = Omit<RequestOptions, "method" | "url">;

export interface RequestOptions {
    method: string;
    url: string;
    query?: Record<string, any>;
    body?: any;
    headers?: Record<string, string>;
    timeout?: number;
    auth?: boolean; // ✅ new
}


interface Response {
    ok: boolean;
    status: number;
    headers: Headers;
    json?: () => Promise<any>;
    arrayBuffer?: () => Promise<ArrayBuffer>;
}

interface ApiResponse {
    ok: boolean;
    status: number;
    body: any;
}

export default class ApiClient {

    private baseUrl: string;

    constructor() {
        this.baseUrl = BASE_API_URL;
    }

    async request(options: RequestOptions): Promise<ApiResponse> {

        let query: string = new URLSearchParams(options.query || {}).toString();

        if (query !== '') {
            query = '?' + query;
        }

        const timeout = options.timeout ?? 10000;
        
        debugger

        let response: Response;

        try {

       const headers: Record<string, string> = {
    ...options.headers,
};

if (options.auth !== false) {
    const token = localStorage.getItem("accessToken");
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
}


            if (!(options.body instanceof FormData)) {

                headers['Content-Type'] = 'application/json';

                if (options.body) {
                    options.body = JSON.stringify(options.body);
                }

            }

            const fetchOptions: RequestInit = {
                method: options.method,
                headers,
                body: options.body || null,
            };

            if (options.timeout) {
                fetchOptions.signal = AbortSignal.timeout(timeout);
            }

            response = await fetch(this.baseUrl + options.url + query, fetchOptions);

            if (response.status === 401) {

                localStorage.removeItem('accessToken');
                window.location.href = '/auth';

                return {
                    ok: false,
                    status: 401,
                    body: null,
                };

            }

        } catch (error) {

            response = {
                ok: false,
                status: 500,
                headers: new Headers(),
                json: async () => ({
                    code: 500,
                    message: 'The server is unresponsive',
                    description: error?.toString(),
                }),
            };

        }

        const contentType = response.headers.get('Content-Type');

        let body = null;

        if (response.status !== 204 && response.headers.get('content-length') !== '0') {

            if (!contentType?.includes('application/json') && response.arrayBuffer) {

                body = await response.arrayBuffer();

            } else if (contentType?.includes('application/json') && response.json) {

                body = await response.json();

            }

        }

        return {
            ok: response.ok,
            status: response.status,
            body: body,
        };

    }



async get(url: string, query?: Record<string, any>, options?: ExtraRequestOptions): Promise<ApiResponse> {
    return this.request({ method: 'GET', url, query, ...(options || {}) });
}

async post(url: string, body: any, options?: ExtraRequestOptions): Promise<ApiResponse> {
    return this.request({ method: 'POST', url, body, ...(options || {}) });
}

async patch(url: string, body: any, options?: ExtraRequestOptions): Promise<ApiResponse> {
    return this.request({ method: 'PATCH', url, body, ...(options || {}) });
}

async put(url: string, body: any, options?: ExtraRequestOptions): Promise<ApiResponse> {
    return this.request({ method: 'PUT', url, body, ...(options || {}) });
}

async delete(url: string, options?: ExtraRequestOptions): Promise<ApiResponse> {
    return this.request({ method: 'DELETE', url, ...(options || {}) });
}

}
