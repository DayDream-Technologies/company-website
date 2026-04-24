/**
 * Ada Events Calendar - Main Application
 *
 * Structurally identical to src/js/gr-events/app.js; differs only in the data
 * file path and the localStorage keys so the Ada page keeps its own cache and
 * user preferences separate from the GR page.
 */

(function() {
  'use strict';

  const {
    SOURCE_CONFIG,
    getAllSourceIds,
    initListView,
    initCalendarView,
    initMapView,
    destroyCalendarView,
    destroyMapView,
  } = window.GREvents;

  const { formatRelativeTime } = window.GREvents.DateUtils;

  const DATA_URL = 'src/data/ada-events.json';
  const CACHE_KEY = 'ada-events-cache';
  const PREFS_KEY = 'ada-events-prefs';

  const state = {
    events: [],
    sources: null,
    lastScraped: null,
    activeView: 'list',
    isLoading: true,
    hideRecurring: false,
    showFreeOnly: false,
  };

  const elements = {
    viewTabs: document.getElementById('viewTabs'),
    statusBanner: document.getElementById('statusBanner'),
    eventCount: document.getElementById('eventCount'),
    lastUpdated: document.getElementById('lastUpdated'),
    sourceStats: document.getElementById('sourceStats'),
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    viewsContainer: document.getElementById('viewsContainer'),
    listView: document.getElementById('listView'),
    calendarView: document.getElementById('calendarView'),
    mapView: document.getElementById('mapView'),
    footerSources: document.getElementById('footerSources'),
    eventModal: document.getElementById('eventModal'),
    hideRecurringCheckbox: document.getElementById('hideRecurringCheckbox'),
    freeOnlyCheckbox: document.getElementById('freeOnlyCheckbox'),
  };

  function init() {
    loadPreferences();
    setupEventListeners();
    renderFooterSources();
    loadEvents();
  }

  function loadPreferences() {
    try {
      const prefs = localStorage.getItem(PREFS_KEY);
      if (prefs) {
        const parsed = JSON.parse(prefs);
        state.hideRecurring = parsed.hideRecurring || false;
        state.showFreeOnly = parsed.showFreeOnly || false;
      }
    } catch (e) {
      console.warn('Failed to load preferences:', e);
    }

    if (elements.hideRecurringCheckbox) {
      elements.hideRecurringCheckbox.checked = state.hideRecurring;
    }
    if (elements.freeOnlyCheckbox) {
      elements.freeOnlyCheckbox.checked = state.showFreeOnly;
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({
        hideRecurring: state.hideRecurring,
        showFreeOnly: state.showFreeOnly,
      }));
    } catch (e) {
      console.warn('Failed to save preferences:', e);
    }
  }

  function setupEventListeners() {
    elements.viewTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.view-tab');
      if (tab) {
        const view = tab.dataset.view;
        switchView(view);
      }
    });

    elements.eventModal.querySelector('.modal-backdrop')?.addEventListener('click', () => {
      elements.eventModal.classList.add('hidden');
    });

    if (elements.hideRecurringCheckbox) {
      elements.hideRecurringCheckbox.addEventListener('change', (e) => {
        state.hideRecurring = e.target.checked;
        savePreferences();
        updateUI();
      });
    }

    if (elements.freeOnlyCheckbox) {
      elements.freeOnlyCheckbox.addEventListener('change', (e) => {
        state.showFreeOnly = e.target.checked;
        savePreferences();
        updateUI();
      });
    }
  }

  function getFilteredEvents() {
    let events = state.events;

    if (state.hideRecurring) {
      events = events.filter(event => !event.isRecurring);
    }

    if (state.showFreeOnly) {
      events = events.filter(event => event.isFree !== false);
    }

    return events;
  }

  async function loadEvents() {
    showLoading();

    let cachedData = null;
    let cachedLastScraped = null;
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        cachedData = parsed.data;
        cachedLastScraped = cachedData?.lastScraped;
      }
    } catch (e) {
      console.warn('Cache read failed:', e);
    }

    try {
      const response = await fetch(DATA_URL, { cache: 'no-cache' });

      if (!response.ok) {
        throw new Error('Events data not found');
      }

      const serverData = await response.json();
      const serverLastScraped = serverData.lastScraped;

      const serverDate = new Date(serverLastScraped).getTime();
      const cachedDate = cachedLastScraped ? new Date(cachedLastScraped).getTime() : 0;

      if (cachedData && serverDate <= cachedDate) {
        state.events = cachedData.events || [];
        state.lastScraped = cachedData.lastScraped;
        state.sources = cachedData.sources || {};
        state.isLoading = false;

        updateUI();
        showStatus('success', `Loaded ${state.events.length} events (cached)`);
        setTimeout(() => hideStatus(), 3000);
        return;
      }

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: serverData,
          cachedAt: Date.now(),
        }));
      } catch (e) {
        console.warn('Cache write failed:', e);
      }

      state.events = serverData.events || [];
      state.lastScraped = serverData.lastScraped;
      state.sources = serverData.sources || {};
      state.isLoading = false;

      updateUI();
      showStatus('success', `Loaded ${state.events.length} events`);

      setTimeout(() => hideStatus(), 3000);

    } catch (error) {
      console.error('Failed to load events:', error);

      if (cachedData) {
        state.events = cachedData.events || [];
        state.lastScraped = cachedData.lastScraped;
        state.sources = cachedData.sources || {};
        state.isLoading = false;

        updateUI();
        showStatus('warning', `Loaded ${state.events.length} events (offline cache)`);
        setTimeout(() => hideStatus(), 5000);
        return;
      }

      state.isLoading = false;
      state.events = [];

      updateUI();
      showStatus('error', 'No events data found. Run the scrape:ada script to generate data.');
    }
  }

  function updateUI() {
    const filteredEvents = getFilteredEvents();

    const isFiltered = state.hideRecurring || state.showFreeOnly;
    if (isFiltered && filteredEvents.length !== state.events.length) {
      elements.eventCount.textContent = `${filteredEvents.length} of ${state.events.length} events`;
    } else {
      elements.eventCount.textContent = `${state.events.length} events`;
    }
    elements.lastUpdated.textContent = `Updated ${formatRelativeTime(state.lastScraped)}`;

    renderSourceStats();

    if (state.isLoading) {
      showLoading();
    } else if (filteredEvents.length === 0) {
      showEmpty();
    } else {
      showContent();
      renderActiveView();
    }
  }

  function renderSourceStats() {
    if (!state.sources) {
      elements.sourceStats.innerHTML = '';
      return;
    }

    elements.sourceStats.innerHTML = Object.values(state.sources).map(source => `
      <div class="source-stat">
        <div class="source-dot" style="background-color: ${source.color};"></div>
        <span class="source-stat-text">
          ${source.name}: <span class="source-stat-count">${source.eventCount}</span>
        </span>
      </div>
    `).join('');
  }

  function renderFooterSources() {
    const sourceLinks = getAllSourceIds().map((sourceId, i, arr) => {
      const source = SOURCE_CONFIG[sourceId];
      return `<a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.name}</a>${i < arr.length - 1 ? ', ' : ''}`;
    }).join('');

    elements.footerSources.innerHTML = `<span>Aggregating events from </span>${sourceLinks}`;
  }

  function switchView(view) {
    if (view === state.activeView) return;

    if (state.activeView === 'calendar') {
      destroyCalendarView();
    } else if (state.activeView === 'map') {
      destroyMapView();
    }

    state.activeView = view;

    elements.viewTabs.querySelectorAll('.view-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.view === view);
    });

    elements.listView.classList.add('hidden');
    elements.calendarView.classList.add('hidden');
    elements.mapView.classList.add('hidden');

    if (view === 'list') {
      elements.listView.classList.remove('hidden');
    } else if (view === 'calendar') {
      elements.calendarView.classList.remove('hidden');
    } else if (view === 'map') {
      elements.mapView.classList.remove('hidden');
    }

    renderActiveView();
  }

  function renderActiveView() {
    const filteredEvents = getFilteredEvents();
    if (filteredEvents.length === 0) return;

    switch (state.activeView) {
      case 'list':
        initListView(elements.listView, filteredEvents);
        break;
      case 'calendar':
        initCalendarView(elements.calendarView, filteredEvents);
        break;
      case 'map':
        initMapView(elements.mapView, filteredEvents);
        break;
    }
  }

  function showLoading() {
    elements.loadingState.classList.remove('hidden');
    elements.emptyState.classList.add('hidden');
    elements.viewsContainer.classList.add('hidden');
  }

  function showEmpty() {
    elements.loadingState.classList.add('hidden');
    elements.emptyState.classList.remove('hidden');
    elements.viewsContainer.classList.add('hidden');
  }

  function showContent() {
    elements.loadingState.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
    elements.viewsContainer.classList.remove('hidden');
  }

  function showStatus(type, message) {
    elements.statusBanner.textContent = message;
    elements.statusBanner.className = `status-banner ${type}`;
    elements.statusBanner.classList.remove('hidden');
  }

  function hideStatus() {
    elements.statusBanner.classList.add('hidden');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
