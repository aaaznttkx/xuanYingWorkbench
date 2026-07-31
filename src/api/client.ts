const API_BASE = '/api';

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ========== English Records ==========
export const englishRecordsApi = {
  list: () => request('/english-records'),
  get: (id: string) => request(`/english-records?id=${encodeURIComponent(id)}`),
  create: (data: any) => request('/english-records', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request(`/english-records?id=${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/english-records?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// ========== Words ==========
export const wordsApi = {
  list: () => request('/words'),
  get: (id: string) => request(`/words?id=${encodeURIComponent(id)}`),
  create: (data: any) => request('/words', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request(`/words?id=${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/words?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// ========== Wrong Questions ==========
export const wrongQuestionsApi = {
  list: () => request('/wrong-questions'),
  get: (id: string) => request(`/wrong-questions?id=${encodeURIComponent(id)}`),
  create: (data: any) => request('/wrong-questions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request(`/wrong-questions?id=${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/wrong-questions?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// ========== Books ==========
export const booksApi = {
  list: () => request('/books'),
  get: (id: string) => request(`/books?id=${encodeURIComponent(id)}`),
  create: (data: any) => request('/books', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request(`/books?id=${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/books?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// ========== Reading Notes ==========
export const readingNotesApi = {
  list: (bookId?: string) => {
    const params = bookId ? `?bookId=${encodeURIComponent(bookId)}` : '';
    return request(`/reading-notes${params}`);
  },
  get: (id: string) => request(`/reading-notes?id=${encodeURIComponent(id)}`),
  create: (data: any) => request('/reading-notes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request(`/reading-notes?id=${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/reading-notes?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// ========== Sport Records ==========
export const sportRecordsApi = {
  list: () => request('/sport-records'),
  get: (id: string) => request(`/sport-records?id=${encodeURIComponent(id)}`),
  create: (data: any) => request('/sport-records', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request(`/sport-records?id=${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/sport-records?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// ========== Weekly Reports ==========
export const weeklyReportsApi = {
  list: () => request('/weekly-reports'),
  getByWeek: (weekStart: string) => request(`/weekly-reports?weekStart=${encodeURIComponent(weekStart)}`),
  get: (id: string) => request(`/weekly-reports?id=${encodeURIComponent(id)}`),
  create: (data: any) => request('/weekly-reports', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/weekly-reports?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
