/**
 * GR Events Calendar - Event Card Component
 */

(function() {
  'use strict';
  
  const { SOURCE_CONFIG } = window.GREvents;
  const { formatShortDate, getMonthAbbr, getDayOfMonth } = window.GREvents.DateUtils;
  const { downloadICS, getGoogleCalendarUrl } = window.GREvents.ICSExport;

/**
 * Create an event card element
 * @param {Object} event - Event data
 * @param {Object} options - Options
 * @param {boolean} options.compact - Use compact style
 * @param {boolean} options.selectionMode - Show selection checkbox
 * @param {boolean} options.selected - Is selected
 * @param {Function} options.onSelect - Selection callback
 * @returns {HTMLElement}
 */
function createEventCard(event, options = {}) {
  const { compact = false, selectionMode = false, selected = false, onSelect = null } = options;
  const sourceConfig = SOURCE_CONFIG[event.source] || {};
  
  const wrapper = document.createElement('div');
  wrapper.className = 'event-card';
  
  // Selection button (if in selection mode)
  if (selectionMode) {
    const selectBtn = document.createElement('div');
    selectBtn.className = 'event-select-btn';
    selectBtn.innerHTML = `
      <button class="${selected ? 'selected' : ''}" data-event-id="${event.id}">
        ${selected ? `
          <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        ` : `
          <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        `}
      </button>
    `;
    selectBtn.querySelector('button').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (onSelect) onSelect(event.id);
    });
    wrapper.appendChild(selectBtn);
  }
  
  // Card content wrapper
  const cardWrapper = document.createElement('div');
  if (selectionMode) cardWrapper.style.marginLeft = '2.5rem';
  
  if (compact) {
    cardWrapper.innerHTML = createCompactCard(event, sourceConfig);
  } else {
    cardWrapper.innerHTML = createFullCard(event, sourceConfig);
    
    // Add calendar menu functionality
    const calendarBtn = cardWrapper.querySelector('.event-calendar-btn');
    if (calendarBtn) {
      let menuOpen = false;
      let menuElement = null;
      
      calendarBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (menuOpen && menuElement) {
          menuElement.remove();
          menuElement = null;
          menuOpen = false;
          return;
        }
        
        // Create menu
        menuElement = document.createElement('div');
        menuElement.className = 'export-menu';
        menuElement.style.position = 'absolute';
        menuElement.style.right = '0';
        menuElement.style.top = '3rem';
        menuElement.innerHTML = `
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
              <div class="export-subtitle">Add to Google Calendar</div>
            </div>
          </button>
        `;
        
        // Position menu
        calendarBtn.parentElement.appendChild(menuElement);
        menuOpen = true;
        
        // Handle menu clicks
        menuElement.querySelectorAll('.export-option').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const type = btn.dataset.export;
            
            if (type === 'ics') {
              const filename = `${event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
              downloadICS([event], filename);
            } else if (type === 'google') {
              window.open(getGoogleCalendarUrl(event), '_blank');
            }
            
            menuElement.remove();
            menuElement = null;
            menuOpen = false;
          });
        });
        
        // Close on click outside
        setTimeout(() => {
          const closeHandler = (e) => {
            if (!menuElement.contains(e.target) && e.target !== calendarBtn) {
              menuElement.remove();
              menuElement = null;
              menuOpen = false;
              document.removeEventListener('click', closeHandler);
            }
          };
          document.addEventListener('click', closeHandler);
        }, 0);
      });
    }
  }
  
  wrapper.appendChild(cardWrapper);
  return wrapper;
}

/**
 * Create compact card HTML
 */
function createCompactCard(event, sourceConfig) {
  return `
    <a href="${event.url}" target="_blank" rel="noopener noreferrer" class="card card-link" style="padding: 0.75rem;">
      <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
        <div style="width: 2px; min-height: 40px; border-radius: 9999px; flex-shrink: 0; background-color: ${sourceConfig.color};"></div>
        <div style="flex: 1; min-width: 0;">
          <h4 class="event-title line-clamp-1" style="font-size: 0.875rem; margin-bottom: 0.25rem;">
            ${escapeHtml(event.title)}
          </h4>
          <p style="font-size: 0.75rem; color: var(--gr-text-muted);">
            ${formatShortDate(event.date)} • ${event.time}
          </p>
        </div>
      </div>
    </a>
  `;
}

/**
 * Create full card HTML
 */
function createFullCard(event, sourceConfig) {
  return `
    <a href="${event.url}" target="_blank" rel="noopener noreferrer" class="card card-link">
      <div class="event-card-inner">
        <!-- Date badge -->
        <div class="event-date-badge">
          <span class="event-date-month">${getMonthAbbr(event.date)}</span>
          <span class="event-date-day">${getDayOfMonth(event.date)}</span>
        </div>
        
        <!-- Content -->
        <div class="event-content">
          <!-- Badges -->
          <div class="event-badges">
            <span class="badge badge-source" style="background-color: ${sourceConfig.color}20; color: ${sourceConfig.color};">
              ${sourceConfig.name}
            </span>
            ${event.category ? `
              <span class="badge badge-category">${event.category}</span>
            ` : ''}
          </div>
          
          <!-- Title -->
          <h3 class="event-title line-clamp-2">${escapeHtml(event.title)}</h3>
          
          <!-- Description -->
          ${event.description ? `
            <p class="event-description line-clamp-2">${escapeHtml(event.description)}</p>
          ` : ''}
          
          <!-- Meta info -->
          <div class="event-meta">
            <div class="event-meta-item">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>${event.time}</span>
            </div>
            <div class="event-meta-item">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="line-clamp-1">${escapeHtml(event.location.name)}, ${escapeHtml(event.location.city)}</span>
            </div>
          </div>
        </div>
        
        <!-- Arrow icon -->
        <div class="event-arrow">
          <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
      </div>
    </a>
    
    <!-- Calendar button -->
    <button class="event-calendar-btn" title="Add to calendar">
      <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </button>
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export for use in other modules
window.GREvents = window.GREvents || {};
window.GREvents.createEventCard = createEventCard;
window.GREvents.escapeHtml = escapeHtml;
// #region agent log
fetch('http://127.0.0.1:7245/ingest/57d3c4f2-eb6c-4edd-957c-6cde40b0a5e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'event-card.js:END',message:'Event Card module loaded',data:{hasCreateEventCard:!!window.GREvents.createEventCard},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
// #endregion
})();
