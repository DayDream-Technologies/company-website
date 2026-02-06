/**
 * GR Events Calendar - Calendar View Component (FullCalendar vanilla)
 */

(function() {
  'use strict';
  
  const { SOURCE_CONFIG } = window.GREvents;
  const { formatLongDate } = window.GREvents.DateUtils;
  const { escapeHtml } = window.GREvents;

// Store calendar instance for cleanup
let calendarInstance = null;

/**
 * Initialize calendar view
 */
function initCalendarView(container, events) {
  // Clean up previous instance
  if (calendarInstance) {
    calendarInstance.destroy();
    calendarInstance = null;
  }
  
  // Convert events to FullCalendar format
  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.startDateTime,
    end: event.endDateTime,
    backgroundColor: SOURCE_CONFIG[event.source]?.color || '#10b981',
    borderColor: SOURCE_CONFIG[event.source]?.color || '#10b981',
    extendedProps: {
      event: event,
    },
  }));
  
  // Render container
  container.innerHTML = `
    <div class="calendar-container">
      <div id="fullCalendar"></div>
    </div>
  `;
  
  // Initialize FullCalendar
  const calendarEl = container.querySelector('#fullCalendar');
  
  calendarInstance = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listMonth',
    },
    events: calendarEvents,
    eventClick: handleEventClick,
    height: 'auto',
    eventDisplay: 'block',
    eventTimeFormat: {
      hour: 'numeric',
      minute: '2-digit',
      meridiem: 'short',
    },
    dayMaxEvents: 3,
    moreLinkClick: 'popover',
    nowIndicator: true,
    fixedWeekCount: false,
  });
  
  calendarInstance.render();
}

/**
 * Handle event click - open event URL directly
 */
function handleEventClick(info) {
  const event = info.event.extendedProps.event;
  if (event.url) {
    window.open(event.url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Show event modal
 */
function showEventModal(event) {
  const modal = document.getElementById('eventModal');
  const modalContent = document.getElementById('eventModalContent');
  const sourceConfig = SOURCE_CONFIG[event.source] || {};
  
  modalContent.innerHTML = `
    <!-- Close button -->
    <button class="modal-close" id="modalCloseBtn">
      <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
    
    <!-- Badges -->
    <div class="event-modal-badges">
      <span class="badge badge-source" style="background-color: ${sourceConfig.color}20; color: ${sourceConfig.color};">
        ${sourceConfig.name || 'Unknown'}
      </span>
      ${event.category ? `
        <span class="badge badge-category">${event.category}</span>
      ` : ''}
    </div>
    
    <!-- Title -->
    <h3 class="event-modal-title">${escapeHtml(event.title)}</h3>
    
    <!-- Description -->
    ${event.description ? `
      <p class="event-modal-description">${escapeHtml(event.description)}</p>
    ` : ''}
    
    <!-- Details -->
    <div class="event-modal-details">
      <div class="event-modal-detail">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>${formatLongDate(event.date)}</span>
      </div>
      
      <div class="event-modal-detail">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>${event.time}</span>
      </div>
      
      <div class="event-modal-detail">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <div>
          <div class="event-modal-location-name">${escapeHtml(event.location.name)}</div>
          ${event.location.address ? `
            <div class="event-modal-location-address">${escapeHtml(event.location.address)}</div>
          ` : ''}
          <div class="event-modal-location-address">
            ${escapeHtml(event.location.city)}, ${event.location.state || 'MI'}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Action button -->
    <a href="${event.url}" target="_blank" rel="noopener noreferrer" class="event-modal-btn">
      View Event Details
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  `;
  
  // Show modal
  modal.classList.remove('hidden');
  
  // Close button handler
  const closeBtn = modalContent.querySelector('#modalCloseBtn');
  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });
  
  // Close on backdrop click
  const backdrop = modal.querySelector('.modal-backdrop');
  backdrop.addEventListener('click', () => {
    modal.classList.add('hidden');
  });
  
  // Close on escape key
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      modal.classList.add('hidden');
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

/**
 * Clean up calendar view
 */
function destroyCalendarView() {
  if (calendarInstance) {
    calendarInstance.destroy();
    calendarInstance = null;
  }
}

// Export for use in other modules
window.GREvents = window.GREvents || {};
window.GREvents.initCalendarView = initCalendarView;
window.GREvents.destroyCalendarView = destroyCalendarView;
window.GREvents.showEventModal = showEventModal;
})();
