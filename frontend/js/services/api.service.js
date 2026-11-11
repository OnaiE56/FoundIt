const API_BASE = '/api/v1';

function readCookie(name) {
  const row = document.cookie.split('; ').find((entry) => entry.startsWith(`${name}=`));
  return row ? decodeURIComponent(row.slice(name.length + 1)) : '';
}

export const ApiService = {
  async request(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const headers = { Accept: 'application/json', ...options.headers };
    if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      headers['X-CSRF-Token'] = readCookie('XSRF-TOKEN');
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      method,
      headers,
      credentials: 'same-origin',
      body: options.body && typeof options.body !== 'string' && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error?.message || 'The request could not be completed.');
      error.status = response.status;
      error.code = payload.error?.code;
      throw error;
    }
    return payload.data;
  },

  async prepareSession() {
    await this.request('/auth/csrf');
  }
};
