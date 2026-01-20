/**
 * GR Events Calendar - Map View Component (Leaflet vanilla)
 */

(function() {
  'use strict';
  
  const { SOURCE_CONFIG, GRAND_RAPIDS_CENTER } = window.GREvents;
  const { formatMediumDate, formatMonthDay } = window.GREvents.DateUtils;
  const { escapeHtml } = window.GREvents;

// Store map instance for cleanup
let mapInstance = null;

/**
 * Initialize map view
 */
function initMapView(container, events) {
  // Clean up previous instance
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
  
  // Filter events with coordinates
  const mappableEvents = events.filter(e => e.location.lat && e.location.lng);
  const unmappedEvents = events.filter(e => !e.location.lat || !e.location.lng);
  
  // Group events by location for clustering
  const locationGroups = {};
  mappableEvents.forEach(event => {
    const key = `${event.location.lat?.toFixed(4)},${event.location.lng?.toFixed(4)}`;
    if (!locationGroups[key]) {
      locationGroups[key] = [];
    }
    locationGroups[key].push(event);
  });
  
  // Render container
  container.innerHTML = `
    <div class="map-layout">
      <!-- Map container -->
      <div class="map-container" id="leafletMap"></div>
      
      ${unmappedEvents.length > 0 ? `
        <!-- Sidebar with unmapped events -->
        <div class="map-sidebar">
          <div class="card map-sidebar-card">
            <h3 class="map-sidebar-title">Events Not on Map</h3>
            <p class="map-sidebar-subtitle">${unmappedEvents.length} events without location data</p>
            
            <div class="map-sidebar-events" id="unmappedEventsContainer"></div>
            
            ${unmappedEvents.length > 10 ? `
              <div class="map-sidebar-more">+${unmappedEvents.length - 10} more events</div>
            ` : ''}
          </div>
        </div>
      ` : ''}
    </div>
  `;
  
  // Initialize Leaflet map
  const mapEl = container.querySelector('#leafletMap');
  
  mapInstance = L.map(mapEl).setView(
    [GRAND_RAPIDS_CENTER.lat, GRAND_RAPIDS_CENTER.lng],
    11
  );
  
  // Add dark tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(mapInstance);
  
  // Add markers for each location group
  Object.entries(locationGroups).forEach(([key, groupEvents]) => {
    const firstEvent = groupEvents[0];
    if (!firstEvent.location.lat || !firstEvent.location.lng) return;
    
    const marker = L.marker([firstEvent.location.lat, firstEvent.location.lng])
      .addTo(mapInstance);
    
    // Create popup content
    const popupContent = groupEvents.length === 1
      ? createEventPopup(firstEvent)
      : createMultiEventPopup(groupEvents);
    
    marker.bindPopup(popupContent, {
      maxWidth: 300,
      className: 'custom-popup',
    });
  });
  
  // Render unmapped events in sidebar
  const unmappedContainer = container.querySelector('#unmappedEventsContainer');
  if (unmappedContainer) {
    unmappedEvents.slice(0, 10).forEach(event => {
      const eventEl = createSidebarEvent(event);
      unmappedContainer.appendChild(eventEl);
    });
  }
}

/**
 * Create popup content for single event
 */
function createEventPopup(event) {
  const sourceConfig = SOURCE_CONFIG[event.source] || {};
  
  return `
    <div style="min-width: 200px;">
      <div class="popup-badge" style="background-color: ${sourceConfig.color}30; color: ${sourceConfig.color};">
        ${sourceConfig.name || 'Unknown'}
      </div>
      
      <h4 class="popup-title">${escapeHtml(event.title)}</h4>
      
      <div class="popup-meta">
        <div class="popup-meta-item">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          ${formatMediumDate(event.date)}
        </div>
        <div class="popup-meta-item">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          ${event.time}
        </div>
        <div class="popup-meta-item">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          ${escapeHtml(event.location.name)}
        </div>
      </div>
      
      <a href="${event.url}" target="_blank" rel="noopener noreferrer" class="popup-link">
        View Details
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 12px; height: 12px;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  `;
}

/**
 * Create popup content for multiple events at same location
 */
function createMultiEventPopup(events) {
  const displayEvents = events.slice(0, 5);
  const remainingCount = events.length - 5;
  
  let html = `
    <div style="min-width: 200px;">
      <div style="font-weight: 600; font-size: 14px; border-bottom: 1px solid var(--gr-card-border); padding-bottom: 8px; margin-bottom: 8px;">
        ${events.length} events at this location
      </div>
  `;
  
  displayEvents.forEach(event => {
    const sourceConfig = SOURCE_CONFIG[event.source] || {};
    html += `
      <a href="${event.url}" target="_blank" rel="noopener noreferrer" 
         style="display: block; padding: 8px; margin: -8px; border-radius: 4px; transition: background 0.2s;"
         onmouseover="this.style.background='#1a1a1a'" onmouseout="this.style.background='transparent'">
        <div style="display: flex; align-items: flex-start; gap: 8px;">
          <div style="width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 6px; background-color: ${sourceConfig.color};"></div>
          <div>
            <div style="font-weight: 500; font-size: 13px; line-height: 1.3;">${escapeHtml(event.title)}</div>
            <div style="font-size: 11px; color: var(--gr-text-muted);">${formatMonthDay(event.date)} • ${event.time}</div>
          </div>
        </div>
      </a>
    `;
  });
  
  if (remainingCount > 0) {
    html += `<div style="font-size: 12px; color: var(--gr-text-muted); margin-top: 8px;">+${remainingCount} more events</div>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Create sidebar event element
 */
function createSidebarEvent(event) {
  const sourceConfig = SOURCE_CONFIG[event.source] || {};
  
  const el = document.createElement('a');
  el.className = 'map-sidebar-event';
  el.href = event.url;
  el.target = '_blank';
  el.rel = 'noopener noreferrer';
  
  el.innerHTML = `
    <div class="map-sidebar-event-dot" style="background-color: ${sourceConfig.color};"></div>
    <div class="map-sidebar-event-title line-clamp-1">${escapeHtml(event.title)}</div>
    <div class="map-sidebar-event-meta">${formatMediumDate(event.date)} • ${escapeHtml(event.location.city)}</div>
  `;
  
  return el;
}

/**
 * Clean up map view
 */
function destroyMapView() {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
}

// Export for use in other modules
window.GREvents = window.GREvents || {};
window.GREvents.initMapView = initMapView;
window.GREvents.destroyMapView = destroyMapView;
// #region agent log
fetch('http://127.0.0.1:7245/ingest/57d3c4f2-eb6c-4edd-957c-6cde40b0a5e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'map-view.js:END',message:'Map View module loaded',data:{hasInitMapView:!!window.GREvents.initMapView},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
// #endregion
})();
