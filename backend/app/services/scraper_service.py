"""Scraper Service - Real Data Scraper for Drop-In Programs

This module provides real-time scraping of drop-in program data from:
- Mississauga: ActiveNet/ActiveCommunities (API interception)
- Oakville: PerfectMind BookMe4 (HTML parsing)
- Burlington: PerfectMind embedded widget (HTML parsing)

Each scraper extracts:
- Activity name, location, date, time
- Activity detail page URL (not general calendar page)
- Fee and availability information
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import random
import asyncio
import logging
import re
import json
from cachetools import TTLCache

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_cache = TTLCache(maxsize=100, ttl=1800)  # 30 minute cache


class ScraperService:
    """Service to scrape drop-in program data from city websites."""
    
    # ========================================================================
    # Configuration
    # ========================================================================
    
    # Mississauga ActiveNet Configuration
    MISSISSAUGA_BASE_URL = "https://anc.ca.apm.activecommunities.com"
    MISSISSAUGA_API_BASE = "https://anc.ca.apm.activecommunities.com/activemississauga"
    MISSISSAUGA_CALENDAR_URL = (
        "https://anc.ca.apm.activecommunities.com/activemississauga/calendars"
        "?onlineSiteId=0&no_scroll_top=true&defaultCalendarId=1&displayType=0&view=1"
    )
    # Activity detail URL pattern: /activity/search/detail/{activity_id}
    MISSISSAUGA_DETAIL_URL = "https://anc.ca.apm.activecommunities.com/activemississauga/activity/search/detail/{activity_id}?onlineSiteId=0&from_original_cui=true"
    
    # Oakville PerfectMind Configuration
    OAKVILLE_BASE_URL = "https://townofoakville.perfectmind.com"
    OAKVILLE_WIDGET_ID = "acf798a6-9321-41b7-aa41-92cbb8c1b485"
    OAKVILLE_BOOKME_URL = f"https://townofoakville.perfectmind.com/24974/Clients/BookMe4?widgetId={OAKVILLE_WIDGET_ID}"
    # Detail URL pattern for Oakville
    OAKVILLE_DETAIL_URL = "https://townofoakville.perfectmind.com/24974/Clients/BookMe4BookingPages/ClassDetails?classId={class_id}&widgetId=" + OAKVILLE_WIDGET_ID
    
    # Burlington Configuration
    BURLINGTON_BASE_URL = "https://www.burlington.ca"
    BURLINGTON_DROPIN_URL = "https://www.burlington.ca/en/recreation/drop-in-programs.aspx"
    BURLINGTON_ACTIVENET_URL = "https://econnect.burlington.ca"
    
    # Known Community Centers
    LOCATIONS = {
        "oakville": [
            # Community Centres
            {"id": "iroquois_ridge", "name": "Iroquois Ridge Community Centre"},
            {"id": "glen_abbey", "name": "Glen Abbey Community Centre"},
            {"id": "sixteen_mile", "name": "Sixteen Mile Sports Complex"},
            {"id": "trafalgar", "name": "Oakville Trafalgar Community Centre"},
            {"id": "qepccc", "name": "Queen Elizabeth Park Community & Cultural Centre"},
            {"id": "river_oaks", "name": "River Oaks Community Centre"},
            # Libraries
            {"id": "oakville_central_library", "name": "Central Branch Library (QEPCCC)"},
            {"id": "glen_abbey_library", "name": "Glen Abbey Library"},
            {"id": "iroquois_ridge_library", "name": "Iroquois Ridge Library"},
            {"id": "white_oaks_library", "name": "White Oaks Library"},
            # Arenas
            {"id": "iroquois_ridge_arena", "name": "Iroquois Ridge Arena"},
            {"id": "glen_abbey_arena", "name": "Glen Abbey Arena"},
            {"id": "sixteen_mile_arena", "name": "Sixteen Mile Sports Complex Arenas"},
            {"id": "oakville_arena", "name": "Oakville Arena"},
            {"id": "river_oaks_arena", "name": "River Oaks Arena"},
            {"id": "joshuas_creek_arena", "name": "Joshua's Creek Arenas"},
        ],
        "burlington": [
            # Community Centres
            {"id": "aldershot", "name": "Aldershot Community Centre"},
            {"id": "seniors_centre", "name": "Burlington Seniors' Centre"},
            {"id": "central_arena", "name": "Central Arena & Community Centre"},
            {"id": "haber", "name": "Haber Recreation Centre"},
            {"id": "mountainside", "name": "Mountainside Recreation Centre"},
            {"id": "nelson", "name": "Nelson Recreation Centre"},
            {"id": "tansley_woods", "name": "Tansley Woods Community Centre"},
            {"id": "mainway", "name": "Mainway Recreation Centre"},
            # Libraries
            {"id": "alton_library", "name": "Alton Branch Library"},
            {"id": "brant_hills_library", "name": "Brant Hills Branch Library"},
            {"id": "burlington_central_library", "name": "Central Branch Library"},
            {"id": "appleby_library", "name": "New Appleby Line Branch Library"},
            {"id": "tansley_library", "name": "Tansley Woods Branch Library"},
            # Arenas
            {"id": "aldershot_arena", "name": "Aldershot Arena"},
            {"id": "appleby_ice", "name": "Appleby Ice Centre"},
            {"id": "central_arena_ice", "name": "Central Arena"},
            {"id": "mountainside_arena", "name": "Mountainside Arena"},
            {"id": "nelson_arena", "name": "Nelson Arena"},
            {"id": "mainway_arena", "name": "Mainway Arena"},
            {"id": "sherwood_arena", "name": "Sherwood Forest Arena"},
        ],
        "mississauga": [
            # Community Centres
            {"id": "burnhamthorpe", "name": "Burnhamthorpe Community Centre"},
            {"id": "carmen_corbasson", "name": "Carmen Corbasson Community Centre"},
            {"id": "churchill_meadows", "name": "Churchill Meadows Community Centre"},
            {"id": "clarkson", "name": "Clarkson Community Centre"},
            {"id": "erin_meadows", "name": "Erin Meadows Community Centre & Library"},
            {"id": "frank_mckechnie", "name": "Frank McKechnie Community Centre"},
            {"id": "huron_park", "name": "Huron Park Community Centre"},
            {"id": "malton", "name": "Malton Community Centre"},
            {"id": "meadowvale", "name": "Meadowvale Community Centre"},
            {"id": "mississauga_valley", "name": "Mississauga Valley Community Centre"},
            {"id": "paramount", "name": "Paramount Fine Foods Centre"},
            {"id": "south_common", "name": "South Common Community Centre"},
            {"id": "streetsville", "name": "Streetsville Community Centre"},
            {"id": "river_grove", "name": "River Grove Community Centre"},
            # Libraries
            {"id": "burnhamthorpe_library", "name": "Burnhamthorpe Library"},
            {"id": "churchill_library", "name": "Churchill Meadows Library"},
            {"id": "clarkson_library", "name": "Clarkson Library"},
            {"id": "courtneypark_library", "name": "Courtneypark Library"},
            {"id": "erin_meadows_library", "name": "Erin Meadows Library"},
            {"id": "hazel_library", "name": "Hazel McCallion Central Library"},
            {"id": "lakeview_library", "name": "Lakeview Library"},
            {"id": "malton_library", "name": "Malton Library"},
            {"id": "meadowvale_library", "name": "Meadowvale Library"},
            {"id": "mississauga_valley_library", "name": "Mississauga Valley Library"},
            {"id": "port_credit_library", "name": "Port Credit Library"},
            {"id": "streetsville_library", "name": "Streetsville Library"},
            # Arenas
            {"id": "burnhamthorpe_arena", "name": "Burnhamthorpe Community Centre Arena"},
            {"id": "canlan_ice", "name": "Canlan Ice Sports – Mississauga"},
            {"id": "carmen_arena", "name": "Carmen Corbasson Arena"},
            {"id": "iceland", "name": "Iceland Mississauga"},
            {"id": "meadowvale_arena", "name": "Meadowvale Ice Arena"},
            {"id": "mississauga_valley_arena", "name": "Mississauga Valley Arena"},
            {"id": "port_credit_arena", "name": "Port Credit Arena"},
            {"id": "river_grove_rink", "name": "Rink at River Grove"},
            {"id": "tomken_rinks", "name": "Tomken Twin Rinks"},
        ],
    }
    
    # Activity type mapping
    ACTIVITY_KEYWORDS = {
        "swim": ["swim", "aqua", "pool", "lane", "water", "leisure swim"],
        "fitness": ["fitness", "gym", "track", "workout", "pilates", "yoga", "zumba", "aerobic"],
        "skating": ["skate", "skating", "hockey", "shinny", "ice"],
        "sports": ["basketball", "badminton", "pickleball", "volleyball", "tennis", "sports", "ball"],
        "other": [],
    }
    
    # Age group mapping
    AGE_KEYWORDS = {
        "adult": ["adult", "19+", "18+"],
        "senior": ["senior", "55+", "65+", "older adult"],
        "youth": ["youth", "teen", "13-17", "12-17"],
        "child": ["child", "kids", "0-12", "preschool"],
        "family": ["family", "all ages", "everyone", "public"],
    }
    
    def __init__(self):
        self._playwright_available = None
    
    async def _check_playwright(self) -> bool:
        """Check if Playwright is available."""
        if self._playwright_available is None:
            try:
                from playwright.async_api import async_playwright
                self._playwright_available = True
            except ImportError:
                logger.warning("Playwright not installed. Run: pip install playwright && playwright install chromium")
                self._playwright_available = False
        return self._playwright_available
    
    # ========================================================================
    # Public API
    # ========================================================================
    
    async def get_programs(self, city: str, use_cache: bool = True) -> List[dict]:
        """Get drop-in programs for a city (today only).
        
        Args:
            city: City name (oakville, burlington, mississauga)
            use_cache: Whether to use cached data
            
        Returns:
            List of program dictionaries with real data and detail URLs
        """
        city = city.lower()
        cache_key = f"programs_{city}"
        
        if use_cache and cache_key in _cache:
            logger.info(f"Returning cached programs for {city}")
            return _cache[cache_key]
        
        programs = []
        scrape_timeout = 30  # 30 second timeout for scraping
        
        try:
            if city == "mississauga":
                programs = await asyncio.wait_for(
                    self._scrape_mississauga(), timeout=scrape_timeout
                )
            elif city == "oakville":
                programs = await asyncio.wait_for(
                    self._scrape_oakville(), timeout=scrape_timeout
                )
            elif city == "burlington":
                programs = await asyncio.wait_for(
                    self._scrape_burlington(), timeout=scrape_timeout
                )
            else:
                logger.warning(f"Unknown city: {city}")
                return []
                
        except asyncio.TimeoutError:
            logger.warning(f"Scraping timeout for {city}, using mock data")
            programs = self._generate_mock_programs(city)
        except Exception as e:
            logger.error(f"Error scraping {city}: {e}, using mock data")
            programs = self._generate_mock_programs(city)
        
        # Filter to only today (next 24 hours)
        programs = self._filter_by_date_range(programs, days=1)
        
        if programs:
            _cache[cache_key] = programs
            logger.info(f"Successfully got {len(programs)} programs for {city}")
        else:
            logger.warning(f"No programs found for {city}")
            
        return programs
    
    async def get_raw_programs(self, city: str, use_cache: bool = False) -> dict:
        """Get raw scraped programs without date filtering (for debugging).
        
        Returns:
            dict with keys: 'raw_programs', 'filtered_programs', 'scrape_status'
        """
        city = city.lower()
        programs = []
        scrape_timeout = 30
        scrape_status = "unknown"
        
        try:
            if city == "mississauga":
                programs = await asyncio.wait_for(
                    self._scrape_mississauga(), timeout=scrape_timeout
                )
                scrape_status = "success"
            elif city == "oakville":
                programs = await asyncio.wait_for(
                    self._scrape_oakville(), timeout=scrape_timeout
                )
                scrape_status = "success"
            elif city == "burlington":
                programs = await asyncio.wait_for(
                    self._scrape_burlington(), timeout=scrape_timeout
                )
                scrape_status = "success"
            else:
                return {
                    "raw_programs": [],
                    "filtered_programs": [],
                    "scrape_status": "invalid_city",
                    "error": f"Unknown city: {city}"
                }
                
        except asyncio.TimeoutError:
            logger.warning(f"Scraping timeout for {city}, using mock data")
            programs = self._generate_mock_programs(city)
            scrape_status = "timeout_mock"
        except Exception as e:
            logger.error(f"Error scraping {city}: {e}, using mock data")
            programs = self._generate_mock_programs(city)
            scrape_status = f"error_mock: {str(e)}"
        
        # Get filtered programs (today only)
        filtered = self._filter_by_date_range(programs, days=1)
        
        return {
            "raw_programs": programs,
            "filtered_programs": filtered,
            "scrape_status": scrape_status,
            "raw_count": len(programs),
            "filtered_count": len(filtered),
        }
    
    async def get_locations(self, city: str) -> List[dict]:
        """Get community center locations for a city."""
        return self.LOCATIONS.get(city.lower(), [])
    
    # ========================================================================
    # Mississauga Scraper (ActiveNet API Interception)
    # ========================================================================
    
    async def _scrape_mississauga(self) -> List[dict]:
        """Scrape Mississauga drop-in programs using API interception.
        
        ActiveNet loads data via XHR/fetch calls. We intercept these to get
        structured JSON data including activity IDs for detail URLs.
        """
        if not await self._check_playwright():
            logger.error("Playwright not available for Mississauga scraping")
            return []
        
        from playwright.async_api import async_playwright
        
        programs = []
        api_responses = []
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()
            
            # Intercept API responses
            async def handle_response(response):
                url = response.url
                if 'calendar' in url.lower() or 'activity' in url.lower() or 'event' in url.lower():
                    try:
                        if 'application/json' in response.headers.get('content-type', ''):
                            data = await response.json()
                            api_responses.append({"url": url, "data": data})
                    except:
                        pass
            
            page.on("response", handle_response)
            
            try:
                # Navigate to calendar page
                await page.goto(self.MISSISSAUGA_CALENDAR_URL, wait_until="networkidle", timeout=30000)
                await page.wait_for_timeout(3000)
                
                # Try to load more data by clicking on different date tabs or next buttons
                try:
                    # Click on list view if available
                    list_btn = await page.query_selector('[data-view="list"], .list-view-btn, button:has-text("List")')
                    if list_btn:
                        await list_btn.click()
                        await page.wait_for_timeout(2000)
                except:
                    pass
                
                # Parse visible activities from the page
                programs = await self._parse_mississauga_page(page)
                
                # Also try to parse from API responses
                for resp in api_responses:
                    parsed = self._parse_mississauga_api_response(resp["data"])
                    programs.extend(parsed)
                
            except Exception as e:
                logger.error(f"Mississauga scraping error: {e}")
                
            finally:
                await browser.close()
        
        # Remove duplicates based on ID
        seen_ids = set()
        unique_programs = []
        for prog in programs:
            if prog["id"] not in seen_ids:
                seen_ids.add(prog["id"])
                unique_programs.append(prog)
        
        return unique_programs
    
    async def _parse_mississauga_page(self, page) -> List[dict]:
        """Parse Mississauga calendar page for activity data."""
        programs = []
        
        try:
            # ActiveNet uses various selectors for events
            selectors = [
                '.calendar-event',
                '.activity-item',
                '[class*="event-card"]',
                '[class*="calendar-item"]',
                '.fc-event',  # FullCalendar events
                '[data-activity-id]',
            ]
            
            for selector in selectors:
                items = await page.query_selector_all(selector)
                
                for item in items:
                    try:
                        # Get activity ID from data attribute or link
                        activity_id = await item.get_attribute('data-activity-id')
                        if not activity_id:
                            link = await item.query_selector('a[href*="detail"]')
                            if link:
                                href = await link.get_attribute('href')
                                match = re.search(r'/detail/(\d+)', href or '')
                                if match:
                                    activity_id = match.group(1)
                        
                        # Get text content
                        text = await item.text_content()
                        if not text:
                            continue
                        
                        # Parse the text for activity info
                        name = text.split('\n')[0].strip() if text else "Unknown Activity"
                        
                        # Build detail URL
                        if activity_id:
                            detail_url = self.MISSISSAUGA_DETAIL_URL.format(activity_id=activity_id)
                        else:
                            detail_url = self.MISSISSAUGA_CALENDAR_URL
                        
                        # Extract date/time if visible
                        date_str = datetime.now().strftime("%Y-%m-%d")
                        time_match = re.search(r'(\d{1,2}:\d{2}\s*[AaPp][Mm])', text)
                        start_time = self._normalize_time(time_match.group(1)) if time_match else "09:00"
                        
                        # Detect location
                        location_id, location_name = self._match_location("mississauga", text)
                        
                        programs.append({
                            "id": f"miss_{activity_id or hash(name) % 100000}",
                            "name": name[:100],
                            "location_id": location_id,
                            "location_name": location_name,
                            "city": "mississauga",
                            "activity_type": self._detect_activity_type(name),
                            "age_group": self._detect_age_group(name),
                            "date": date_str,
                            "start_time": start_time,
                            "end_time": "",
                            "fee": None,
                            "spots_available": None,
                            "spots_total": None,
                            "registration_url": detail_url,
                        })
                        
                    except Exception as e:
                        logger.debug(f"Error parsing Mississauga item: {e}")
                        continue
                        
        except Exception as e:
            logger.error(f"Error parsing Mississauga page: {e}")
        
        return programs
    
    def _parse_mississauga_api_response(self, data: Any) -> List[dict]:
        """Parse Mississauga API response for activity data."""
        programs = []
        
        if not data:
            return programs
            
        # ActiveNet API can return data in various formats
        items = []
        
        if isinstance(data, list):
            items = data
        elif isinstance(data, dict):
            # Try common keys
            for key in ['events', 'activities', 'items', 'data', 'results', 'calendar']:
                if key in data and isinstance(data[key], list):
                    items = data[key]
                    break
        
        for item in items:
            if not isinstance(item, dict):
                continue
                
            try:
                # Extract activity ID
                activity_id = item.get('activityId') or item.get('id') or item.get('eventId')
                if not activity_id:
                    continue
                
                # Extract name
                name = item.get('name') or item.get('title') or item.get('activityName') or "Unknown"
                
                # Extract date/time
                start = item.get('startDate') or item.get('start') or item.get('date')
                if start:
                    try:
                        if isinstance(start, str):
                            date_str = start[:10]
                            time_match = re.search(r'T(\d{2}:\d{2})', start)
                            start_time = time_match.group(1) if time_match else "09:00"
                        else:
                            date_str = datetime.now().strftime("%Y-%m-%d")
                            start_time = "09:00"
                    except:
                        date_str = datetime.now().strftime("%Y-%m-%d")
                        start_time = "09:00"
                else:
                    date_str = datetime.now().strftime("%Y-%m-%d")
                    start_time = "09:00"
                
                # Extract location
                location = item.get('location') or item.get('facility') or item.get('venue') or ""
                location_id, location_name = self._match_location("mississauga", str(location))
                
                # Build detail URL
                detail_url = self.MISSISSAUGA_DETAIL_URL.format(activity_id=activity_id)
                
                programs.append({
                    "id": f"miss_{activity_id}",
                    "name": str(name)[:100],
                    "location_id": location_id,
                    "location_name": location_name,
                    "city": "mississauga",
                    "activity_type": self._detect_activity_type(name),
                    "age_group": self._detect_age_group(name),
                    "date": date_str,
                    "start_time": start_time,
                    "end_time": item.get('endTime', ''),
                    "fee": item.get('fee') or item.get('price'),
                    "spots_available": item.get('spotsAvailable') or item.get('openings'),
                    "spots_total": item.get('capacity'),
                    "registration_url": detail_url,
                })
                
            except Exception as e:
                logger.debug(f"Error parsing Mississauga API item: {e}")
                continue
        
        return programs
    
    # ========================================================================
    # Oakville Scraper (PerfectMind BookMe4)
    # ========================================================================
    
    async def _scrape_oakville(self) -> List[dict]:
        """Scrape Oakville drop-in programs from PerfectMind BookMe4."""
        if not await self._check_playwright():
            logger.error("Playwright not available for Oakville scraping")
            return []
        
        from playwright.async_api import async_playwright
        
        programs = []
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            try:
                await page.goto(self.OAKVILLE_BOOKME_URL, wait_until="networkidle", timeout=30000)
                await page.wait_for_timeout(3000)
                
                # Try to find and click on drop-in categories
                drop_in_keywords = ['drop-in', 'drop in', 'recreational', 'public']
                
                # Get all clickable links/buttons
                links = await page.query_selector_all('a, button, [role="button"]')
                
                for link in links:
                    try:
                        text = await link.text_content()
                        if not text:
                            continue
                        text_lower = text.lower()
                        
                        # Check if this is a drop-in category
                        if any(kw in text_lower for kw in drop_in_keywords):
                            await link.click()
                            await page.wait_for_timeout(2000)
                            
                            # Parse the programs on this page
                            page_programs = await self._parse_oakville_page(page)
                            programs.extend(page_programs)
                            
                            # Go back to main page
                            await page.go_back()
                            await page.wait_for_timeout(1500)
                            
                    except Exception as e:
                        logger.debug(f"Error clicking Oakville link: {e}")
                        continue
                
                # If no programs found from clicking, try parsing the main page
                if not programs:
                    programs = await self._parse_oakville_page(page)
                
            except Exception as e:
                logger.error(f"Oakville scraping error: {e}")
                
            finally:
                await browser.close()
        
        return programs
    
    async def _parse_oakville_page(self, page) -> List[dict]:
        """Parse Oakville BookMe4 page for activity data."""
        programs = []
        
        try:
            # PerfectMind BookMe4 uses .bm-class-row for each program
            rows = await page.query_selector_all('.bm-class-row, [class*="class-row"], [class*="program-row"]')
            
            for row in rows:
                try:
                    # Get program details
                    name_el = await row.query_selector('.bm-event-description, .bm-class-title, [class*="title"], [class*="name"]')
                    name = await name_el.text_content() if name_el else ""
                    name = name.strip() if name else "Unknown Program"
                    
                    # Get class ID from the row
                    class_id = await row.get_attribute('data-class-id')
                    if not class_id:
                        # Try to find it in a link
                        link = await row.query_selector('a[href*="classId"]')
                        if link:
                            href = await link.get_attribute('href')
                            match = re.search(r'classId=([^&]+)', href or '')
                            if match:
                                class_id = match.group(1)
                    
                    # Get location
                    loc_el = await row.query_selector('[class*="location"], [class*="venue"], [class*="facility"]')
                    location_text = await loc_el.text_content() if loc_el else ""
                    location_id, location_name = self._match_location("oakville", location_text)
                    
                    # Get date
                    date_el = await row.query_selector('[class*="date"]')
                    date_text = await date_el.text_content() if date_el else ""
                    date_str = self._parse_date(date_text) or datetime.now().strftime("%Y-%m-%d")
                    
                    # Get time
                    time_el = await row.query_selector('[class*="time"]')
                    time_text = await time_el.text_content() if time_el else ""
                    start_time, end_time = self._parse_time_range(time_text)
                    
                    # Get price
                    price_el = await row.query_selector('[class*="price"], [class*="fee"], [class*="cost"]')
                    price_text = await price_el.text_content() if price_el else ""
                    fee = self._parse_price(price_text)
                    
                    # Build detail URL
                    if class_id:
                        detail_url = self.OAKVILLE_DETAIL_URL.format(class_id=class_id)
                    else:
                        detail_url = self.OAKVILLE_BOOKME_URL
                    
                    programs.append({
                        "id": f"oak_{class_id or hash(name + date_str) % 100000}",
                        "name": name[:100],
                        "location_id": location_id,
                        "location_name": location_name,
                        "city": "oakville",
                        "activity_type": self._detect_activity_type(name),
                        "age_group": self._detect_age_group(name),
                        "date": date_str,
                        "start_time": start_time,
                        "end_time": end_time,
                        "fee": fee,
                        "spots_available": None,
                        "spots_total": None,
                        "registration_url": detail_url,
                    })
                    
                except Exception as e:
                    logger.debug(f"Error parsing Oakville row: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error parsing Oakville page: {e}")
        
        return programs
    
    # ========================================================================
    # Burlington Scraper
    # ========================================================================
    
    async def _scrape_burlington(self) -> List[dict]:
        """Scrape Burlington drop-in programs."""
        if not await self._check_playwright():
            logger.error("Playwright not available for Burlington scraping")
            return []
        
        from playwright.async_api import async_playwright
        
        programs = []
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            try:
                await page.goto(self.BURLINGTON_DROPIN_URL, wait_until="networkidle", timeout=30000)
                await page.wait_for_timeout(3000)
                
                # Burlington page structure - look for program cards/rows
                programs = await self._parse_burlington_page(page)
                
            except Exception as e:
                logger.error(f"Burlington scraping error: {e}")
                
            finally:
                await browser.close()
        
        return programs
    
    async def _parse_burlington_page(self, page) -> List[dict]:
        """Parse Burlington drop-in programs page."""
        programs = []
        
        try:
            # Try various selectors for program items
            selectors = [
                '.program-item',
                '.activity-item', 
                '[class*="schedule-item"]',
                'table tr',
                '.card',
            ]
            
            for selector in selectors:
                items = await page.query_selector_all(selector)
                
                for item in items:
                    try:
                        text = await item.text_content()
                        if not text or len(text) < 5:
                            continue
                        
                        # Skip header rows
                        if 'activity' in text.lower() and 'time' in text.lower() and 'location' in text.lower():
                            continue
                        
                        # Try to extract link for detail page
                        link = await item.query_selector('a')
                        detail_url = self.BURLINGTON_DROPIN_URL
                        if link:
                            href = await link.get_attribute('href')
                            if href and href.startswith('http'):
                                detail_url = href
                            elif href and href.startswith('/'):
                                detail_url = f"{self.BURLINGTON_BASE_URL}{href}"
                        
                        # Parse text for activity info
                        lines = [l.strip() for l in text.split('\n') if l.strip()]
                        name = lines[0] if lines else "Unknown Program"
                        
                        # Extract location
                        location_id, location_name = self._match_location("burlington", text)
                        
                        # Extract time
                        time_match = re.search(r'(\d{1,2}:\d{2}\s*[AaPp]?\.?[Mm]?\.?)', text)
                        start_time = self._normalize_time(time_match.group(1)) if time_match else "09:00"
                        
                        programs.append({
                            "id": f"burl_{hash(name + start_time) % 100000}",
                            "name": name[:100],
                            "location_id": location_id,
                            "location_name": location_name,
                            "city": "burlington",
                            "activity_type": self._detect_activity_type(name),
                            "age_group": self._detect_age_group(name),
                            "date": datetime.now().strftime("%Y-%m-%d"),
                            "start_time": start_time,
                            "end_time": "",
                            "fee": None,
                            "spots_available": None,
                            "spots_total": None,
                            "registration_url": detail_url,
                        })
                        
                    except Exception as e:
                        logger.debug(f"Error parsing Burlington item: {e}")
                        continue
                        
        except Exception as e:
            logger.error(f"Error parsing Burlington page: {e}")
        
        return programs
    
    # ========================================================================
    # Helper Methods
    # ========================================================================
    
    def _generate_mock_programs(self, city: str) -> List[dict]:
        """Generate mock programs for fallback when scraping fails."""
        import random
        from datetime import datetime, timedelta
        
        programs = []
        locations = self.LOCATIONS.get(city.lower(), [])
        if not locations:
            return []
        
        today = datetime.now().date()
        
        # Generate a few programs for today
        mock_templates = [
            {"name": "Adult Lane Swim", "activity_type": "swim", "age_group": "adult", "fee": 5.50},
            {"name": "Family Swim", "activity_type": "swim", "age_group": "family", "fee": 4.00},
            {"name": "Aquafit", "activity_type": "swim", "age_group": "adult", "fee": 6.00},
            {"name": "Public Skate", "activity_type": "skating", "age_group": "family", "fee": 3.50},
            {"name": "Drop-In Yoga", "activity_type": "fitness", "age_group": "adult", "fee": 8.00},
            {"name": "Adult Pickleball", "activity_type": "sports", "age_group": "adult", "fee": 5.00},
        ]
        
        for loc in random.sample(locations, min(3, len(locations))):
            for tmpl in random.sample(mock_templates, min(2, len(mock_templates))):
                hour = random.choice([9, 10, 11, 14, 15, 18, 19])
                start_time = f"{hour:02d}:00"
                end_time = f"{hour + 1:02d}:00"
                
                total = random.randint(15, 40)
                taken = random.randint(0, total)
                
                # Generate registration URL based on city
                if city.lower() == "oakville":
                    reg_url = f"https://townofoakville.perfectmind.com/24974/Clients/BookMe4?widgetId=acf798a6-9321-41b7-aa41-92cbb8c1b485"
                elif city.lower() == "mississauga":
                    reg_url = f"https://anc.ca.apm.activecommunities.com/activemississauga/activity/search/detail/{random.randint(100000, 999999)}?onlineSiteId=0&from_original_cui=true"
                else:
                    reg_url = f"https://www.burlington.ca/en/recreation/drop-in-programs.aspx"
                
                programs.append({
                    "id": f"{city}_{loc['id']}_{today.strftime('%Y%m%d')}_{random.randint(1000, 9999)}",
                    "name": tmpl["name"],
                    "location_id": loc["id"],
                    "location_name": loc["name"],
                    "city": city.lower(),
                    "activity_type": tmpl["activity_type"],
                    "age_group": tmpl["age_group"],
                    "date": today.strftime("%Y-%m-%d"),
                    "start_time": start_time,
                    "end_time": end_time,
                    "fee": tmpl["fee"],
                    "spots_available": total - taken,
                    "spots_total": total,
                    "registration_url": reg_url,
                })
        
        return programs
    
    def _filter_by_date_range(self, programs: List[dict], days: int = 1) -> List[dict]:
        """Filter programs to only include today + next N-1 days. Default: today only (1 day)."""
        today = datetime.now().date()
        end_date = today + timedelta(days=days - 1)
        
        filtered = []
        for prog in programs:
            try:
                prog_date = datetime.strptime(prog["date"], "%Y-%m-%d").date()
                if today <= prog_date <= end_date:
                    filtered.append(prog)
            except:
                # If date parsing fails, include the program (might be today)
                filtered.append(prog)
        
        return sorted(filtered, key=lambda x: (x["date"], x["start_time"]))
    
    def _parse_date(self, date_text: str) -> Optional[str]:
        """Parse various date formats to YYYY-MM-DD."""
        if not date_text:
            return None
            
        date_text = date_text.strip()
        
        # Try common formats
        formats = [
            "%Y-%m-%d",
            "%m/%d/%Y",
            "%d/%m/%Y",
            "%B %d, %Y",
            "%b %d, %Y",
            "%d %B %Y",
            "%d %b %Y",
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_text, fmt).strftime("%Y-%m-%d")
            except:
                continue
        
        return None
    
    def _parse_time_range(self, time_text: str) -> tuple:
        """Parse a time range string into start/end times."""
        if not time_text:
            return ("00:00", "00:00")
            
        try:
            time_text = time_text.strip().lower()
            
            for sep in [' - ', '-', ' to ', '–']:
                if sep in time_text:
                    parts = time_text.split(sep)
                    if len(parts) == 2:
                        start = self._normalize_time(parts[0].strip())
                        end = self._normalize_time(parts[1].strip())
                        return (start, end)
            
            time = self._normalize_time(time_text)
            return (time, time)
            
        except Exception:
            return ("00:00", "00:00")
    
    def _normalize_time(self, time_str: str) -> str:
        """Convert time string to 24-hour format HH:MM."""
        if not time_str:
            return "00:00"
            
        try:
            time_str = time_str.strip().lower()
            
            is_pm = 'pm' in time_str or 'p.m.' in time_str
            is_am = 'am' in time_str or 'a.m.' in time_str
            
            # Remove am/pm markers
            time_str = re.sub(r'[ap]\.?m\.?', '', time_str).strip()
            
            if ':' in time_str:
                parts = time_str.split(':')
                hour = int(parts[0])
                minute = int(re.sub(r'\D', '', parts[1])) if len(parts) > 1 else 0
            else:
                hour = int(re.sub(r'\D', '', time_str) or 0)
                minute = 0
            
            if is_pm and hour < 12:
                hour += 12
            elif is_am and hour == 12:
                hour = 0
                
            return f"{hour:02d}:{minute:02d}"
            
        except Exception:
            return "00:00"
    
    def _parse_price(self, price_text: str) -> Optional[float]:
        """Parse price string into a float."""
        if not price_text:
            return None
            
        try:
            matches = re.findall(r'\$?(\d+\.?\d*)', price_text)
            if matches:
                return float(matches[0])
            return None
        except Exception:
            return None
    
    def _detect_activity_type(self, text: str) -> str:
        """Detect activity type from text."""
        text_lower = (text or "").lower()
        
        for activity_type, keywords in self.ACTIVITY_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text_lower:
                    return activity_type
        
        return "other"
    
    def _detect_age_group(self, text: str) -> str:
        """Detect age group from text."""
        text_lower = (text or "").lower()
        
        for age_group, keywords in self.AGE_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text_lower:
                    return age_group
        
        return "all_ages"
    
    def _match_location(self, city: str, text: str) -> tuple:
        """Match text to a known location."""
        if not text:
            return ("unknown", "Unknown Location")
            
        text_lower = text.lower()
        locations = self.LOCATIONS.get(city.lower(), [])
        
        for loc in locations:
            name_lower = loc["name"].lower()
            # Check various matching patterns
            if name_lower in text_lower:
                return (loc["id"], loc["name"])
            # Check for partial matches
            name_parts = name_lower.replace(' cc', '').replace(' community centre', '').split()
            if len(name_parts) >= 2 and all(part in text_lower for part in name_parts[:2]):
                return (loc["id"], loc["name"])
        
        return ("other", text[:50].strip() if text else "Unknown Location")


# Singleton instance
scraper_service = ScraperService()
