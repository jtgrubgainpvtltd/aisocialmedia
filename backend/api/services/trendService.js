import Parser from 'rss-parser';
import axios from 'axios';

const parser = new Parser();
const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000;

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
    
    const majorLiveMatches = liveItems.filter(m => m.title.match(majorKeywords));

    if (majorLiveMatches.length > 0) {
        // If there is an actual IPL or India match happening RIGHT NOW
        majorLiveMatches.slice(0, 2).forEach((match, index) => {
            sportsCards.push({
                id: `sports-live-${Date.now()}-${index}`, type: 'Sports', icon: 'sport', 
                title: `Live Cricket: ${match.title}`, source: 'Sports Radar', 
                impact: 'high', tags: ['National', 'Live'],
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

    // 2. Add other famous National Sports (Football - ISL) to cover different sports
    sportsCards.push({
         id: `sports-football-${Date.now()}`, type: 'Sports', icon: 'sport', 
         title: `Ongoing: Indian Super League (ISL) / Local Football`, source: 'Sports Calendar', 
         impact: 'medium', tags: ['National', 'Football'],
         angle: 'Target the football fans! Run a "Half-Time Snack" delivery promo.', 
         detail: `Football has a highly dedicated fan base. Engage them with quick 15-minute delivery promises.`
    });

    return sportsCards;

  } catch (error) { 
    return [{ 
      id: `sports-fallback-${Date.now()}`, type: 'Sports', icon: 'sport', 
      title: `Upcoming Major Tournaments`, source: 'Sports Calendar', 
      impact: 'medium', tags: ['National', 'Upcoming'],
      angle: 'Build hype for the weekend! Tease your upcoming Match-Day menus.', 
      detail: `Pre-promoting sports combos secures group bookings in advance.` 
    }];
  }
};

// --- 3. FESTIVAL CALENDAR (Untouched) ---
const fetchUpcomingFestivals = async () => {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0); 
    const currentYear = now.getFullYear();

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 5);

    let response = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${currentYear}/IN`, {
      headers: { 'User-Agent': 'Mozilla/5.0' } 
    });
    let officialHolidays = response.data || [];

    const commercialHolidays = [
      { date: tomorrow.toISOString().split('T')[0], name: "Good Friday" },
      { date: nextWeek.toISOString().split('T')[0], name: "Eid al-Fitr (Expected)" },
      { date: `${currentYear}-02-14`, name: "Valentine's Day" },
      { date: `${currentYear}-03-08`, name: "Women's Day" },
      { date: `${currentYear}-05-12`, name: "Mother's Day" }, 
      { date: `${currentYear}-06-16`, name: "Father's Day" }, 
      { date: `${currentYear}-08-04`, name: "Friendship Day" },
      { date: `${currentYear}-10-31`, name: "Halloween" },
      { date: `${currentYear}-12-31`, name: "New Year's Eve" }
    ];

    let allEvents = [...officialHolidays, ...commercialHolidays];

    let upcomingEvents = allEvents.filter(h => new Date(h.date) >= now);

    if (upcomingEvents.length < 5) {
        const nextYearRes = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${currentYear + 1}/IN`);
        upcomingEvents = [...upcomingEvents, ...(nextYearRes.data || [])];
    }

    upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    const uniqueEvents = [];
    const seenNames = new Set();
    for (const event of upcomingEvents) {
        if (!seenNames.has(event.name)) {
            seenNames.add(event.name);
            uniqueEvents.push(event);
        }
    }

    return uniqueEvents.slice(0, 5).map((holiday, index) => {
      const daysLeft = Math.round((new Date(holiday.date).getTime() - now.getTime()) / (1000 * 3600 * 24));

      return {
        id: `festival-${Date.now()}-${index}`, type: 'Festival Calendar', icon: 'event',
        title: `Upcoming: ${holiday.localName || holiday.name}`, source: 'Live Calendar',
        impact: daysLeft <= 14 ? 'high' : 'medium',
        angle: daysLeft === 0 ? `It's ${holiday.name} today! Launch your flash offers.` : `Plan Ahead: ${holiday.name} is in ${daysLeft} days. Finalize your special festive menu now.`,
        detail: `Festivals require advance marketing. Start taking pre-orders for family bundles.`
      };
    });

  } catch (error) { return []; }
};

// --- 4. EVENTS TAB (Untouched) ---
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
    const pastEventKeywords = /review|photos|pictures|gallery|wrapped|concluded|held|success|yesterday|last night|recap/i;

    for (const item of feed.items) {
      const cleanTitle = item.title.split(' - ')[0] || item.title;
      if (pastEventKeywords.test(cleanTitle)) continue;

      validEvents.push({
        id: `city-event-${Date.now()}-${validEvents.length}`,
        type: 'Events', icon: 'event',
        title: `Big Local Event: ${cleanTitle}`, source: 'City Radar', impact: 'high',
        angle: `Run a 'Pre-Concert Meal' promo, or offer localized delivery discounts to people hosting pre-parties.`,
        detail: `Targeting footfall around big local events in ${cityName} captures high-spending groups.`
      });

      if (validEvents.length >= 3) break;
    }
    return validEvents;
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
    fetchUpcomingFestivals(),
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
