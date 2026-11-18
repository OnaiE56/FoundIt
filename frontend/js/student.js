import { CONFIG } from './config.js';
import { Sanitizer } from './utils/sanitizer.util.js';
import { ImageUtil } from './utils/image.util.js';
import { ApiService } from './services/api.service.js';
import { StudentService } from './services/student.service.js';

const pageContent = document.querySelector('#page-content');
const startupRoot = document.querySelector('#app-startup');
const appShell = document.querySelector('.student-app-shell');
const authRoot = document.querySelector('#auth-root');
const sidebar = document.querySelector('#student-sidebar');
const sidebarScrim = document.querySelector('#sidebar-scrim');
const modalRoot = document.querySelector('#modal-root');
const toastRegion = document.querySelector('#toast-region');
const notificationPopover = document.querySelector('#notification-popover');
const notificationToggle = document.querySelector('#notification-toggle');
const studentNavMarkup = document.querySelector('.student-sidebar .cf-sidebar-nav').innerHTML;
const studentBottomNav = document.querySelector('.student-bottom-nav');
const studentBottomNavMarkup = studentBottomNav.innerHTML;

const routeTitles = {
  home: 'Overview',
  browse: 'Browse items',
  report: 'Report an item',
  reports: 'My reports',
  claims: 'My claims',
  profile: 'My profile',
  admin: 'Admin review'
};

const state = {
  route: getRoute(),
  browseType: 'ALL',
  browseCategory: 'All items',
  browseSearch: '',
  reportsFilter: 'ALL',
  claimsFilter: 'ALL',
  reportType: 'LOST',
  activeModalItem: null,
  lastFocusedElement: null,
  authMode: 'login',
  reportPhoto: null,
  reportPhotoPreview: '',
  reportPhotoUrl: '',
  uploadingReport: false
};

function renderAuth(message = '') {
  appShell.hidden = true;
  authRoot.hidden = false;
  const registering = state.authMode === 'register';
  authRoot.innerHTML = `
    <header class="setup-header"><a class="setup-brand" href="#home"><span class="setup-brand-mark">F</span>FoundIt</a><span class="setup-header-note">Find. Report. Reclaim.</span></header>
    <section class="setup-main"><div class="setup-card auth-card">
      <p class="setup-eyebrow"><span class="setup-pulse"></span> CAMPUS LOST &amp; FOUND</p>
      <h1>${registering ? 'Create your account' : 'Welcome back'}</h1>
      <p class="setup-intro">${registering ? 'Join your campus community to report items and make ownership claims.' : 'Sign in to manage your reports and claims.'}</p>
      ${message ? `<p class="auth-message" role="alert">${h(message)}</p>` : ''}
      <form id="auth-form" class="auth-form">
        ${registering ? '<label class="student-form-field"><span>Full name</span><input name="fullName" type="text" minlength="2" maxlength="100" autocomplete="name" required></label>' : ''}
        <label class="student-form-field"><span>Email address</span><input name="email" type="email" maxlength="254" autocomplete="email" required></label>
        <label class="student-form-field"><span>Password</span><input name="password" type="password" minlength="8" maxlength="72" autocomplete="${registering ? 'new-password' : 'current-password'}" required></label>
        ${registering ? '<label class="student-form-field"><span>Confirm password</span><input name="confirmPassword" type="password" minlength="8" maxlength="72" autocomplete="new-password" required></label>' : ''}
        <button class="cf-btn cf-btn-primary auth-submit" type="submit">${registering ? 'Create account' : 'Sign in'}</button>
      </form>
      <p class="auth-switch">${registering ? 'Already have an account?' : 'New to FoundIt?'} <button type="button" data-action="switch-auth">${registering ? 'Sign in' : 'Create an account'}</button></p>
      <p class="setup-footer">Semester project version: email confirmation and password reset are not included.</p>
    </div></section>`;
}

async function loadRoute() {
  const user = StudentService.getUser();
  if (!user) {
    renderAuth();
    return;
  }

  let route = getRoute();
  if (user.role === 'ADMIN' && !['admin', 'profile'].includes(route)) route = 'admin';
  if (user.role !== 'ADMIN' && route === 'admin') route = 'home';
  if (getRoute() !== route) window.location.hash = `#${route}`;
  state.route = route;
  appShell.hidden = false;
  authRoot.hidden = true;

  try {
    await StudentService.load(route);
    render();
  } catch (error) {
    if (error.status === 401) {
      StudentService.clearUser();
      renderAuth('Your session ended. Please sign in again.');
      return;
    }
    render();
    showToast(error.message, 'error');
  }
}

async function startApp() {
  try {
    await ApiService.prepareSession();
    await StudentService.currentUser();
    await loadRoute();
  } catch (error) {
    if (error.status === 401) renderAuth();
    else renderAuth(error.message);
  } finally {
    startupRoot.hidden = true;
  }
}

const h = (value) => Sanitizer.escapeHTML(String(value ?? ''));

const iconShapes = {
  home: '<path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z"/><path d="M9 21v-6h6v6"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  claim: '<path d="M12 3 4.5 6v5.2c0 4.7 3.2 8.8 7.5 9.8 4.3-1 7.5-5.1 7.5-9.8V6z"/><path d="m9 12 2 2 4-4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  spark: '<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  'arrow-up-right': '<path d="M7 17 17 7M8 7h9v9"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  headphones: '<path d="M3 13v-2a9 9 0 0 1 18 0v2"/><rect x="3" y="12" width="4" height="8" rx="2"/><rect x="17" y="12" width="4" height="8" rx="2"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 9h18M16 14h2"/><path d="M7 6V4a1 1 0 0 1 1-1h10"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z"/><path d="M4 16a2.5 2.5 0 0 1 2.5-2.5H20M8 7h7"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3M13 10l3 3"/>',
  bag: '<path d="M4 8h16l1 13H3z"/><path d="M8 8a4 4 0 0 1 8 0M9 13h6"/>',
  shirt: '<path d="m8 4 4 2 4-2 5 3-3 5-2-1v10H8V11l-2 1-3-5z"/><path d="m9 5 3 4 3-4"/>',
  bottle: '<path d="M9 3h6v3l2 2v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8l2-2z"/><path d="M9 6h6M7 12h10"/>',
  id: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16a3 3 0 0 1 6 0M14 10h4M14 14h4"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  filter: '<path d="M4 7h16M7 12h10m-7 5h4"/><circle cx="8" cy="7" r="2"/><circle cx="15" cy="12" r="2"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 2.8a2 2 0 0 1-.6 1.8L7.7 9.6a16 16 0 0 0 6.7 6.7l1.3-1.3a2 2 0 0 1 1.8-.6l2.8.5a2 2 0 0 1 1.7 2z"/>',
  shield: '<path d="M12 3 4.5 6v5.2c0 4.7 3.2 8.8 7.5 9.8 4.3-1 7.5-5.1 7.5-9.8V6z"/><path d="m9 12 2 2 4-4"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>'
};

function icon(name, size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconShapes[name] || iconShapes.spark}</svg>`;
}

function hydrateStaticIcons() {
  document.querySelectorAll('[data-icon]').forEach((element) => {
    if (!element.innerHTML.trim()) element.innerHTML = icon(element.dataset.icon);
  });
}

function getRoute() {
  const route = window.location.hash.replace(/^#\/?/, '').split(/[?&]/)[0];
  return Object.hasOwn(routeTitles, route) ? route : 'home';
}

function formatRelative(value) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'Recently';

  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const absolute = Math.abs(seconds);
  const unit = absolute < 3600 ? 'minute' : absolute < 86_400 ? 'hour' : 'day';
  const divisor = unit === 'minute' ? 60 : unit === 'hour' ? 3600 : 86_400;
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.round(seconds / divisor), unit);
}

function formatDate(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Date not set';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function todayLabel() {
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
}

function badgeForType(type) {
  const isFound = type === 'FOUND';
  return `<span class="student-type-badge ${isFound ? 'is-found' : 'is-lost'}"><span></span>${isFound ? 'Found' : 'Lost'}</span>`;
}

function badgeForStatus(status) {
  const classes = {
    ACTIVE: 'status-active',
    CLAIM_PENDING: 'status-pending',
    RESOLVED: 'status-resolved',
    PENDING: 'status-pending',
    APPROVED: 'status-approved',
    REJECTED: 'status-rejected'
  };
  const labels = {
    ACTIVE: 'Active',
    CLAIM_PENDING: 'Claim pending',
    RESOLVED: 'Resolved',
    PENDING: 'In review',
    APPROVED: 'Approved',
    REJECTED: 'Not approved'
  };
  return `<span class="student-status-badge ${classes[status] || 'status-active'}"><span></span>${labels[status] || h(status)}</span>`;
}

function itemArt(item, large = false) {
  const imageUrl = item.previewUrl || item.imageUrl;
  const preview = imageUrl
    ? `<img class="item-art-preview" src="${h(imageUrl)}" alt="Photo of ${h(item.itemName || 'reported item')}" loading="lazy">`
    : `<span class="item-art-icon">${icon(item.art || 'spark', large ? 54 : 42)}</span>`;
  return `<div class="item-art tone-${h(item.tone || 'blue')} ${large ? 'is-large' : ''}">${preview}<span class="item-art-orbit" aria-hidden="true"></span></div>`;
}

function renderItemCard(item, options = {}) {
  const compact = options.compact === true;
  return `
    <article class="student-item-card ${compact ? 'is-compact' : ''}">
      <button class="student-item-open" type="button" data-action="open-item" data-item-id="${h(item.id)}" aria-label="View ${h(item.itemName)}">
        ${itemArt(item)}
        <span class="student-item-content">
          <span class="student-item-meta">${badgeForType(item.reportType)}<span class="student-item-category">${h(item.category)}</span></span>
          <strong class="student-item-title">${h(item.itemName)}</strong>
          <span class="student-item-location">${icon('pin', 15)}<span>${h(item.location)}</span></span>
          <span class="student-item-date">${formatRelative(item.dateReported)}</span>
        </span>
      </button>
    </article>`;
}

function renderEmptyState(title, description, actionLabel = 'Browse all items', action = 'clear-filters') {
  return `
    <div class="student-empty-state">
      <span class="empty-state-icon">${icon('search', 28)}</span>
      <h3>${h(title)}</h3>
      <p>${h(description)}</p>
      <button class="cf-btn cf-btn-outline" type="button" data-action="${h(action)}">${h(actionLabel)}</button>
    </div>`;
}

function renderPageHeading(eyebrow, title, description, action = '') {
  return `
    <div class="student-page-heading">
      <div>
        <p class="student-eyebrow">${h(eyebrow)}</p>
        <h1>${h(title)}</h1>
        <p>${h(description)}</p>
      </div>
      ${action}
    </div>`;
}

function renderDashboard() {
  const stats = StudentService.getStats();
  const recentItems = StudentService.getItems().slice(0, 3);
  const claims = StudentService.getMyClaims().slice(0, 2);
  const firstName = StudentService.getUser()?.fullName?.split(' ')[0] || 'there';

  return `
    <div class="student-page dashboard-page">
      <div class="student-page-heading dashboard-heading">
        <div>
          <p class="student-eyebrow">${h(todayLabel())}</p>
          <h1>Good to see you, ${h(firstName)} <span class="wave-emoji" aria-hidden="true">✦</span></h1>
          <p>Here’s what’s happening across campus today.</p>
        </div>
        <a class="cf-btn cf-btn-primary" href="#report">${icon('plus', 18)}Report an item</a>
      </div>

      <section class="student-welcome-banner" aria-label="FoundIt welcome">
        <div class="welcome-copy">
          <span class="welcome-overline"><span></span> YOUR CAMPUS, CONNECTED</span>
          <h2>Lost something?<br><span>Let’s bring it back.</span></h2>
          <p>Share a few details or browse what your campus community has found.</p>
          <div class="welcome-actions">
            <a class="cf-btn cf-btn-white" href="#report">Report an item ${icon('arrow-right', 17)}</a>
            <a class="welcome-link" href="#browse">Browse recent finds</a>
          </div>
        </div>
        <div class="welcome-illustration" aria-hidden="true">
          <span class="welcome-ring ring-one"></span>
          <span class="welcome-ring ring-two"></span>
          <span class="welcome-spark spark-one">✦</span>
          <span class="welcome-spark spark-two">✧</span>
          <span class="welcome-pin-card">${icon('pin', 30)}<span>On campus</span></span>
          <span class="welcome-found-card"><span class="found-card-icon">${icon('check', 18)}</span><span><strong>One more reunion</strong><small>starts with a report</small></span></span>
        </div>
      </section>

      <section class="student-stats-grid" aria-label="Your activity at a glance">
        ${renderStat('My reports', stats.myReports, 'file', 'blue', 'Your items shared with campus')}
        ${renderStat('Active reports', stats.activeReports, 'search', 'amber', 'Still looking for a match')}
        ${renderStat('Pending claims', stats.pendingClaims, 'clock', 'violet', 'Waiting for a review')}
        ${renderStat('Reunited', stats.reunited, 'check', 'green', 'Items back where they belong')}
      </section>

      <div class="student-dashboard-columns">
        <section class="student-panel recent-panel">
          <div class="student-section-heading">
            <div><p class="student-eyebrow">THE COMMUNITY</p><h2>Recently reported</h2></div>
            <a class="student-text-link" href="#browse">Browse all ${icon('arrow-right', 16)}</a>
          </div>
          <div class="student-item-grid dashboard-item-grid">${recentItems.length ? recentItems.map((item) => renderItemCard(item, { compact: true })).join('') : '<p class="student-empty-copy">No campus reports yet. Be the first to add one.</p>'}</div>
        </section>

        <aside class="student-panel activity-panel" aria-labelledby="activity-title">
          <div class="student-section-heading">
            <div><p class="student-eyebrow">A LITTLE UPDATE</p><h2 id="activity-title">Your activity</h2></div>
            <a class="student-icon-link" href="#claims" aria-label="View your claims">${icon('arrow-up-right', 17)}</a>
          </div>
          <div class="activity-list">${claims.length ? claims.map((claim) => `<div class="activity-item"><span class="activity-icon tone-lavender">${icon('claim', 17)}</span><div><strong>${h(claim.itemName)}</strong><p>${h(claim.status === 'PENDING' ? 'Your claim is being reviewed.' : `Claim status: ${claim.status.toLowerCase()}.`)}</p><small>${formatRelative(claim.createdAt)}</small></div></div>`).join('') : '<p class="student-empty-copy">Your claim updates will appear here.</p>'}</div>
          <a class="activity-footer-link" href="#claims">See your claims ${icon('arrow-right', 16)}</a>
        </aside>
      </div>

      <section class="student-panel categories-panel">
        <div class="student-section-heading">
          <div><p class="student-eyebrow">START WITH A CATEGORY</p><h2>What are you looking for?</h2></div>
          <a class="student-text-link" href="#browse">View all items ${icon('arrow-right', 16)}</a>
        </div>
        <div class="category-shortcuts">
          ${StudentService.getCategories().slice(0, 6).map((category) => `
            <button class="category-shortcut" type="button" data-action="browse-category" data-category="${h(category.name)}">
              <span class="category-shortcut-icon tone-${categoryTone(category.name)}">${icon(category.icon, 20)}</span>
              <span><strong>${h(category.name)}</strong><small>${category.count} recent posts</small></span>
              ${icon('arrow-right', 15)}
            </button>`).join('')}
        </div>
      </section>

    </div>`;
}

function renderStat(label, value, iconName, tone, detail) {
  return `
    <article class="student-stat-card">
      <div class="stat-card-top"><span class="stat-icon tone-${tone}">${icon(iconName, 20)}</span><span class="stat-card-mark">${icon('arrow-up-right', 15)}</span></div>
      <strong class="stat-value">${h(value)}</strong>
      <span class="stat-label">${h(label)}</span>
      <small>${h(detail)}</small>
    </article>`;
}

function renderBrowse() {
  const categories = StudentService.getCategories();
  return `
    <div class="student-page browse-page">
      ${renderPageHeading('CAMPUS COMMUNITY', 'Browse items', 'A little detail can help you spot what you’re looking for.', `<span class="student-page-heading-action"><a class="cf-btn cf-btn-primary" href="#report">${icon('plus', 18)}Report an item</a></span>`)}

      <section class="browse-toolbar student-panel" aria-label="Filter items">
        <div class="browse-search-wrap">
          <label class="sr-only" for="browse-search">Search item names and locations</label>
          <span data-icon="search">${icon('search', 19)}</span>
          <input id="browse-search" type="search" value="${h(state.browseSearch)}" placeholder="Try “blue backpack” or “library”" autocomplete="off">
          <kbd>Ctrl K</kbd>
        </div>
        <div class="browse-filter-row">
          <div class="student-toggle-group" role="group" aria-label="Item type">
            ${['ALL', 'LOST', 'FOUND'].map((type) => `<button type="button" data-action="set-browse-type" data-type="${type}" class="${state.browseType === type ? 'is-active' : ''}" aria-pressed="${state.browseType === type}">${type === 'ALL' ? 'All items' : type === 'LOST' ? 'Lost' : 'Found'}</button>`).join('')}
          </div>
          <label class="browse-select-wrap"><span>${icon('filter', 17)}<span class="sr-only">Category</span></span>
            <select id="browse-category" aria-label="Filter by category">
              <option value="All items" ${state.browseCategory === 'All items' ? 'selected' : ''}>All categories</option>
              ${categories.map((category) => `<option value="${h(category.name)}" ${state.browseCategory === category.name ? 'selected' : ''}>${h(category.name)}</option>`).join('')}
            </select>${icon('chevron-down', 15)}
          </label>
          <span class="browse-updated">${icon('clock', 15)} Updated just now</span>
        </div>
      </section>

      <div class="browse-results-heading"><div><span class="student-eyebrow">CAMPUS-WIDE</span><h2>Items near you</h2></div><span class="results-count" id="browse-results-count"></span></div>
      <div class="student-item-grid browse-item-grid" id="browse-results" aria-live="polite"></div>
      <div class="student-demo-note">${icon('shield', 16)}<span>Student IDs and private contact details are never shown on public item cards.</span></div>
    </div>`;
}

function getBrowseItems() {
  const query = state.browseSearch.trim().toLowerCase();
  return StudentService.getItems().filter((item) => {
    const matchesStatus = item.status === 'ACTIVE';
    const matchesType = state.browseType === 'ALL' || item.reportType === state.browseType;
    const matchesCategory = state.browseCategory === 'All items' || item.category === state.browseCategory;
    const searchableText = `${item.itemName} ${item.description} ${item.location} ${item.category}`.toLowerCase();
    const matchesSearch = !query || searchableText.includes(query);
    return matchesStatus && matchesType && matchesCategory && matchesSearch;
  });
}

function updateBrowseResults() {
  const resultsRoot = document.querySelector('#browse-results');
  if (!resultsRoot) return;
  const results = getBrowseItems();
  const countLabel = document.querySelector('#browse-results-count');
  if (countLabel) countLabel.textContent = `${results.length} ${results.length === 1 ? 'item' : 'items'}`;

  resultsRoot.innerHTML = results.length
    ? results.map((item) => renderItemCard(item)).join('')
    : renderEmptyState('No matching items', 'Try a different search or clear the filters to see more campus posts.', 'Clear filters');
}

function renderReportForm() {
  const categories = StudentService.getCategories();
  const locations = CONFIG.LOCATIONS;
  const categoryOptions = categories.map((category) => `<option value="${h(category.name)}">${h(category.name)}</option>`).join('');
  const locationOptions = locations.map((location) => `<option value="${h(location)}">${h(location)}</option>`).join('');

  return `
    <div class="student-page report-page">
      ${renderPageHeading('HELP YOUR COMMUNITY', 'Report an item', 'Share the details that could help someone recognize a lost or found belonging.')}
      <div class="report-layout">
        <form class="student-panel report-form" id="report-form">
          <div class="form-section-heading"><span class="form-step">01</span><div><h2>What happened?</h2><p>Start with the basics. You can add a photo if you have one.</p></div></div>

          <fieldset class="report-type-fieldset">
            <legend>Choose a report type</legend>
            <div class="report-type-options">
              <button class="report-type-choice ${state.reportType === 'LOST' ? 'is-active' : ''}" type="button" data-action="set-report-type" data-type="LOST" aria-pressed="${state.reportType === 'LOST'}">
                <span class="report-type-icon lost-icon">${icon('search', 20)}</span><span><strong>I lost something</strong><small>Help me find it</small></span><span class="choice-check">${icon('check', 14)}</span>
              </button>
              <button class="report-type-choice ${state.reportType === 'FOUND' ? 'is-active' : ''}" type="button" data-action="set-report-type" data-type="FOUND" aria-pressed="${state.reportType === 'FOUND'}">
                <span class="report-type-icon found-icon">${icon('spark', 20)}</span><span><strong>I found something</strong><small>Help it find its owner</small></span><span class="choice-check">${icon('check', 14)}</span>
              </button>
            </div>
          </fieldset>

          <div class="form-grid-two">
            <label class="student-form-field"><span>Item name <b>*</b></span><input name="itemName" type="text" maxlength="120" placeholder="e.g. Blue water bottle" required></label>
            <label class="student-form-field"><span>Category <b>*</b></span><select name="category" required><option value="" disabled selected>Choose a category</option>${categoryOptions}</select></label>
          </div>

          <label class="student-form-field"><span>Description <b>*</b></span><textarea name="description" rows="4" maxlength="1000" placeholder="Add a few details that help identify it. Keep private information out of the description." required></textarea><small>For privacy, don’t include student ID numbers or personal contact details.</small></label>

          <div class="form-grid-two">
            <label class="student-form-field"><span>${state.reportType === 'LOST' ? 'Last seen' : 'Found at'} <b>*</b></span><select name="location" required><option value="" disabled selected>Choose a campus location</option>${locationOptions}</select></label>
            <label class="student-form-field"><span>${state.reportType === 'LOST' ? 'Date last seen' : 'Date found'} <b>*</b></span><input name="dateReported" type="date" max="${new Date().toISOString().slice(0, 10)}" value="${new Date().toISOString().slice(0, 10)}" required></label>
          </div>

          <div class="form-grid-two report-contact-fields">
            <label class="student-form-field"><span>Contact method <small class="optional-label">OPTIONAL</small></span><select id="report-contact-method" name="contactMethod"><option value="EMAIL">Email</option><option value="WHATSAPP">WhatsApp</option><option value="PHONE">Call</option></select></label>
            <label class="student-form-field"><span>Contact details <small class="optional-label">OPTIONAL</small></span><input id="report-contact-value" name="contactValue" type="email" maxlength="254" autocomplete="email" placeholder="you@example.com"><small id="report-contact-hint">Visible to anyone viewing this item. Leave blank to keep it private.</small></label>
          </div>

          <div class="student-form-field report-photo-field">
            <span>Item photo <small class="optional-label">OPTIONAL</small></span>
            <label class="report-dropzone" for="report-photo-input">
              <span class="dropzone-icon">${icon('image', 19)}</span>
              <span><strong id="report-photo-label">${state.reportPhoto ? h(state.reportPhoto.name) : 'Add a photo of the item'}</strong><small id="report-photo-hint">JPEG, PNG, or WebP, up to 4 MB. Shown with your report.</small></span>
              <span class="cf-btn cf-btn-secondary">Choose photo</span>
              <input id="report-photo-input" name="photo" type="file" accept="image/jpeg,image/png,image/webp" hidden>
            </label>
            <p class="report-photo-error" id="report-photo-error" role="alert" hidden></p>
            <div class="report-preview" id="report-photo-preview" ${state.reportPhotoPreview ? '' : 'hidden'}>
              ${state.reportPhotoPreview ? `<img src="${h(state.reportPhotoPreview)}" alt="Selected item photo preview">` : ''}
              <button class="remove-preview" type="button" data-action="remove-report-photo" aria-label="Remove selected photo">${icon('close', 15)}</button>
            </div>
          </div>

          <div class="report-form-actions"><span>${icon('shield', 17)}Contact details are optional.</span><button class="cf-btn cf-btn-primary" type="submit" ${state.uploadingReport ? 'disabled' : ''}>${state.uploadingReport ? 'Saving report…' : `Submit report ${icon('arrow-right', 17)}`}</button></div>
        </form>

        <aside class="report-side-column">
          <section class="student-panel report-guidance">
            <span class="guidance-icon">${icon('spark', 20)}</span><p class="student-eyebrow">A HELPFUL TIP</p><h2>Make the details count.</h2>
            <p>Include a color, brand, or distinctive feature. Avoid posting serial numbers or information someone could use to falsely claim an item.</p>
            <div class="guidance-example"><span>${icon('check', 15)}</span><p><strong>Helpful:</strong> “Green bottle with a white mountain sticker.”</p></div>
            <div class="guidance-example is-muted"><span>${icon('close', 15)}</span><p><strong>Avoid:</strong> Putting contact details in the item description.</p></div>
          </section>
          <section class="student-panel report-privacy-card"><span class="privacy-shield">${icon('shield', 21)}</span><div><h3>Your privacy matters</h3><p>Contact details only appear on this report when you add them. Student IDs are never shown publicly.</p></div></section>
        </aside>
      </div>
    </div>`;
}

function renderReports() {
  const reports = StudentService.getMyReports().filter((item) => (
    state.reportsFilter === 'ALL' || (state.reportsFilter === 'ACTIVE' ? ['ACTIVE', 'CLAIM_PENDING'].includes(item.status) : item.status === state.reportsFilter)
  ));
  const allReports = StudentService.getMyReports();

  return `
    <div class="student-page reports-page">
      ${renderPageHeading('YOUR POSTS', 'My reports', 'Keep track of the items you’ve shared with your campus community.', `<a class="cf-btn cf-btn-primary" href="#report">${icon('plus', 18)}New report</a>`)}
      <section class="student-stats-grid reports-mini-stats" aria-label="Report totals">
        ${renderMiniStat('All reports', allReports.length, 'file', 'blue')}
        ${renderMiniStat('Active', allReports.filter((item) => ['ACTIVE', 'CLAIM_PENDING'].includes(item.status)).length, 'clock', 'amber')}
        ${renderMiniStat('Resolved', allReports.filter((item) => item.status === 'RESOLVED').length, 'check', 'green')}
      </section>
      <div class="student-section-heading reports-list-heading"><div><p class="student-eyebrow">YOUR ACTIVITY</p><h2>Reports you’ve made</h2></div>
        <div class="compact-filter-group" role="group" aria-label="Filter your reports">
          ${[['ALL', 'All'], ['ACTIVE', 'Active'], ['RESOLVED', 'Resolved']].map(([value, label]) => `<button type="button" data-action="set-report-filter" data-filter="${value}" class="${state.reportsFilter === value ? 'is-active' : ''}" aria-pressed="${state.reportsFilter === value}">${label}</button>`).join('')}
        </div>
      </div>
      <div class="reports-list">
        ${reports.length ? reports.map((item) => renderReportRow(item)).join('') : renderEmptyState('No reports in this view', 'Try another filter or share a new item with your campus.', 'Create a report', 'go-report')}
      </div>
    </div>`;
}

function renderMiniStat(label, value, iconName, tone) {
  return `<article class="student-stat-card mini-stat"><span class="stat-icon tone-${tone}">${icon(iconName, 19)}</span><span class="mini-stat-value">${h(value)}</span><span class="mini-stat-label">${h(label)}</span></article>`;
}

function renderReportRow(item) {
  const resolveAction = ['ACTIVE', 'CLAIM_PENDING'].includes(item.status)
    ? `<button class="cf-btn cf-btn-outline report-action-resolve" type="button" data-action="mark-report-resolved" data-item-id="${h(item.id)}">Mark resolved</button>`
    : '';
  return `
    <article class="report-row student-panel">
      ${itemArt(item)}
      <div class="report-row-main"><div class="student-item-meta">${badgeForType(item.reportType)}<span class="student-item-category">${h(item.category)}</span>${item.claimsCount ? `<span class="report-claims-count">${item.claimsCount} claim${item.claimsCount === 1 ? '' : 's'}</span>` : ''}</div><h3>${h(item.itemName)}</h3><p>${h(item.description)}</p><span class="student-item-location">${icon('pin', 15)}${h(item.location)} <span class="meta-dot">·</span> ${formatDate(item.dateReported)}</span></div>
      <div class="report-row-status">${badgeForStatus(item.status)}<div class="report-row-actions">${resolveAction}<button class="cf-btn cf-btn-outline report-action-delete" type="button" data-action="delete-report" data-item-id="${h(item.id)}">Delete</button><button class="student-icon-link" type="button" data-action="open-item" data-item-id="${h(item.id)}" aria-label="View ${h(item.itemName)}">${icon('arrow-up-right', 18)}</button></div></div>
    </article>`;
}

function renderClaims() {
  const allClaims = StudentService.getMyClaims();
  const claimsToShow = allClaims.filter((claim) => state.claimsFilter === 'ALL' || claim.status === state.claimsFilter);
  return `
    <div class="student-page claims-page">
      ${renderPageHeading('KEEP IN THE LOOP', 'My claims', 'Follow your claim reviews and see where each one stands.')}
      <section class="claims-status-banner"><span class="claims-banner-icon">${icon('shield', 22)}</span><div><strong>Your details stay with the review team.</strong><p>Claim information is only visible to the people reviewing it.</p></div><span class="claims-banner-art" aria-hidden="true">✦</span></section>
      <div class="student-section-heading claims-list-heading"><div><p class="student-eyebrow">CLAIM HISTORY</p><h2>Your item claims</h2></div>
        <div class="compact-filter-group" role="group" aria-label="Filter your claims">
          ${[['ALL', 'All claims'], ['PENDING', 'In review'], ['APPROVED', 'Approved']].map(([value, label]) => `<button type="button" data-action="set-claim-filter" data-filter="${value}" class="${state.claimsFilter === value ? 'is-active' : ''}" aria-pressed="${state.claimsFilter === value}">${label}</button>`).join('')}
        </div>
      </div>
      <div class="claims-list">
        ${claimsToShow.length ? claimsToShow.map((claim) => renderClaimRow(claim)).join('') : renderEmptyState('No claims here yet', 'When you submit a claim for a found item, its review status will appear here.', 'Browse found items', 'go-found')}
      </div>
    </div>`;
}

function renderClaimRow(claim) {
  const statusCopy = {
    PENDING: 'The campus team is reviewing the information you shared.',
    APPROVED: 'Your claim was approved. Follow the campus team’s instructions to collect the item.',
    REJECTED: 'This claim was not approved. Check the decision notes for more information.'
  };
  return `
    <article class="claim-row student-panel">
      ${itemArt(claim)}
      <div class="claim-row-main"><p class="student-eyebrow">SUBMITTED ${h(formatDate(claim.createdAt).toUpperCase())}</p><h3>${h(claim.itemName)}</h3><p>${h(statusCopy[claim.status] || 'Your claim status will be updated here.')}</p><span class="student-item-location">${icon('pin', 15)}${h(claim.location)}</span></div>
      <div class="claim-row-status">${badgeForStatus(claim.status)}<span>${claim.status === 'PENDING' ? 'Usually reviewed within 1–2 campus days' : claim.status === 'APPROVED' ? 'Review complete' : 'Review complete'}</span></div>
    </article>`;
}

function renderProfile() {
  const user = StudentService.getUser() || {};
  const initials = user.fullName?.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'FI';
  const joined = user.createdAt ? formatDate(user.createdAt) : 'Recently';
  return `
    <div class="student-page profile-page">
      ${renderPageHeading('YOUR ACCOUNT', 'My profile', 'Your account details and verification status, all in one place.')}
      <section class="student-profile-hero student-panel">
        <div class="profile-avatar-large">${h(initials)}<span class="profile-online-dot"></span></div>
        <div class="profile-identity"><p class="student-eyebrow">${h(user.role || 'STUDENT')} ACCOUNT</p><h2>${h(user.fullName)}</h2><p>${h(user.email)}</p><span class="profile-member-since">FoundIt member since ${h(joined)}</span></div>
        <button type="button" class="cf-btn cf-btn-outline" data-action="logout">Sign out</button>
      </section>
      <div class="profile-grid">
        <section class="student-panel profile-card">
          <div class="student-section-heading"><div><p class="student-eyebrow">ACCOUNT DETAILS</p><h2>Personal information</h2></div><span class="profile-lock-icon">${icon('shield', 18)}</span></div>
          <dl class="profile-details"><div><dt>Full name</dt><dd>${h(user.fullName)}</dd></div><div><dt>Email address</dt><dd>${h(user.email)}</dd></div><div><dt>Student ID</dt><dd class="private-value">${user.studentId ? h(user.studentId) : 'Not provided'}</dd></div><div><dt>Role</dt><dd>${h(user.role)}</dd></div></dl>
          <p class="profile-private-note">${icon('lock', 16)}Only you can see your personal details.</p>
        </section>
        <section class="student-panel profile-card verification-card">
          <div class="student-section-heading"><div><p class="student-eyebrow">ACCOUNT STATUS</p><h2>Verification</h2></div></div>
          <div class="verification-item"><span class="verification-icon is-pending">${icon('mail', 18)}</span><div><strong>Email ownership</strong><p>Email confirmation is not included in this project version.</p></div><span class="verification-status is-pending">Not verified</span></div>
          <div class="verification-item"><span class="verification-icon is-pending">${icon('user', 18)}</span><div><strong>Student identity</strong><p>Institutional student verification is separate from email.</p></div><span class="verification-status is-pending">Pending</span></div>
          <div class="verification-info">${icon('info', 16)}Account verification needs university email services and is outside this semester build.</div>
        </section>
      </div>
      <section class="student-panel privacy-preferences"><div class="privacy-preferences-icon">${icon('shield', 20)}</div><div><h2>Your privacy on FoundIt</h2><p>Public browse cards leave out student IDs, emails, and private contact information. The details you add to a claim are only for the review team.</p></div></section>
    </div>`;
}

function renderAdmin() {
  const stats = StudentService.getAdminStats();
  const claims = StudentService.getAdminClaims();
  return `
    <div class="student-page admin-page">
      ${renderPageHeading('CAMPUS MANAGEMENT', 'Claim review', 'Review ownership details and decide which claims to approve.')}
      <section class="student-stats-grid" aria-label="Campus report totals">
        ${renderStat('All reports', stats.totalReports || 0, 'file', 'blue', 'Reports submitted')}
        ${renderStat('Lost items', stats.activeLost || 0, 'search', 'amber', 'Currently active')}
        ${renderStat('Found items', stats.activeFound || 0, 'spark', 'green', 'Currently available')}
        ${renderStat('Pending claims', stats.pendingClaims || 0, 'clock', 'violet', 'Awaiting review')}
      </section>
      <section class="student-panel admin-claims-panel">
        <div class="student-section-heading"><div><p class="student-eyebrow">MODERATION</p><h2>Claims awaiting review</h2></div></div>
        ${claims.length ? `<div class="admin-claim-list">${claims.map((claim) => `
          <article class="admin-claim-row">
            <div><h3>${h(claim.report.itemName)}</h3><p>${h(claim.claimant.fullName)} · ${h(claim.claimant.email)}</p><p>${h(claim.additionalDetails)}</p><small>${h(claim.report.location)} · ${formatDate(claim.createdAt)}</small></div>
            <div class="admin-claim-actions"><button class="cf-btn cf-btn-primary" type="button" data-action="review-claim" data-claim-id="${h(claim.id)}" data-decision="APPROVED">Approve</button><button class="cf-btn cf-btn-outline" type="button" data-action="review-claim" data-claim-id="${h(claim.id)}" data-decision="REJECTED">Reject</button></div>
          </article>`).join('')}</div>` : '<p class="student-empty-copy">There are no claims to review.</p>'}
      </section>
    </div>`;
}

function categoryTone(name) {
  const tones = {
    Electronics: 'blue',
    'Keys & ID Cards': 'amber',
    'Books & Notebooks': 'rose',
    'Bags & Backpacks': 'lavender',
    'Clothing & Accessories': 'mint',
    'Water Bottles': 'mint',
    'Other Items': 'blue'
  };
  return tones[name] || 'blue';
}

const pageRenderers = {
  home: renderDashboard,
  browse: renderBrowse,
  report: renderReportForm,
  reports: renderReports,
  claims: renderClaims,
  profile: renderProfile,
  admin: renderAdmin
};

function render() {
  state.route = getRoute();
  const user = StudentService.getUser();
  if (!user) return;
  const admin = user.role === 'ADMIN';
  const nav = document.querySelector('.student-sidebar .cf-sidebar-nav');
  document.querySelector('.student-sidebar-caption').textContent = admin ? 'ADMIN SPACE' : 'STUDENT SPACE';
  nav.innerHTML = admin
    ? `<a class="cf-nav-item" href="#admin" data-nav-route="admin"><span data-icon="shield"></span><span>Claim review</span></a><a class="cf-nav-item" href="#profile" data-nav-route="profile"><span data-icon="user"></span><span>My profile</span></a>`
    : studentNavMarkup;
  studentBottomNav.hidden = admin;
  studentBottomNav.innerHTML = studentBottomNavMarkup;
  const initials = user.fullName.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  document.querySelector('#sidebar-user-name').textContent = user.fullName;
  document.querySelector('#sidebar-user-role').textContent = admin ? 'Administrator' : 'Student account';
  document.querySelector('#sidebar-user-avatar').textContent = initials;
  document.querySelector('#header-user-name').textContent = user.fullName;
  document.querySelector('#header-user-role').textContent = admin ? 'Administrator' : 'Student';
  document.querySelector('#header-user-avatar').textContent = initials;
  document.title = `${routeTitles[state.route]} · FoundIt`;
  document.querySelector('#header-page-title').textContent = routeTitles[state.route] || 'Overview';
  hydrateStaticIcons();
  document.querySelectorAll('[data-nav-route]').forEach((link) => {
    const active = link.dataset.navRoute === state.route;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const reportCount = StudentService.getMyReports().length;
  const reportCountElement = document.querySelector('#report-nav-count');
  if (reportCountElement) reportCountElement.textContent = String(reportCount);
  pageContent.innerHTML = (pageRenderers[state.route] || pageRenderers.home)();
  closeSidebar();

  if (state.route === 'browse') updateBrowseResults();
  renderNotificationPopover();
}

function renderNotificationPopover() {
  const allNotifications = StudentService.getNotifications();
  const unreadCount = allNotifications.filter((notification) => !notification.read).length;
  notificationToggle.setAttribute('aria-label', `Notifications, ${unreadCount} unread`);
  notificationToggle.classList.toggle('has-unread', unreadCount > 0);
  notificationPopover.innerHTML = `
    <div class="notification-popover-heading"><div><p class="student-eyebrow">YOUR UPDATES</p><h2>Notifications</h2></div><button type="button" class="notification-read-all" data-action="mark-all-read">Mark all read</button></div>
    <div class="notification-list">${allNotifications.length ? allNotifications.map((notification) => `
      <button class="notification-item ${notification.read ? '' : 'is-unread'}" type="button" data-action="mark-notification" data-notification-id="${h(notification.id)}">
        <span class="notification-item-icon">${icon(notification.icon, 17)}</span><span><strong>${h(notification.title)}</strong><small>${h(notification.body)}</small><em>${formatRelative(notification.createdAt)}</em></span>${notification.read ? '' : '<span class="notification-unread-dot"></span>'}
      </button>`).join('') : '<p class="student-empty-copy">You are all caught up.</p>'}</div>
    <a href="#claims" class="notification-footer-link">View claim activity ${icon('arrow-right', 15)}</a>`;
}

function openSidebar() {
  sidebar.classList.add('open');
  sidebarScrim.classList.add('is-visible');
  document.querySelector('#menu-toggle').setAttribute('aria-expanded', 'true');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarScrim.classList.remove('is-visible');
  document.querySelector('#menu-toggle').setAttribute('aria-expanded', 'false');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `cf-toast student-toast cf-toast-${type}`;
  toast.innerHTML = `<span class="student-toast-icon">${icon(type === 'success' ? 'check' : type === 'error' ? 'info' : 'spark', 18)}</span><span>${h(message)}</span><button type="button" data-action="dismiss-toast" aria-label="Dismiss message">${icon('close', 15)}</button>`;
  toastRegion.append(toast);
  window.setTimeout(() => toast.remove(), 4500);
}

async function openItemModal(itemId) {
  let item;
  try {
    item = await StudentService.getItemDetails(itemId);
  } catch (error) {
    showToast(error.message, 'error');
    return;
  }
  if (!item) return;
  state.activeModalItem = item.id;
  state.lastFocusedElement = document.activeElement;
  const isOwnReport = StudentService.getMyReports().some((report) => report.id === item.id);
  const hasPendingClaim = StudentService.getMyClaims().some((claim) => claim.itemId === item.id && claim.status === 'PENDING');
  modalRoot.innerHTML = `
    <div class="student-modal-backdrop" data-action="backdrop-close">
      <section class="student-item-modal" role="dialog" aria-modal="true" aria-labelledby="modal-item-title" aria-describedby="modal-item-description">
        <button class="modal-close-button" type="button" data-action="close-modal" aria-label="Close item details">${icon('close', 19)}</button>
        ${itemArt(item, true)}
        <div class="modal-item-body">
          <div class="student-item-meta">${badgeForType(item.reportType)}<span class="student-item-category">${h(item.category)}</span>${badgeForStatus(item.status)}</div>
          <h2 id="modal-item-title">${h(item.itemName)}</h2>
          <p class="modal-item-description" id="modal-item-description">${h(item.description)}</p>
          <div class="modal-item-facts"><span>${icon('pin', 17)}<span><small>Campus location</small><strong>${h(item.location)}</strong></span></span><span>${icon('calendar', 17)}<span><small>Reported</small><strong>${formatDate(item.dateReported)}</strong></span></span></div>
          <div class="modal-privacy-note">${icon('shield', 16)}${item.contactMethod ? 'The reporter shared a contact method for this item.' : 'The reporter has not added public contact details.'}</div>
          <div class="modal-actions">
            ${renderContactAction(item, isOwnReport)}
            ${item.reportType === 'FOUND' && item.status === 'ACTIVE' && !isOwnReport
              ? `<button class="cf-btn cf-btn-primary" type="button" data-action="submit-claim" data-item-id="${h(item.id)}" ${hasPendingClaim ? 'disabled' : ''}>${hasPendingClaim ? 'Claim submitted' : 'I think this is mine'} ${icon('arrow-right', 17)}</button>`
              : `<a class="cf-btn cf-btn-primary" href="#browse" data-action="close-modal">Back to browse ${icon('arrow-right', 17)}</a>`}
            <span class="modal-demo-caption">Ownership details are shared with the campus review team.</span>
          </div>
        </div>
      </section>
    </div>`;
  modalRoot.querySelector('.modal-close-button')?.focus();
}

function renderContactAction(item, isOwnReport) {
  if (isOwnReport || !item.contactMethod || !item.contactValue) return '';
  const subject = encodeURIComponent(`FoundIt: ${item.itemName}`);
  let href;
  let label;
  let iconName = 'phone';
  let target = '';
  if (item.contactMethod === 'EMAIL') {
    href = `mailto:${item.contactValue}?subject=${subject}`;
    label = `Email ${item.contactValue}`;
    iconName = 'mail';
  } else if (item.contactMethod === 'WHATSAPP') {
    const digits = item.contactValue.replace(/\D/g, '');
    href = `https://wa.me/${digits}?text=${encodeURIComponent(`Hi, I’m contacting you about “${item.itemName}” on FoundIt.`)}`;
    label = `WhatsApp ${item.contactValue}`;
    target = ' target="_blank" rel="noopener noreferrer"';
  } else if (item.contactMethod === 'PHONE') {
    href = `tel:${item.contactValue}`;
    label = `Call ${item.contactValue}`;
  } else {
    return '';
  }
  return `<a class="cf-btn cf-btn-secondary modal-contact-link" href="${h(href)}"${target}>${h(label)} ${icon(iconName, 17)}</a>`;
}

function closeModal() {
  modalRoot.innerHTML = '';
  state.activeModalItem = null;
  if (state.lastFocusedElement instanceof HTMLElement) state.lastFocusedElement.focus();
}

function updateReportTypeButtons() {
  pageContent.querySelectorAll('[data-action="set-report-type"]').forEach((button) => {
    const active = button.dataset.type === state.reportType;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  const locationLabel = pageContent.querySelector('[name="location"]')?.closest('.student-form-field')?.querySelector('span');
  const dateLabel = pageContent.querySelector('[name="dateReported"]')?.closest('.student-form-field')?.querySelector('span');
  if (locationLabel) locationLabel.innerHTML = `${state.reportType === 'LOST' ? 'Last seen' : 'Found at'} <b>*</b>`;
  if (dateLabel) dateLabel.innerHTML = `${state.reportType === 'LOST' ? 'Date last seen' : 'Date found'} <b>*</b>`;
}

function updateReportContactField() {
  const method = pageContent.querySelector('#report-contact-method')?.value;
  const input = pageContent.querySelector('#report-contact-value');
  const hint = pageContent.querySelector('#report-contact-hint');
  if (!input || !method) return;
  if (method === 'EMAIL') {
    input.type = 'email';
    input.removeAttribute('pattern');
    input.autocomplete = 'email';
    input.placeholder = 'you@example.com';
    if (hint) hint.textContent = 'Visible to anyone viewing this item. Leave blank to keep it private.';
    return;
  }
  input.type = 'tel';
  input.pattern = '\\+[1-9][0-9\\s().-]{6,20}';
  input.autocomplete = 'tel';
  input.placeholder = '+233 20 123 4567';
  if (hint) hint.textContent = 'Include the country code. This number is visible to anyone viewing this item.';
}

async function handleClick(event) {
  const actionElement = event.target.closest('[data-action]');
  if (!actionElement) return;
  const action = actionElement.dataset.action;

  if (action === 'open-item' || action === 'set-browse-type' || action === 'set-report-type' || action === 'set-report-filter' || action === 'set-claim-filter' || action.startsWith('go-') || action === 'clear-filters' || action === 'browse-category' || action === 'mark-notification' || action === 'mark-all-read' || action === 'submit-claim' || action === 'review-claim' || action === 'mark-report-resolved' || action === 'delete-report' || action === 'switch-auth' || action === 'logout' || action === 'close-modal' || action === 'backdrop-close' || action === 'dismiss-toast' || action === 'open-menu' || action === 'close-menu' || action === 'toggle-notifications' || action === 'remove-report-photo') {
    if (action !== 'close-modal' && action !== 'backdrop-close' && action !== 'dismiss-toast') event.preventDefault();
  }

  switch (action) {
    case 'open-menu':
      openSidebar();
      break;
    case 'close-menu':
      closeSidebar();
      break;
    case 'open-item':
      openItemModal(actionElement.dataset.itemId);
      break;
    case 'set-browse-type':
      state.browseType = actionElement.dataset.type;
      render();
      break;
    case 'browse-category':
      state.browseCategory = actionElement.dataset.category;
      state.route = 'browse';
      window.location.hash = '#browse';
      if (getRoute() === 'browse') render();
      break;
    case 'set-report-type':
      state.reportType = actionElement.dataset.type;
      updateReportTypeButtons();
      break;
    case 'remove-report-photo':
      clearReportPhoto();
      break;
    case 'set-report-filter':
      state.reportsFilter = actionElement.dataset.filter;
      render();
      break;
    case 'set-claim-filter':
      state.claimsFilter = actionElement.dataset.filter;
      render();
      break;
    case 'clear-filters':
      state.browseSearch = '';
      state.browseCategory = 'All items';
      state.browseType = 'ALL';
      render();
      break;
    case 'go-report':
      window.location.hash = '#report';
      break;
    case 'go-found':
      state.browseType = 'FOUND';
      state.browseCategory = 'All items';
      state.browseSearch = '';
      window.location.hash = '#browse';
      if (getRoute() === 'browse') render();
      break;
    case 'toggle-notifications':
      notificationPopover.hidden = !notificationPopover.hidden;
      notificationToggle.setAttribute('aria-expanded', String(!notificationPopover.hidden));
      if (!notificationPopover.hidden) notificationPopover.querySelector('button')?.focus();
      break;
    case 'mark-notification':
      try {
        await StudentService.markNotificationRead(actionElement.dataset.notificationId);
        renderNotificationPopover();
      } catch (error) { showToast(error.message, 'error'); }
      break;
    case 'mark-all-read':
      try {
        await StudentService.markAllNotificationsRead();
        renderNotificationPopover();
      } catch (error) { showToast(error.message, 'error'); }
      break;
    case 'submit-claim': {
      const details = window.prompt('Describe a detail that proves this item belongs to you:');
      if (!details?.trim()) break;
      closeModal();
      try {
        await StudentService.submitClaim(actionElement.dataset.itemId, details.trim());
        await StudentService.load('browse');
        render();
        showToast('Your claim was sent to the campus review team.', 'success');
      } catch (error) { showToast(error.message, 'error'); }
      break;
    }
    case 'review-claim':
      if (!window.confirm(`Are you sure you want to ${actionElement.dataset.decision.toLowerCase()} this claim?`)) break;
      try {
        await StudentService.reviewClaim(actionElement.dataset.claimId, actionElement.dataset.decision);
        await StudentService.load('admin');
        render();
        showToast('Claim review saved.', 'success');
      } catch (error) { showToast(error.message, 'error'); }
      break;
    case 'mark-report-resolved': {
      const report = StudentService.getMyReports().find((item) => item.id === actionElement.dataset.itemId);
      if (!report || !window.confirm(`Mark “${report.itemName}” as resolved? Any pending claims will be closed.`)) break;
      try {
        await StudentService.markReportResolved(report.id);
        render();
        showToast('Report marked as resolved.', 'success');
      } catch (error) { showToast(error.message, 'error'); }
      break;
    }
    case 'delete-report': {
      const report = StudentService.getMyReports().find((item) => item.id === actionElement.dataset.itemId);
      if (!report || !window.confirm(`Delete “${report.itemName}”? It will be removed from your reports, and any pending claims will be closed.`)) break;
      try {
        await StudentService.deleteReport(report.id);
        render();
        showToast('Report deleted.', 'success');
      } catch (error) { showToast(error.message, 'error'); }
      break;
    }
    case 'switch-auth':
      state.authMode = state.authMode === 'login' ? 'register' : 'login';
      renderAuth();
      break;
    case 'logout':
      try {
        await StudentService.logout();
        clearReportPhoto();
        state.authMode = 'login';
        renderAuth('You have signed out.');
      } catch (error) { showToast(error.message, 'error'); }
      break;
    case 'close-modal':
      closeModal();
      break;
    case 'backdrop-close':
      if (event.target === actionElement) closeModal();
      break;
    case 'dismiss-toast':
      actionElement.closest('.student-toast')?.remove();
      break;
  }
}

function handleGlobalSearch(event) {
  event.preventDefault();
  const input = document.querySelector('#global-search-input');
  state.browseSearch = input.value.trim();
  state.browseCategory = 'All items';
  state.browseType = 'ALL';
  if (getRoute() === 'browse') render();
  else window.location.hash = '#browse';
}

async function handleReportSubmit(event) {
  if (event.target.id !== 'report-form') return;
  event.preventDefault();
  if (!event.target.reportValidity()) return;

  const formData = new FormData(event.target);
  const category = String(formData.get('category') || 'Other Items');
  const submitButton = event.target.querySelector('[type="submit"]');
  if (state.uploadingReport) return;
  state.uploadingReport = true;
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = state.reportPhotoUrl ? 'Saving report…' : (state.reportPhoto ? 'Uploading photo…' : 'Saving report…');
  }
  try {
    if (state.reportPhoto && !state.reportPhotoUrl) {
      const uploadedPhoto = await StudentService.uploadReportPhoto(state.reportPhoto);
      state.reportPhotoUrl = uploadedPhoto.url;
      if (submitButton) submitButton.textContent = 'Saving report…';
    }
    const report = await StudentService.addReport({
      itemName: String(formData.get('itemName') || '').trim(),
      category,
      reportType: state.reportType,
      description: String(formData.get('description') || '').trim(),
      location: String(formData.get('location') || ''),
      dateReported: String(formData.get('dateReported') || new Date().toISOString().slice(0, 10)),
      contactMethod: String(formData.get('contactMethod') || 'EMAIL'),
      contactValue: String(formData.get('contactValue') || '').trim(),
      imageUrl: state.reportPhotoUrl
    });
    clearReportPhoto();
    window.location.hash = '#reports';
    window.setTimeout(() => showToast(`“${report.itemName}” was added to your reports.`, 'success'), 0);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    state.uploadingReport = false;
    if (submitButton?.isConnected) {
      submitButton.disabled = false;
      submitButton.innerHTML = `Submit report ${icon('arrow-right', 17)}`;
    }
  }
}

const reportImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxReportPhotoSize = 4 * 1024 * 1024;

function handleReportPhotoChange(event) {
  if (event.target.id !== 'report-photo-input') return;
  const input = event.target;
  const file = input.files?.[0];
  if (!file) return;

  const errorElement = document.querySelector('#report-photo-error');
  if (!reportImageTypes.has(file.type)) {
    input.value = '';
    if (errorElement) {
      errorElement.textContent = 'Choose a JPEG, PNG, or WebP image.';
      errorElement.hidden = false;
    }
    return;
  }
  if (file.size > maxReportPhotoSize) {
    input.value = '';
    if (errorElement) {
      errorElement.textContent = 'Choose an image up to 4 MB.';
      errorElement.hidden = false;
    }
    return;
  }

  releaseReportPhotoPreview();
  state.reportPhoto = file;
  state.reportPhotoPreview = ImageUtil.createPreviewUrl(file);
  state.reportPhotoUrl = '';
  if (errorElement) errorElement.hidden = true;
  const label = document.querySelector('#report-photo-label');
  if (label) label.textContent = file.name;
  const hint = document.querySelector('#report-photo-hint');
  if (hint) hint.textContent = `${(file.size / (1024 * 1024)).toFixed(1)} MB · Shown with your report`;
  const preview = document.querySelector('#report-photo-preview');
  if (preview) {
    preview.innerHTML = `<img src="${h(state.reportPhotoPreview)}" alt="Selected item photo preview"><button class="remove-preview" type="button" data-action="remove-report-photo" aria-label="Remove selected photo">${icon('close', 15)}</button>`;
    preview.hidden = false;
  }
}

function releaseReportPhotoPreview() {
  ImageUtil.revokePreviewUrl(state.reportPhotoPreview);
  state.reportPhotoPreview = '';
}

function clearReportPhoto() {
  releaseReportPhotoPreview();
  state.reportPhoto = null;
  state.reportPhotoUrl = '';
  const input = document.querySelector('#report-photo-input');
  if (input) input.value = '';
  const label = document.querySelector('#report-photo-label');
  if (label) label.textContent = 'Add a photo of the item';
  const hint = document.querySelector('#report-photo-hint');
  if (hint) hint.textContent = 'JPEG, PNG, or WebP, up to 4 MB. Shown with your report.';
  const error = document.querySelector('#report-photo-error');
  if (error) error.hidden = true;
  const preview = document.querySelector('#report-photo-preview');
  if (preview) {
    preview.innerHTML = '';
    preview.hidden = true;
  }
}

async function handleAuthSubmit(event) {
  if (event.target.id !== 'auth-form') return;
  event.preventDefault();
  if (!event.target.reportValidity()) return;

  const formData = new FormData(event.target);
  const password = String(formData.get('password') || '');
  const registering = state.authMode === 'register';
  if (registering && password !== String(formData.get('confirmPassword') || '')) {
    renderAuth('The passwords do not match.');
    return;
  }

  try {
    await ApiService.prepareSession();
    if (registering) {
      await StudentService.register({
        fullName: String(formData.get('fullName') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        password
      });
    } else {
      await StudentService.login({ email: String(formData.get('email') || '').trim(), password });
    }
    const user = StudentService.getUser();
    window.location.hash = user.role === 'ADMIN' ? '#admin' : '#home';
    await loadRoute();
  } catch (error) {
    renderAuth(error.message);
  }
}

function handleSearchInput(event) {
  if (event.target.id !== 'browse-search') return;
  state.browseSearch = event.target.value;
  updateBrowseResults();
}

function handleCategoryChange(event) {
  if (event.target.id !== 'browse-category') return;
  state.browseCategory = event.target.value;
  updateBrowseResults();
}

function handleKeydown(event) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    document.querySelector('#global-search-input')?.focus();
  }
  if (event.key === 'Escape') {
    if (state.activeModalItem) closeModal();
    notificationPopover.hidden = true;
    notificationToggle.setAttribute('aria-expanded', 'false');
    closeSidebar();
  }
  if (event.key === 'Tab' && state.activeModalItem) {
    const focusable = [...modalRoot.querySelectorAll('button:not([disabled]), a[href]')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

document.addEventListener('click', handleClick);
document.addEventListener('submit', (event) => {
  if (event.target.id === 'report-form') void handleReportSubmit(event);
  if (event.target.id === 'auth-form') void handleAuthSubmit(event);
});
document.addEventListener('input', handleSearchInput);
document.addEventListener('change', (event) => {
  handleCategoryChange(event);
  handleReportPhotoChange(event);
  if (event.target.id === 'report-contact-method') updateReportContactField();
});
document.addEventListener('keydown', handleKeydown);
window.addEventListener('hashchange', () => void loadRoute());
document.addEventListener('click', (event) => {
  if (!event.target.closest('.student-notification-wrap')) {
    notificationPopover.hidden = true;
    notificationToggle.setAttribute('aria-expanded', 'false');
  }
});

document.querySelector('#menu-toggle').addEventListener('click', openSidebar);
sidebarScrim.addEventListener('click', closeSidebar);
notificationToggle.addEventListener('click', () => {
  notificationPopover.hidden = !notificationPopover.hidden;
  notificationToggle.setAttribute('aria-expanded', String(!notificationPopover.hidden));
});
document.querySelector('#global-search').addEventListener('submit', handleGlobalSearch);
hydrateStaticIcons();
void startApp();
