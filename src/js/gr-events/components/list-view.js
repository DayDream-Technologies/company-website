/**
 * GR Events Calendar - List View Component
 */

(function() {
  'use strict';
  
  const { SOURCE_CONFIG, getAllSourceIds } = window.GREvents;
  const { formatLongDate, isPast } = window.GREvents.DateUtils;
  const { downloadICS, getGoogleCalendarUrl } = window.GREvents.ICSExport;
  const { createEventCard, escapeHtml } = window.GREvents;

/**
 * Initialize list view
 */
function initListView(container, events) {
  // State
  const state = {
    searchQuery: '',
    selectedSources: [],
    selectedCategories: [],
    sortBy: 'date-asc',
    showPastEvents: false,
    isSelectionMode: false,
    selectedEvents: new Set(),
  };
  
  // Get unique categories from events
  const categories = [...new Set(events.filter(e => e.category).map(e => e.category))];
  
  // Render the view
  render();
  
  /**
   * Render the list view
   */
  function render() {
    const filteredEvents = getFilteredEvents();
    const groupedEvents = groupEventsByDate(filteredEvents);
    
    container.innerHTML = `
      <div class="list-view">
        ${state.isSelectionMode ? renderSelectionToolbar(filteredEvents) : ''}
        
        <!-- Filters -->
        <div class="list-filters">
          <!-- Search bar -->
          <div class="search-row">
            <div class="search-input-wrapper">
              <svg class="icon-sm search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search events..."
                value="${escapeHtml(state.searchQuery)}"
                class="search-input"
                id="searchInput"
              />
            </div>
            ${!state.isSelectionMode ? `
              <button class="select-btn" id="selectModeBtn" title="Select events to export">
                <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span class="btn-label">Select</span>
              </button>
            ` : ''}
          </div>
          
          <!-- Filter chips -->
          <div class="filter-chips">
            ${getAllSourceIds().map(sourceId => {
              const source = SOURCE_CONFIG[sourceId];
              const isActive = state.selectedSources.includes(sourceId);
              return `
                <button
                  class="filter-chip ${isActive ? 'active' : ''}"
                  data-source="${sourceId}"
                  ${isActive ? `style="background-color: ${source.color}; border-color: transparent;"` : ''}
                >
                  ${source.name}
                </button>
              `;
            }).join('')}
            
            ${categories.length > 0 ? `
              <div class="filter-divider"></div>
              ${categories.map(category => {
                const isActive = state.selectedCategories.includes(category);
                return `
                  <button
                    class="filter-chip ${isActive ? 'active' : ''}"
                    data-category="${category}"
                    ${isActive ? 'style="background-color: var(--gr-secondary); border-color: transparent;"' : ''}
                  >
                    ${category}
                  </button>
                `;
              }).join('')}
            ` : ''}
          </div>
          
          <!-- Sort and options -->
          <div class="filter-options">
            <div class="filter-options-left">
              <select class="sort-select" id="sortSelect">
                <option value="date-asc" ${state.sortBy === 'date-asc' ? 'selected' : ''}>Date (Soonest First)</option>
                <option value="date-desc" ${state.sortBy === 'date-desc' ? 'selected' : ''}>Date (Latest First)</option>
                <option value="title" ${state.sortBy === 'title' ? 'selected' : ''}>Title (A-Z)</option>
              </select>
              
              <label class="checkbox-label">
                <input type="checkbox" id="showPastCheckbox" ${state.showPastEvents ? 'checked' : ''}>
                Show past events
              </label>
            </div>
            
            ${hasActiveFilters() ? `
              <button class="clear-filters-btn" id="clearFiltersBtn">Clear filters</button>
            ` : ''}
          </div>
        </div>
        
        <!-- Results count -->
        <div class="results-count">
          Showing ${filteredEvents.length} of ${events.length} events
          ${state.isSelectionMode && state.selectedEvents.size > 0 ? `
            <span class="selection-info">• ${state.selectedEvents.size} selected for export</span>
          ` : ''}
        </div>
        
        <!-- Events list -->
        ${filteredEvents.length === 0 ? renderNoResults() : renderEventGroups(groupedEvents, filteredEvents)}
      </div>
    `;
    
    // Attach event listeners
    attachListeners(filteredEvents);
  }
  
  /**
   * Render selection toolbar
   */
  function renderSelectionToolbar(filteredEvents) {
    const allSelected = state.selectedEvents.size === filteredEvents.length && filteredEvents.length > 0;
    
    return `
      <div class="selection-toolbar">
        <div class="selection-checkbox">
          <input type="checkbox" id="selectAllCheckbox" ${allSelected ? 'checked' : ''}>
          <span class="selection-count">${state.selectedEvents.size} selected</span>
        </div>
        
        <div class="flex-spacer"></div>
        
        <div class="selection-actions">
          ${state.selectedEvents.size > 0 ? `
            <div style="position: relative;">
              <button class="export-btn" id="exportBtn">
                <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Add to Calendar
                <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div class="export-menu hidden" id="exportMenu">
                <button class="export-option" data-export="ics">
                  <svg class="icon-sm text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <div>
                    <div class="export-title">Download .ics</div>
                    <div class="export-subtitle">For Apple Calendar, Outlook</div>
                  </div>
                </button>
                <button class="export-option" data-export="google">
                  <svg class="icon-sm text-secondary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.5 22h-15A2.5 2.5 0 012 19.5v-15A2.5 2.5 0 014.5 2h15A2.5 2.5 0 0122 4.5v15a2.5 2.5 0 01-2.5 2.5zM9 18h6v-2H9v2zm0-4h6v-2H9v2zm0-4h6V8H9v2z"/>
                  </svg>
                  <div>
                    <div class="export-title">Google Calendar</div>
                    <div class="export-subtitle">${state.selectedEvents.size > 1 ? 'Opens first event' : 'Add to Google Calendar'}</div>
                  </div>
                </button>
              </div>
            </div>
          ` : ''}
          
          <button class="cancel-btn" id="cancelSelectBtn">Cancel</button>
        </div>
      </div>
    `;
  }
  
  /**
   * Render no results state
   */
  function renderNoResults() {
    return `
      <div class="no-results">
        <svg class="no-results-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 class="no-results-title">No events found</h3>
        <p class="no-results-text">Try adjusting your filters or search query</p>
      </div>
    `;
  }
  
  /**
   * Render event groups by date
   */
  function renderEventGroups(groupedEvents, filteredEvents) {
    const eventCardsContainer = document.createElement('div');
    eventCardsContainer.className = 'event-groups';
    
    let html = '<div class="event-groups">';
    
    Object.entries(groupedEvents).forEach(([date, dateEvents]) => {
      html += `
        <div class="date-group">
          <h3 class="date-group-header">${formatLongDate(date)}</h3>
          <div class="date-group-events" data-date="${date}"></div>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }
  
  /**
   * Filter and sort events
   */
  function getFilteredEvents() {
    return events
      .filter(event => {
        // Search filter
        if (state.searchQuery) {
          const search = state.searchQuery.toLowerCase();
          const matchesSearch = 
            event.title.toLowerCase().includes(search) ||
            event.description.toLowerCase().includes(search) ||
            event.location.name.toLowerCase().includes(search) ||
            event.location.city.toLowerCase().includes(search);
          if (!matchesSearch) return false;
        }
        
        // Source filter
        if (state.selectedSources.length > 0 && !state.selectedSources.includes(event.source)) {
          return false;
        }
        
        // Category filter
        if (state.selectedCategories.length > 0 && (!event.category || !state.selectedCategories.includes(event.category))) {
          return false;
        }
        
        // Past events filter
        if (!state.showPastEvents && isPast(event.date)) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        if (state.sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        
        const dateA = new Date(a.startDateTime);
        const dateB = new Date(b.startDateTime);
        
        return state.sortBy === 'date-asc' 
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      });
  }
  
  /**
   * Group events by date
   */
  function groupEventsByDate(filteredEvents) {
    const groups = {};
    
    filteredEvents.forEach(event => {
      const date = event.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
    });
    
    return groups;
  }
  
  /**
   * Check if any filters are active
   */
  function hasActiveFilters() {
    return state.searchQuery || state.selectedSources.length > 0 || state.selectedCategories.length > 0;
  }
  
  /**
   * Attach event listeners
   */
  function attachListeners(filteredEvents) {
    // Search input
    const searchInput = container.querySelector('#searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        render();
      });
    }
    
    // Select mode button
    const selectModeBtn = container.querySelector('#selectModeBtn');
    if (selectModeBtn) {
      selectModeBtn.addEventListener('click', () => {
        state.isSelectionMode = true;
        render();
      });
    }
    
    // Cancel select button
    const cancelSelectBtn = container.querySelector('#cancelSelectBtn');
    if (cancelSelectBtn) {
      cancelSelectBtn.addEventListener('click', () => {
        state.isSelectionMode = false;
        state.selectedEvents = new Set();
        render();
      });
    }
    
    // Select all checkbox
    const selectAllCheckbox = container.querySelector('#selectAllCheckbox');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          state.selectedEvents = new Set(filteredEvents.map(e => e.id));
        } else {
          state.selectedEvents = new Set();
        }
        render();
      });
    }
    
    // Export button and menu
    const exportBtn = container.querySelector('#exportBtn');
    const exportMenu = container.querySelector('#exportMenu');
    if (exportBtn && exportMenu) {
      exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        exportMenu.classList.toggle('hidden');
      });
      
      exportMenu.querySelectorAll('.export-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const type = btn.dataset.export;
          const selectedEventsList = filteredEvents.filter(e => state.selectedEvents.has(e.id));
          
          if (type === 'ics') {
            const filename = selectedEventsList.length === 1
              ? `${selectedEventsList[0].title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`
              : `gr-events-${selectedEventsList.length}-events.ics`;
            downloadICS(selectedEventsList, filename);
          } else if (type === 'google') {
            window.open(getGoogleCalendarUrl(selectedEventsList[0]), '_blank');
          }
          
          exportMenu.classList.add('hidden');
        });
      });
      
      // Close menu on outside click
      document.addEventListener('click', (e) => {
        if (!exportBtn.contains(e.target) && !exportMenu.contains(e.target)) {
          exportMenu.classList.add('hidden');
        }
      });
    }
    
    // Source filter chips
    container.querySelectorAll('[data-source]').forEach(chip => {
      chip.addEventListener('click', () => {
        const source = chip.dataset.source;
        const index = state.selectedSources.indexOf(source);
        if (index > -1) {
          state.selectedSources.splice(index, 1);
        } else {
          state.selectedSources.push(source);
        }
        render();
      });
    });
    
    // Category filter chips
    container.querySelectorAll('[data-category]').forEach(chip => {
      chip.addEventListener('click', () => {
        const category = chip.dataset.category;
        const index = state.selectedCategories.indexOf(category);
        if (index > -1) {
          state.selectedCategories.splice(index, 1);
        } else {
          state.selectedCategories.push(category);
        }
        render();
      });
    });
    
    // Sort select
    const sortSelect = container.querySelector('#sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        render();
      });
    }
    
    // Show past events checkbox
    const showPastCheckbox = container.querySelector('#showPastCheckbox');
    if (showPastCheckbox) {
      showPastCheckbox.addEventListener('change', (e) => {
        state.showPastEvents = e.target.checked;
        render();
      });
    }
    
    // Clear filters button
    const clearFiltersBtn = container.querySelector('#clearFiltersBtn');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        state.searchQuery = '';
        state.selectedSources = [];
        state.selectedCategories = [];
        render();
      });
    }
    
    // Render event cards into date groups
    const groupedEvents = groupEventsByDate(filteredEvents);
    Object.entries(groupedEvents).forEach(([date, dateEvents]) => {
      const groupContainer = container.querySelector(`.date-group-events[data-date="${date}"]`);
      if (groupContainer) {
        dateEvents.forEach(event => {
          const card = createEventCard(event, {
            selectionMode: state.isSelectionMode,
            selected: state.selectedEvents.has(event.id),
            onSelect: (eventId) => {
              if (state.selectedEvents.has(eventId)) {
                state.selectedEvents.delete(eventId);
              } else {
                state.selectedEvents.add(eventId);
              }
              render();
            }
          });
          groupContainer.appendChild(card);
        });
      }
    });
  }
}

// Export for use in other modules
window.GREvents = window.GREvents || {};
window.GREvents.initListView = initListView;
// #region agent log
fetch('http://127.0.0.1:7245/ingest/57d3c4f2-eb6c-4edd-957c-6cde40b0a5e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'list-view.js:END',message:'List View module loaded',data:{hasInitListView:!!window.GREvents.initListView},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
// #endregion
})();
