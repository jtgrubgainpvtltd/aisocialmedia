import Parser from 'rss-parser';
import axios from 'axios';

const parser = new Parser();
const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000;
const IST_TIMEZONE = 'Asia/Kolkata';

const toISTDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    const fallback = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
    const y = fallback.getUTCFullYear();
    const m = String(fallback.getUTCMonth() + 1).padStart(2, '0');
    const d = String(fallback.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return `${year}-${month}-${day}`;
};

const parseISTDateKey = (dateKey) => new Date(`${dateKey}T00:00:00+05:30`);

const daysUntilIST = (dateKey, todayKey = toISTDateKey()) =>
  Math.floor((parseISTDateKey(dateKey).getTime() - parseISTDateKey(todayKey).getTime()) / (1000 * 60 * 60 * 24));

const normalizeHolidayName = (name = '') =>
  name
    .replace(/\bId-ul-Fitr\b/i, 'Eid al-Fitr')
    .replace(/\bId ul Fitr\b/i, 'Eid al-Fitr')
    .replace(/\s+/g, ' ')
    .trim();

const DEFAULT_GOOGLE_HOLIDAY_CALENDAR_ID = 'en.indian%23holiday%40group.v.calendar.google.com';

const mapGoogleCalendarEvents = (events = []) =>
  events
    .filter((item) => item?.start?.date && item?.summary)
    .map((item) => ({
      date: item.start.date,
      name: normalizeHolidayName(item.summary),
      source: 'Google Calendar'
    }));

const normalizeCalendarId = (calendarId = '') => {
  const trimmed = calendarId.trim();
  if (!trimmed) return '';
  try {
    return encodeURIComponent(decodeURIComponent(trimmed));
  } catch {
    return encodeURIComponent(trimmed);
  }
};

const toRawCalendarId = (calendarId = '') => {
  const trimmed = calendarId.trim();
  if (!trimmed) return '';
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
};

const parseJsonObject = (value) => {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const getGoogleCalendarIdsForCity = (cityName = '') => {
  const baseCalendarId = process.env.GOOGLE_HOLIDAY_CALENDAR_ID || DEFAULT_GOOGLE_HOLIDAY_CALENDAR_ID;
  const extraCalendarIds = (process.env.GOOGLE_HOLIDAY_EXTRA_CALENDAR_IDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const cityCalendarMap = parseJsonObject(process.env.GOOGLE_CITY_HOLIDAY_CALENDAR_MAP);
  const cityKey = cityName.trim().toLowerCase();
  const cityConfig = cityCalendarMap[cityKey];
  const cityCalendarIds = Array.isArray(cityConfig)
    ? cityConfig
    : typeof cityConfig === 'string'
      ? [cityConfig]
      : [];

  return [...new Set([baseCalendarId, ...extraCalendarIds, ...cityCalendarIds])];
};

const fetchGoogleCalendarHolidays = async (todayKey, currentYear, cityName) => {
  const apiKey = process.env.GOOGLE_SERVICES_API_KEY;
  if (!apiKey) return [];
  const calendarIds = getGoogleCalendarIdsForCity(cityName);
  if (calendarIds.length === 0) return [];

  const timeMin = `${todayKey}T00:00:00+05:30`;
  const timeMax = `${currentYear + 1}-12-31T23:59:59+05:30`;

  const calendarResponses = await Promise.all(
    calendarIds.map(async (calendarId) => {
      const normalizedCalendarId = normalizeCalendarId(calendarId);
      if (!normalizedCalendarId) return [];

      try {
        const response = await axios.get(
          `https://www.googleapis.com/calendar/v3/calendars/${normalizedCalendarId}/events`,
          {
            params: {
              key: apiKey,
              singleEvents: true,
              orderBy: 'startTime',
              timeMin,
              timeMax,
              maxResults: 250
            },
            headers: { 'User-Agent': 'Mozilla/5.0' }
          }
        );

        return mapGoogleCalendarEvents(response.data?.items || []);
      } catch {
        return [];
      }
    })
  );

  return calendarResponses.flat();
};

const parseIcsDateKey = (value = '') => {
  const clean = value.trim();
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
};

const unfoldIcs = (icsText = '') =>
  icsText
    .replace(/\r\n[ \t]/g, '')
    .replace(/\n[ \t]/g, '');

const parseIcsEvents = (icsText = '') => {
  const events = [];
  const unfolded = unfoldIcs(icsText);
  const blocks = unfolded.split('BEGIN:VEVENT').slice(1);

  for (const block of blocks) {
    const eventBody = block.split('END:VEVENT')[0] || '';
    const summaryMatch = eventBody.match(/SUMMARY:(.+)/);
    const dateMatch =
      eventBody.match(/DTSTART;VALUE=DATE:(\d{8})/) ||
      eventBody.match(/DTSTART(?:;[^:]+)?:([0-9TZ]+)/);

    if (!summaryMatch || !dateMatch) continue;
    const date = parseIcsDateKey(dateMatch[1]);
    if (!date) continue;

    events.push({
      date,
      name: normalizeHolidayName(summaryMatch[1]),
      source: 'Google Calendar (Public)'
    });
  }

  return events;
};

const fetchGooglePublicIcsHolidays = async (cityName) => {
  const calendarIds = getGoogleCalendarIdsForCity(cityName);
  if (calendarIds.length === 0) return [];

  const responses = await Promise.all(
    calendarIds.map(async (calendarId) => {
      const rawCalendarId = toRawCalendarId(calendarId);
      if (!rawCalendarId) return [];
      const icsUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(rawCalendarId)}/public/basic.ics`;

      try {
        const response = await axios.get(icsUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 10000
        });
        return parseIcsEvents(response.data || '');
      } catch {
        return [];
      }
    })
  );

  return responses.flat();
};

const fetchNagerHolidays = async (years = []) => {
  const responses = await Promise.all(
    years.map(async (year) => {
      try {
        const response = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        return response.data || [];
      } catch {
        return [];
      }
    })
  );

  return responses.flat().map((item) => ({
    date: item.date,
    name: normalizeHolidayName(item.localName || item.name),
    source: 'Official Calendar'
  }));
};

const getWeatherStrategy = (code, temp, dayLabel) => {
  let condition = "Clear";
  let angle = `${dayLabel} looks great! Promote your outdoor seating or a refreshing dine-in experience.`;

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) {
      condition = code >= 95 ? "Thunderstorm" : "Raining";
      angle = `${dayLabel === 'Today' ? "It's Raining right now" : `Rain expected ${dayLabel.toLowerCase()}`} -> Push hot delivery! Promote spicy comfort food, hot soups, or chai combos.`;
  } else if (temp > 30) {
      angle = `${dayLabel === 'Today' ? "It's Hot right now" : `Hot weather expected ${dayLabel.toLowerCase()}`} -> Push cold drinks! Highlight iced coffees, mocktails, milkshakes, and refreshing salads.`;
  } else if (code >= 71 && code <= 77) {
      condition = "Snowing / Cold";
      angle = `${dayLabel} will be cold -> Push warm comfort foods, sizzlers, and fast home delivery services.`;
  }
  
  return { condition, angle, impact: condition.includes('Rain') || temp > 30 ? 'high' : 'medium' };
};

// --- 1. WEATHER TAB (Untouched) ---
const fetchWeatherData = async (cityName) => {
  try {
    const geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1`);
    if (!geoRes.data.results?.length) return [];
    
    const { latitude, longitude } = geoRes.data.results[0];
    const weatherRes = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max&timezone=auto`);
    
    const current = weatherRes.data.current;
    const daily = weatherRes.data.daily;
    if (!current || !daily) return [];

    const weatherCards = [];

    const currentStrategy = getWeatherStrategy(current.weather_code, current.temperature_2m, "Today");
    weatherCards.push({
      id: `weather-now-${Date.now()}`, type: 'Weather', icon: 'weather',
      title: `Current Temp: ${current.temperature_2m}°C, ${currentStrategy.condition}`, source: 'Open-Meteo',
      impact: currentStrategy.impact, angle: currentStrategy.angle, 
      detail: `Real-time weather data for ${cityName}. Match your promotional imagery to the weather outside right now.`
    });

    const tmrwStrategy = getWeatherStrategy(daily.weather_code[1], daily.temperature_2m_max[1], "Tomorrow");
    weatherCards.push({
      id: `weather-tmrw-${Date.now()}`, type: 'Weather', icon: 'weather',
      title: `Tomorrow's Forecast: ${daily.temperature_2m_max[1]}°C, ${tmrwStrategy.condition}`, source: 'Open-Meteo',
      impact: 'medium', angle: tmrwStrategy.angle, 
      detail: `Plan tomorrow's social media posts tonight based on this forecast.`
    });

    const day3Strategy = getWeatherStrategy(daily.weather_code[2], daily.temperature_2m_max[2], "The day after tomorrow");
    weatherCards.push({
      id: `weather-day3-${Date.now()}`, type: 'Weather', icon: 'weather',
      title: `Upcoming Forecast: ${daily.temperature_2m_max[2]}°C, ${day3Strategy.condition}`, source: 'Open-Meteo',
      impact: 'low', angle: day3Strategy.angle, 
      detail: `Look ahead to secure supply and staff based on upcoming weather changes.`
    });

    return weatherCards;
  } catch (error) { return []; }
};

// --- 2. SPORTS TAB (UPDATED: Strictly Indian/Famous Sports Only) ---
const fetchLiveSports = async () => {
  try {
    const feed = await parser.parseURL('https://static.cricinfo.com/rss/livescores.xml');
    const sportsCards = [];
    
    // 1. Check for LIVE matches involving India, IPL franchises, etc.
    const liveItems = feed?.items || [];
    const majorKeywords = /India|IPL|Ranji|WPL|Mumbai|Chennai|Delhi|Bangalore|Kolkata|Gujarat|Punjab|Rajasthan|Hyderabad|Lucknow/i;
    
    const majorLiveMatches = liveItems.filter((m) => (m.title || '').match(majorKeywords));

    if (majorLiveMatches.length > 0) {
        // Show more than one live/major cricket trigger for denser feed
        majorLiveMatches.slice(0, 3).forEach((match, index) => {
            sportsCards.push({
                id: `sports-live-${Date.now()}-${index}`, type: 'Sports', icon: 'sport', 
                title: `Live Cricket: ${match.title}`, source: 'Sports Radar', 
                impact: index === 0 ? 'high' : 'medium', tags: ['National', 'Live'],
                angle: `Order food while you watch the match! Push a "Match-Day Mega Platter" right now.`, 
                detail: `Live sports drive massive spikes in group food delivery.` 
            });
        });
    } else {
        // If it's morning/afternoon and the IPL match hasn't started yet, don't show obscure matches. Show the Tournament!
        sportsCards.push({ 
          id: `sports-ipl-${Date.now()}`, type: 'Sports', icon: 'sport', 
          title: `Ongoing Tournament: Indian Premier League (IPL)`, source: 'Sports Calendar', 
          impact: 'high', tags: ['National', 'Cricket'],
          angle: 'Match tonight? Build hype! Tease your IPL Match-Day menus and bucket-beer combos early.', 
          detail: `Pre-promoting sports combos secures group bookings in advance before the evening toss.` 
        });
    }

    // 2. Add other famous National Sports to keep sports feed rich
    sportsCards.push({
         id: `sports-football-${Date.now()}`, type: 'Sports', icon: 'sport', 
         title: `Ongoing: Indian Super League (ISL) / Local Football`, source: 'Sports Calendar', 
         impact: 'medium', tags: ['National', 'Football'],
         angle: 'Target the football fans! Run a "Half-Time Snack" delivery promo.', 
         detail: `Football has a highly dedicated fan base. Engage them with quick 15-minute delivery promises.`
    });

    sportsCards.push({
         id: `sports-kabaddi-${Date.now()}`, type: 'Sports', icon: 'sport',
         title: `Trending: Pro Kabaddi & Indoor League Watch Parties`, source: 'Sports Calendar',
         impact: 'medium', tags: ['National', 'Kabaddi'],
         angle: 'Push "Group Snack Buckets" and couch-viewing combos for fan circles.',
         detail: `Kabaddi and indoor league viewers order in groups, making bundle pricing highly effective.`
    });

    if (sportsCards.length < 4) {
      sportsCards.push({
        id: `sports-hype-${Date.now()}`, type: 'Sports', icon: 'sport',
        title: `Fan Momentum: Weekend Match Binge Window`, source: 'Sports Trends',
        impact: 'medium', tags: ['National', 'Weekend'],
        angle: 'Pre-sell game-night meal boxes in the afternoon to lock in evening orders.',
        detail: `Sports-viewing demand clusters around weekends and late evenings.`
      });
    }

    return sportsCards.slice(0, 5);

  } catch (error) { 
    return [
      { 
        id: `sports-fallback-${Date.now()}`, type: 'Sports', icon: 'sport', 
        title: `Upcoming Major Tournaments`, source: 'Sports Calendar', 
        impact: 'medium', tags: ['National', 'Upcoming'],
        angle: 'Build hype for the weekend! Tease your upcoming Match-Day menus.', 
        detail: `Pre-promoting sports combos secures group bookings in advance.` 
      },
      {
        id: `sports-fallback-football-${Date.now()}`, type: 'Sports', icon: 'sport',
        title: `Football Fan Window: ISL / Club Match Nights`, source: 'Sports Calendar',
        impact: 'medium', tags: ['National', 'Football'],
        angle: 'Run quick-delivery halftime snack offers with combo upgrades.',
        detail: `Football audiences reward fast delivery and impulse snack bundles.`
      },
      {
        id: `sports-fallback-kabaddi-${Date.now()}`, type: 'Sports', icon: 'sport',
        title: `Kabaddi & Indoor League Watch Demand`, source: 'Sports Trends',
        impact: 'low', tags: ['National', 'Kabaddi'],
        angle: 'Promote party packs and family meal boxes during game windows.',
        detail: `Regional sports nights can generate reliable repeat orders.`
      }
    ];
  }
};

// --- 3. FESTIVAL CALENDAR ---
const fetchUpcomingFestivals = async (cityName) => {
  try {
    const todayKey = toISTDateKey();
    const currentYear = Number(todayKey.slice(0, 4));
    const yearsToFetch = [currentYear, currentYear + 1];

    let festivalEvents = await fetchGoogleCalendarHolidays(todayKey, currentYear, cityName);

    if (festivalEvents.length < 5) {
      const publicCalendarEvents = await fetchGooglePublicIcsHolidays(cityName);
      festivalEvents = [...festivalEvents, ...publicCalendarEvents];
    }

    if (festivalEvents.length < 5) {
      const officialFallbackEvents = await fetchNagerHolidays(yearsToFetch);
      festivalEvents = [...festivalEvents, ...officialFallbackEvents];
    }

    const allEvents = festivalEvents
      .filter((event) => event.date && daysUntilIST(event.date, todayKey) >= 0)
      .sort((a, b) => parseISTDateKey(a.date) - parseISTDateKey(b.date));

    const uniqueEvents = [];
    const seen = new Set();
    for (const event of allEvents) {
      const dedupeKey = `${event.name.toLowerCase()}-${event.date}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      uniqueEvents.push(event);
    }

    return uniqueEvents.slice(0, 5).map((holiday, index) => {
      const daysLeft = daysUntilIST(holiday.date, todayKey);

      return {
        id: `festival-${Date.now()}-${index}`, type: 'Festival Calendar', icon: 'event',
        title: `Upcoming: ${holiday.name}`, source: holiday.source,
        impact: daysLeft <= 14 ? 'high' : 'medium',
        angle: daysLeft === 0 ? `It's ${holiday.name} today! Launch your flash offers.` : `Plan Ahead: ${holiday.name} is in ${daysLeft} days. Finalize your special festive menu now.`,
        detail: `Festivals require advance marketing. Start taking pre-orders for family bundles.`
      };
    });

  } catch (error) { return []; }
};

// --- 4. EVENTS TAB ---
const fetchLocalCityEvents = async (cityName) => {
  try {
    const query = encodeURIComponent(`("concert" OR "live music" OR "standup" OR "tour" OR "live show") ${cityName} when:14d`);
    const feed = await parser.parseURL(`https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`);
    
    if (!feed || !feed.items || feed.items.length === 0) {
        return [{
            id: `city-event-fallback-${Date.now()}`, type: 'Events', icon: 'event',
            title: `Local Weekend Events in ${cityName}`, source: 'Local Radar', impact: 'medium',
            angle: `Give your audience an excuse to drop by for a 'pre-event meal' before they head out this weekend.`,
            detail: `Partner with local event organizers or theaters to offer ticket-holder discounts.`
        }];
    }

    const validEvents = [];
    const pastEventKeywords = /review|reviews|photos|pictures|gallery|wrapped|concluded|held|success|yesterday|last night|recap|highlights|post-match|afterparty|ended|result|results|won|wins|defeated|victory|final score|scorecard|cancelled|canceled|cancel|cancels|postponed|called off|abandoned|backlash/i;
    const excludedNewsKeywords = /dead|die|died|death|killed|murder|overdose|tragedy|crime|arrested|arrest|police|rape|assault|violence|robbery|theft|fraud|scam|terror|explosion|blast|accident|injured|hospital|court|verdict|election|minister|politics|protest|riot|earthquake|flood|fire|announces|announced|government|govt|state|challenge|tour circuit|permission row|controversy|probe|funeral|obituary/i;
    const relevanceKeywords = /concert|festival|gig|live|show|tour|standup|comedy|workshop|expo|exhibition|performance|music|cultural/i;

    for (const item of feed.items) {
      const cleanTitle = item.title.split(' - ')[0] || item.title;
      const normalized = cleanTitle.toLowerCase();

      if (pastEventKeywords.test(normalized)) continue;
      if (excludedNewsKeywords.test(normalized)) continue;
      if (!relevanceKeywords.test(normalized)) continue;

      validEvents.push({
        id: `city-event-${Date.now()}-${validEvents.length}`,
        type: 'Events', icon: 'event',
        title: `Big Local Event: ${cleanTitle}`, source: 'City Radar', impact: 'high',
        angle: `Run a 'Pre-Concert Meal' promo, or offer localized delivery discounts to people hosting pre-parties.`,
        detail: `Targeting footfall around big local events in ${cityName} captures high-spending groups.`
      });

      if (validEvents.length >= 3) break;
    }
    return validEvents.length > 0 ? validEvents : [{
      id: `city-event-fallback-${Date.now()}`, type: 'Events', icon: 'event',
      title: `Weekend Event Buzz in ${cityName}`, source: 'Local Radar', impact: 'medium',
      angle: `Promote pre-event meal bundles for local audiences heading out this weekend.`,
      detail: `Use geo-targeted offers around venues and transit hubs to capture event traffic.`
    }];
  } catch (error) { return []; }
};

// --- 5. LOCAL INSIGHTS (Untouched) ---
const getBehavioralInsights = () => {
  const hour = new Date().getHours(); 
  const day = new Date().getDay(); 
  const isWeekend = day === 0 || day === 5 || day === 6; 
  const insights = [];

  if (hour >= 22 || hour < 4) {
      insights.push({ id: `insight-time-${Date.now()}`, type: 'Local Insights', icon: 'google', title: 'Late Night Cravings Spiking', source: 'Behavioral Data', impact: 'high', angle: 'Late night cravings spike after 11 PM. Push "Midnight Munchies" delivery ads right now.', detail: `Gen-Z and night-shift workers are actively looking for heavy comfort food delivery.` });
  } else if (hour >= 6 && hour < 11) {
      insights.push({ id: `insight-time-${Date.now()}`, type: 'Local Insights', icon: 'google', title: 'Morning Commuter Traffic', source: 'Behavioral Data', impact: 'medium', angle: 'Push grab-and-go coffees, fresh juices, and quick breakfast combos.', detail: `Consumers prioritize speed over dining-in during morning hours.` });
  } else if (hour >= 11 && hour < 15) {
      insights.push({ id: `insight-time-${Date.now()}`, type: 'Local Insights', icon: 'google', title: 'Corporate Lunch Rush', source: 'Behavioral Data', impact: 'high', angle: 'Run targeted ads for quick "Desktop Lunch" combos or office group meals.', detail: `Office workers look for fast, affordable, and mess-free lunch options.` });
  } else if (hour >= 15 && hour < 18) {
      insights.push({ id: `insight-time-${Date.now()}`, type: 'Local Insights', icon: 'google', title: 'The Afternoon Slump', source: 'Behavioral Data', impact: 'medium', angle: 'Push iced coffees, sweet treats, and "Buy 1 Get 1" snacks to drive impulse buys.', detail: `Energy levels dip in the afternoon, leading to a spike in sugar and caffeine cravings.` });
  } else if (hour >= 18 && hour < 22) {
      insights.push({ id: `insight-time-${Date.now()}`, type: 'Local Insights', icon: 'google', title: 'Dinner & Social Outings', source: 'Behavioral Data', impact: 'high', angle: 'Showcase your restaurant\'s ambience, large family platters, and signature dishes.', detail: `Dine-in decisions are heavily influenced by visual aesthetics during evening hours.` });
  }

  if (isWeekend) {
      insights.push({ id: `insight-day-${Date.now()}`, type: 'Local Insights', icon: 'google', title: 'Weekend Indulgence Mode', source: 'Behavioral Data', impact: 'high', angle: 'Push "Cheat Meal" marketing. Highlight your most decadent, premium dishes.', detail: `Consumers are 60% less price-sensitive and more likely to order desserts on weekends.` });
  } else if (day === 3 || day === 4) { 
      insights.push({ id: `insight-day-${Date.now()}`, type: 'Local Insights', icon: 'google', title: 'Mid-Week Slump', source: 'Behavioral Data', impact: 'medium', angle: 'Mid-week slump is hitting. Run an aggressive digital offer like "Wednesday Wings" to fill tables.', detail: `Wednesday and Thursday traditionally see dips in footfall. Price-based promotions work best here.` });
  } else if (day === 1 || day === 2) { 
      insights.push({ id: `insight-day-${Date.now()}`, type: 'Local Insights', icon: 'google', title: 'Start-of-Week Health Kick', source: 'Behavioral Data', impact: 'medium', angle: 'Consumers feel guilty after the weekend. Push salads, clean eating, and meal-prep combos.', detail: `Searches for "healthy food near me" peak on Mondays and Tuesdays.` });
  }

  return insights;
};

export const getAggregatedCityFeed = async (cityName) => {
  if (cache.has(cityName)) {
    const cachedData = cache.get(cityName);
    if (Date.now() - cachedData.timestamp < CACHE_TTL) return cachedData.data;
  }

  const [weatherItems, sportsInsights, upcomingFestivals, localEvents] = await Promise.all([
    fetchWeatherData(cityName),
    fetchLiveSports(),
    fetchUpcomingFestivals(cityName),
    fetchLocalCityEvents(cityName)
  ]);

  const behavioralInsights = getBehavioralInsights();

  let finalFeed = [
    ...(weatherItems || []), 
    ...localEvents,     
    ...sportsInsights,
    ...upcomingFestivals,
    ...behavioralInsights
  ];

  cache.set(cityName, { timestamp: Date.now(), data: finalFeed });
  return finalFeed;
};

export default {
  getAggregatedCityFeed
};
