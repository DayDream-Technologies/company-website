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
  };
  
  // DOM Elements
  const elements = {
    viewTabs: document.getElementById('viewTabs'),
    refreshBtn: document.getElementById('refreshBtn'),
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
  };
  
  /**
   * Initialize the application
   */
  function init() {
    setupEventListeners();
    renderFooterSources();
    loadEvents();
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
    
    // Refresh button
    elements.refreshBtn.addEventListener('click', loadEvents);
    
    // Modal backdrop click to close
    elements.eventModal.querySelector('.modal-backdrop')?.addEventListener('click', () => {
      elements.eventModal.classList.add('hidden');
    });
  }
  
  /**
   * Load events from data file
   */
  async function loadEvents() {
    showLoading();
    
    try {
      // Updated path to new location
      const response = await fetch('src/data/events.json');
      
      if (!response.ok) {
        throw new Error('Events data not found');
      }
      
      const data = await response.json();
      
      state.events = data.events || [];
      state.lastScraped = data.lastScraped;
      state.sources = data.sources || {};
      state.isLoading = false;
      
      updateUI();
      showStatus('success', `Loaded ${state.events.length} events`);
      
      // Auto-hide status after 3 seconds
      setTimeout(() => hideStatus(), 3000);
      
    } catch (error) {
      console.error('Failed to load events:', error);
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
    // Update stats
    elements.eventCount.textContent = `${state.events.length} events`;
    elements.lastUpdated.textContent = `Updated ${formatRelativeTime(state.lastScraped)}`;
    
    // Update source stats
    renderSourceStats();
    
    // Show appropriate state
    if (state.isLoading) {
      showLoading();
    } else if (state.events.length === 0) {
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
    
    elements.footerSources.innerHTML = `<span>Aggregating events from </span>${sourceLinks}`;
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
    if (state.events.length === 0) return;
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/57d3c4f2-eb6c-4edd-957c-6cde40b0a5e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:renderActiveView',message:'About to render view',data:{activeView:state.activeView,hasInitListView:typeof initListView,hasInitCalendarView:typeof initCalendarView,hasInitMapView:typeof initMapView},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    switch (state.activeView) {
      case 'list':
        initListView(elements.listView, state.events);
        break;
      case 'calendar':
        initCalendarView(elements.calendarView, state.events);
        break;
      case 'map':
        initMapView(elements.mapView, state.events);
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
    elements.refreshBtn.classList.add('loading');
    elements.refreshBtn.disabled = true;
  }
  
  /**
   * Show empty state
   */
  function showEmpty() {
    elements.loadingState.classList.add('hidden');
    elements.emptyState.classList.remove('hidden');
    elements.viewsContainer.classList.add('hidden');
    elements.refreshBtn.classList.remove('loading');
    elements.refreshBtn.disabled = false;
  }
  
  /**
   * Show content
   */
  function showContent() {
    elements.loadingState.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
    elements.viewsContainer.classList.remove('hidden');
    elements.refreshBtn.classList.remove('loading');
    elements.refreshBtn.disabled = false;
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
