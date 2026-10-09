const { fetchJson } = require('../core/fetch');
const { makeEvent, parseTime } = require('../core/normalize');

function asText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.Name || value.LocationName || value.Address1 || value.City || '';
}

async function scrape(source) {
  const begin = new Date().toISOString();
  const end = new Date(Date.now() + 180 * 86400000).toISOString();
  const community = source.options.communityEvent === true ? 'true' : 'false';
  const events = [];
  for (let page = 1; page <= 3; page++) {
    const url = 'https://api-internal.weblinkconnect.com/api/Events'
      + `?PageSize=100&PageNumber=${page}&OrganizationEvent=true&CommunityEvent=${community}`
      + '&MembersOnlyEvent=false&InternalEvent=false&EventClosed=false'
      + `&SearchDateBegin=${encodeURIComponent(begin)}&SearchDateEnd=${encodeURIComponent(end)}`;
    const data = await fetchJson(url, { headers: { 'x-tenant': source.options.tenant } });
    const list = Array.isArray(data) ? data : data.Result || data.Items || data.items || data.Data || data.Events || [];
    for (const item of list) {
      const start = item.StartDate || item.startDate || '';
      const timeMatch = String(start).match(/T(\d{2}):(\d{2})/);
      const location = item.Location;
      const event = makeEvent({
        source: source.id,
        title: item.EventName || item.eventName || item.Name,
        description: item.Descr || item.EventDescription || item.Description || '',
        date: String(start).slice(0, 10),
        time: timeMatch ? parseTime(`${timeMatch[1]}:${timeMatch[2]}`) : 'TBD',
        address: item.Address1 || '',
        city: item.City || (location && location.City) || source.options.defaultCity || '',
        locationName: item.LocationName || item.Venue || asText(location),
        url: item.RelatedWebsite || source.url,
      });
      if (event) events.push(event);
    }
    if (!data.TotalPages || page >= data.TotalPages) break;
  }
  return events;
}

module.exports = { scrape };
