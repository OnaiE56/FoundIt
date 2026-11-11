import { ApiService } from './api.service.js';

const data = {
  user: null,
  categories: [],
  items: [],
  reports: [],
  claims: [],
  notifications: [],
  adminClaims: [],
  adminStats: {}
};

function toneFor(categoryName) {
  const tones = {
    Electronics: 'blue',
    'Keys & ID Cards': 'amber',
    'Books & Notebooks': 'rose',
    'Bags & Backpacks': 'lavender',
    'Clothing & Accessories': 'mint',
    'Water Bottles': 'mint',
    'Other Items': 'blue'
  };
  return tones[categoryName] || 'blue';
}

function itemForView(item) {
  const category = item.category?.name || item.category || 'Other Items';
  const iconNames = { 'book-open': 'book', briefcase: 'bag', coffee: 'bottle', archive: 'spark' };
  return {
    ...item,
    category,
    art: iconNames[item.category?.iconName] || item.category?.iconName || 'spark',
    tone: toneFor(category),
    dateReported: item.dateReported || item.createdAt
  };
}

function claimForView(claim) {
  const report = claim.report || {};
  return {
    ...claim,
    itemId: claim.reportId || report.id,
    itemName: report.itemName || claim.itemName || 'Item report',
    location: report.location || '',
    art: 'claim',
    tone: 'lavender'
  };
}

export const StudentService = {
  async currentUser() {
    const result = await ApiService.request('/auth/me');
    data.user = result.user;
    return data.user;
  },

  async login(credentials) {
    const result = await ApiService.request('/auth/login', { method: 'POST', body: credentials });
    data.user = result.user;
    return data.user;
  },

  async register(details) {
    const result = await ApiService.request('/auth/register', { method: 'POST', body: details });
    data.user = result.user;
    return data.user;
  },

  async logout() {
    await ApiService.request('/auth/logout', { method: 'POST', body: {} });
    data.user = null;
  },

  async load(route) {
    const categoriesTask = ApiService.request('/categories').then((result) => { data.categories = result.categories; });
    const notificationsTask = ApiService.request('/notifications').then((result) => {
      data.notifications = result.notifications.map((notification) => ({
        ...notification,
        body: notification.message,
        read: notification.isRead,
        icon: 'claim'
      }));
    });

    const routeTask = {
      home: async () => {
        const [items, reports, claims] = await Promise.all([
          ApiService.request('/items'),
          ApiService.request('/users/me/reports'),
          ApiService.request('/users/me/claims')
        ]);
        data.items = items.items.map(itemForView);
        data.reports = reports.reports.map(itemForView);
        data.claims = claims.claims.map(claimForView);
      },
      browse: async () => {
        const [result, reports] = await Promise.all([
          ApiService.request('/items'),
          ApiService.request('/users/me/reports')
        ]);
        data.items = result.items.map(itemForView);
        data.reports = reports.reports.map(itemForView);
      },
      report: async () => {},
      reports: async () => {
        const result = await ApiService.request('/users/me/reports');
        data.reports = result.reports.map(itemForView);
        data.items = mergeById(data.items, data.reports);
      },
      claims: async () => {
        const result = await ApiService.request('/users/me/claims');
        data.claims = result.claims.map(claimForView);
      },
      profile: async () => {
        const result = await ApiService.request('/users/me');
        data.user = result.user;
      },
      admin: async () => {
        const [stats, claims] = await Promise.all([
          ApiService.request('/admin/dashboard-stats'),
          ApiService.request('/admin/claims')
        ]);
        data.adminStats = stats.stats;
        data.adminClaims = claims.claims;
      }
    }[route];

    await Promise.all([categoriesTask, notificationsTask, routeTask ? routeTask() : Promise.resolve()]);
  },

  getUser() { return data.user; },
  clearUser() { data.user = null; },
  getCategories() {
    return data.categories.map((category) => ({
      ...category,
      icon: ({ 'book-open': 'book', briefcase: 'bag', coffee: 'bottle', archive: 'spark' })[category.iconName] || category.iconName,
      count: data.items.filter((item) => item.category === category.name).length
    }));
  },
  getItems() { return data.items.map((item) => ({ ...item })); },
  getItem(id) { return [...data.items, ...data.reports].find((item) => item.id === id) || null; },
  getMyReports() { return data.reports.map((item) => ({ ...item })); },
  getMyClaims() { return data.claims.map((claim) => ({ ...claim })); },
  getNotifications() { return data.notifications.map((notification) => ({ ...notification })); },
  getAdminClaims() { return data.adminClaims.map((claim) => ({ ...claim })); },
  getAdminStats() { return { ...data.adminStats }; },
  getStats() {
    return {
      myReports: data.reports.length,
      activeReports: data.reports.filter((item) => item.status === 'ACTIVE' || item.status === 'CLAIM_PENDING').length,
      pendingClaims: data.claims.filter((claim) => claim.status === 'PENDING').length,
      reunited: data.reports.filter((item) => item.status === 'RESOLVED').length
    };
  },

  async addReport(report) {
    const category = data.categories.find((entry) => entry.name === report.category);
    if (!category) throw new Error('Choose a valid category.');
    const result = await ApiService.request('/items', {
      method: 'POST',
      body: {
        itemName: report.itemName,
        categoryId: category.id,
        reportType: report.reportType,
        description: report.description,
        location: report.location,
        dateReported: new Date(`${report.dateReported}T12:00:00`).toISOString(),
        imageUrl: report.imageUrl || null
      }
    });
    const item = itemForView(result.item);
    data.reports = [item, ...data.reports];
    data.items = mergeById(data.items, [item]);
    return item;
  },

  async uploadReportPhoto(file) {
    const body = new FormData();
    body.append('file', file);
    return ApiService.request('/uploads', { method: 'POST', body });
  },

  async submitClaim(itemId, additionalDetails) {
    const result = await ApiService.request('/claims', {
      method: 'POST',
      body: { reportId: itemId, additionalDetails }
    });
    const claim = claimForView(result.claim);
    const item = data.items.find((entry) => entry.id === itemId);
    if (item) item.status = 'CLAIM_PENDING';
    data.claims = [claim, ...data.claims];
    return claim;
  },

  async markNotificationRead(id) {
    await ApiService.request(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH', body: {} });
    data.notifications = data.notifications.map((entry) => entry.id === id ? { ...entry, isRead: true, read: true } : entry);
  },

  async markAllNotificationsRead() {
    await ApiService.request('/notifications/read-all', { method: 'PATCH', body: {} });
    data.notifications = data.notifications.map((entry) => ({ ...entry, isRead: true, read: true }));
  },

  async reviewClaim(id, decision) {
    await ApiService.request(`/admin/claims/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { decision, decisionNotes: '' }
    });
    data.adminClaims = data.adminClaims.filter((claim) => claim.id !== id);
  }
};

function mergeById(current, added) {
  const byId = new Map(current.map((item) => [item.id, item]));
  added.forEach((item) => byId.set(item.id, item));
  return [...byId.values()].sort((left, right) => new Date(right.dateReported) - new Date(left.dateReported));
}
