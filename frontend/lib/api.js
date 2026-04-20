export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('coinbird_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.detail || data?.error || data?.errors?.[0]?.msg || 'Something went wrong';
    throw new Error(msg);
  }

  return data;
}

async function uploadFile(path, file) {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.detail || 'Upload failed');
  return data;
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name, email, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  me: () => request('/auth/me'),
  changePassword: (data) =>
    request('/auth/change-password', { method: 'PUT', body: JSON.stringify(data) }),

  // Transactions
  getTransactions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/transactions${qs ? `?${qs}` : ''}`);
  },
  getTransactionSummary: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/transactions/summary${qs ? `?${qs}` : ''}`);
  },
  createTransaction: (data) =>
    request('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id, data) =>
    request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransaction: (id) =>
    request(`/transactions/${id}`, { method: 'DELETE' }),

  // Budget
  getBudgets: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/budget${qs ? `?${qs}` : ''}`);
  },
  createBudget: (data) =>
    request('/budget', { method: 'POST', body: JSON.stringify(data) }),
  deleteBudget: (id) =>
    request(`/budget/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => request('/categories'),
  createCategory: (data) =>
    request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  deleteCategory: (id) =>
    request(`/categories/${id}`, { method: 'DELETE' }),

  // Users
  updateProfile: (data) =>
    request('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
  updateSettings: (data) =>
    request('/users/settings', { method: 'PUT', body: JSON.stringify(data) }),
  uploadAvatar: (file) => uploadFile('/users/avatar', file),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  deleteNotification: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
  getSavingsGoals: () => request('/users/savings-goals'),
  createSavingsGoal: (data) =>
    request('/users/savings-goals', { method: 'POST', body: JSON.stringify(data) }),
  updateSavingsGoal: (id, data) =>
    request(`/users/savings-goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSavingsGoal: (id) =>
    request(`/users/savings-goals/${id}`, { method: 'DELETE' }),

  subscribePush: (subscription) =>
    request('/notifications/subscribe', { method: 'POST', body: JSON.stringify(subscription) }),
  unsubscribePush: (endpoint) =>
    request('/notifications/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint }) }),
  getMilestones: () => request('/milestones'),
};

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getCurrentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

