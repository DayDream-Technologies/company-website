/**
 * GR Events Calendar - Main Application
 * Static JavaScript version
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
  
  // Application state
  const state = {
    events: [],
    sources: null,
    lastScraped: null,
    activeView: 'list',
    isLoading: true,
    hideRecurring: false,
    showFreeOnly: false,
  };
  
  // DOM Elements
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
  
  // Preferences key for localStorage
  const PREFS_KEY = 'gr-events-prefs';
  
  /**
   * Initialize the application
   */
  function init() {
    loadPreferences();
    setupEventListeners();
    renderFooterSources();
    loadEvents();
  }
  
  /**
   * Load user preferences from localStorage
   */
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
    
    // Sync checkbox states with loaded preferences
    if (elements.hideRecurringCheckbox) {
      elements.hideRecurringCheckbox.checked = state.hideRecurring;
    }
    if (elements.freeOnlyCheckbox) {
      elements.freeOnlyCheckbox.checked = state.showFreeOnly;
    }
  }
  
  /**
   * Save user preferences to localStorage
   */
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
  
  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    // View tab clicks
    elements.viewTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.view-tab');
      if (tab) {
        const view = tab.dataset.view;
        switchView(view);
      }
    });
    
    // Modal backdrop click to close
    elements.eventModal.querySelector('.modal-backdrop')?.addEventListener('click', () => {
      elements.eventModal.classList.add('hidden');
    });
    
    // Hide recurring events checkbox
    if (elements.hideRecurringCheckbox) {
      elements.hideRecurringCheckbox.addEventListener('change', (e) => {
        state.hideRecurring = e.target.checked;
        savePreferences();
        updateUI();
      });
    }
    
    // Free events only checkbox
    if (elements.freeOnlyCheckbox) {
      elements.freeOnlyCheckbox.addEventListener('change', (e) => {
        state.showFreeOnly = e.target.checked;
        savePreferences();
        updateUI();
      });
    }
  }
  
  /**
   * Get filtered events based on current filter settings
   */
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
  
  // Cache key for localStorage
  const CACHE_KEY = 'gr-events-cache';
  
  /**
   * Load events - always checks server for fresh data
   * Compares server's lastScraped with cached lastScraped to determine if cache is valid
   */
  async function loadEvents() {
    showLoading();
    
    // Get cached data if available
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
    
    // Always fetch from server to check for updates
    try {
      const response = await fetch('src/data/events.json', {
        // Add cache-busting to ensure we get the latest file
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        throw new Error('Events data not found');
      }
      
      const serverData = await response.json();
      const serverLastScraped = serverData.lastScraped;
      
      // Compare server data with cached data
      const serverDate = new Date(serverLastScraped).getTime();
      const cachedDate = cachedLastScraped ? new Date(cachedLastScraped).getTime() : 0;
      
      if (cachedData && serverDate <= cachedDate) {
        // Cache is still valid - server hasn't updated
        state.events = cachedData.events || [];
        state.lastScraped = cachedData.lastScraped;
        state.sources = cachedData.sources || {};
        state.isLoading = false;
        
        updateUI();
        showStatus('success', `Loaded ${state.events.length} events (cached)`);
        setTimeout(() => hideStatus(), 3000);
        return;
      }
      
      // Server has newer data - update cache
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
      
      // Auto-hide status after 3 seconds
      setTimeout(() => hideStatus(), 3000);
      
    } catch (error) {
      console.error('Failed to load events:', error);
      
      // If fetch failed but we have cached data, use it
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
      
      // Show empty state with instructions
      updateUI();
      showStatus('error', 'No events data found. Run the scrape script to generate data.');
    }
  }
  
  /**
   * Update the UI based on current state
   */
  function updateUI() {
    const filteredEvents = getFilteredEvents();
    
    // Update stats - show filtered count and total when any filter is active
    const isFiltered = state.hideRecurring || state.showFreeOnly;
    if (isFiltered && filteredEvents.length !== state.events.length) {
      elements.eventCount.textContent = `${filteredEvents.length} of ${state.events.length} events`;
    } else {
      elements.eventCount.textContent = `${state.events.length} events`;
    }
    elements.lastUpdated.textContent = `Updated ${formatRelativeTime(state.lastScraped)}`;
    
    // Update source stats
    renderSourceStats();
    
    // Show appropriate state
    if (state.isLoading) {
      showLoading();
    } else if (filteredEvents.length === 0) {
      showEmpty();
    } else {
      showContent();
      renderActiveView();
    }
  }
  
  /**
   * Render source stats in the stats bar
   */
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
  
  /**
   * Render footer sources
   */
  function renderFooterSources() {
    const sourceLinks = getAllSourceIds().map((sourceId, i, arr) => {
      const source = SOURCE_CONFIG[sourceId];
      return `<a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.name}</a>${i < arr.length - 1 ? ', ' : ''}`;
    }).join('');
    
    // Additional resource links (not event sources)
    const resourceLinks = [
      { name: 'GR SmartZone', url: 'https://smartzonegr.com/' },
    ];
    
    const resourcesHtml = resourceLinks.length > 0 
      ? ` <span class="footer-divider">|</span> <span>Resources: </span>${resourceLinks.map((r, i, arr) => 
          `<a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.name}</a>${i < arr.length - 1 ? ', ' : ''}`
        ).join('')}`
      : '';
    
    elements.footerSources.innerHTML = `<span>Aggregating events from </span>${sourceLinks}${resourcesHtml}`;
  }
  
  /**
   * Switch between views
   */
  function switchView(view) {
    if (view === state.activeView) return;
    
    // Clean up previous view
    if (state.activeView === 'calendar') {
      destroyCalendarView();
    } else if (state.activeView === 'map') {
      destroyMapView();
    }
    
    state.activeView = view;
    
    // Update tab styles
    elements.viewTabs.querySelectorAll('.view-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.view === view);
    });
    
    // Hide all views
    elements.listView.classList.add('hidden');
    elements.calendarView.classList.add('hidden');
    elements.mapView.classList.add('hidden');
    
    // Show active view
    if (view === 'list') {
      elements.listView.classList.remove('hidden');
    } else if (view === 'calendar') {
      elements.calendarView.classList.remove('hidden');
    } else if (view === 'map') {
      elements.mapView.classList.remove('hidden');
    }
    
    // Render the view
    renderActiveView();
  }
  
  /**
   * Render the currently active view
   */
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
  
  /**
   * Show loading state
   */
  function showLoading() {
    elements.loadingState.classList.remove('hidden');
    elements.emptyState.classList.add('hidden');
    elements.viewsContainer.classList.add('hidden');
  }
  
  /**
   * Show empty state
   */
  function showEmpty() {
    elements.loadingState.classList.add('hidden');
    elements.emptyState.classList.remove('hidden');
    elements.viewsContainer.classList.add('hidden');
  }
  
  /**
   * Show content
   */
  function showContent() {
    elements.loadingState.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
    elements.viewsContainer.classList.remove('hidden');
  }
  
  /**
   * Show status banner
   */
  function showStatus(type, message) {
    elements.statusBanner.textContent = message;
    elements.statusBanner.className = `status-banner ${type}`;
    elements.statusBanner.classList.remove('hidden');
  }
  
  /**
   * Hide status banner
   */
  function hideStatus() {
    elements.statusBanner.classList.add('hidden');
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
