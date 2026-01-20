/**
 * GR Events Calendar - ICS Export Utility
 */

const { formatICSDate, formatGoogleDate } = window.GREvents.DateUtils;

/**
 * Escape special characters for ICS format
 */
function escapeICS(text) {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate a unique ID for the event
 */
function generateUID(event) {
  return `${event.id}@gr-events-calendar`;
}

/**
 * Convert a single event to ICS VEVENT format
 */
function eventToVEvent(event) {
  const now = formatICSDate(new Date().toISOString());
  const start = formatICSDate(event.startDateTime);
  
  // If no end time, assume 2 hours duration
  let end;
  if (event.endDateTime) {
    end = formatICSDate(event.endDateTime);
  } else {
    const endDate = new Date(event.startDateTime);
    endDate.setHours(endDate.getHours() + 2);
    end = formatICSDate(endDate.toISOString());
  }
  
  const location = [
    event.location.name,
    event.location.address,
    event.location.city,
    event.location.state || 'MI',
  ].filter(Boolean).join(', ');
  
  const lines = [
    'BEGIN:VEVENT',
    `UID:${generateUID(event)}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeICS(event.title)}`,
  ];
  
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
  }
  
  if (location) {
    lines.push(`LOCATION:${escapeICS(location)}`);
  }
  
  if (event.url) {
    lines.push(`URL:${event.url}`);
  }
  
  // Add geo coordinates if available
  if (event.location.lat && event.location.lng) {
    lines.push(`GEO:${event.location.lat};${event.location.lng}`);
  }
  
  lines.push('END:VEVENT');
  
  return lines.join('\r\n');
}

/**
 * Generate ICS file content for multiple events
 */
function generateICS(events) {
  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GR Events Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:GR Startup Events',
    'X-WR-TIMEZONE:America/Detroit',
  ].join('\r\n');
  
  const vevents = events.map(eventToVEvent).join('\r\n');
  
  const footer = 'END:VCALENDAR';
  
  return `${header}\r\n${vevents}\r\n${footer}`;
}

/**
 * Download ICS file
 */
function downloadICS(events, filename = 'gr-events.ics') {
  const icsContent = generateICS(events);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar URL for a single event
 */
function getGoogleCalendarUrl(event) {
  const start = formatGoogleDate(event.startDateTime);
  
  let end;
  if (event.endDateTime) {
    end = formatGoogleDate(event.endDateTime);
  } else {
    const endDate = new Date(event.startDateTime);
    endDate.setHours(endDate.getHours() + 2);
    end = formatGoogleDate(endDate.toISOString());
  }
  
  const location = [
    event.location.name,
    event.location.address,
    event.location.city,
    event.location.state || 'MI',
  ].filter(Boolean).join(', ');
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description || '',
    location: location,
  });
  
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

// Export for use in other modules
window.GREvents = window.GREvents || {};
window.GREvents.ICSExport = {
  generateICS,
  downloadICS,
  getGoogleCalendarUrl,
};
