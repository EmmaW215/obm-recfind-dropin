"""Programs API"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from datetime import date, timedelta
from pydantic import BaseModel

router = APIRouter()

class ProgramResponse(BaseModel):
    id: str
    name: str
    location_id: str
    location_name: str
    city: str
    activity_type: str
    age_group: str
    date: str
    start_time: str
    end_time: str
    fee: Optional[float] = None
    spots_available: Optional[int] = None
    spots_total: Optional[int] = None
    registration_url: Optional[str] = None

@router.get("")
async def search_programs(
    # Accept both single city and multiple cities
    city: Optional[str] = Query(None, description="Single city filter"),
    cities: Optional[List[str]] = Query(None, description="Multiple cities filter"),
    # Location filters
    locations: Optional[List[str]] = Query(None, description="Location IDs"),
    location_id: Optional[str] = Query(None, description="Single location ID"),
    # Activity filters
    activityTypes: Optional[List[str]] = Query(None, description="Activity types"),
    activity: Optional[str] = Query(None, description="Single activity type"),
    # Age group filters
    ageGroups: Optional[List[str]] = Query(None, description="Age groups"),
    age_group: Optional[str] = Query(None, description="Single age group"),
    # Date filters
    dateFrom: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    dateTo: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    # Pagination
    limit: int = Query(50, le=100),
):
    """Search for drop-in programs with flexible filters"""
    from app.services.scraper_service import scraper_service
    
    # Determine which cities to query
    city_list = []
    if cities:
        city_list = [c.lower() for c in cities]
    elif city:
        city_list = [city.lower()]
    else:
        # Default: query all cities
        city_list = ["oakville", "burlington", "mississauga"]
    
    # Fetch programs from all requested cities
    all_programs = []
    for c in city_list:
        try:
            programs = await scraper_service.get_programs(c)
            all_programs.extend(programs)
        except Exception as e:
            print(f"Error fetching programs for {c}: {e}")
            continue
    
    # Apply location filter
    location_filter = locations or ([location_id] if location_id else None)
    if location_filter:
        all_programs = [p for p in all_programs if p.get("location_id") in location_filter]
    
    # Apply activity type filter
    activity_filter = activityTypes or ([activity] if activity else None)
    if activity_filter:
        all_programs = [p for p in all_programs if p.get("activity_type") in activity_filter]
    
    # Apply age group filter
    age_filter = ageGroups or ([age_group] if age_group else None)
    if age_filter:
        all_programs = [p for p in all_programs if p.get("age_group") in age_filter]
    
    # Apply date range filter
    if dateFrom:
        all_programs = [p for p in all_programs if p.get("date", "") >= dateFrom]
    if dateTo:
        all_programs = [p for p in all_programs if p.get("date", "") <= dateTo]
    
    # Deduplicate by ID (keep first occurrence)
    seen_ids = set()
    unique_programs = []
    for p in all_programs:
        pid = p.get("id")
        if pid and pid not in seen_ids:
            seen_ids.add(pid)
            unique_programs.append(p)
    all_programs = unique_programs
    
    # Sort by date and time
    all_programs.sort(key=lambda x: (x.get("date", ""), x.get("start_time", "")))
    
    # Apply limit
    result = all_programs[:limit]
    
    return {
        "total": len(result),
        "programs": result
    }

@router.get("/debug/{city}")
async def debug_scraper(
    city: str, 
    use_cache: bool = Query(False, description="Use cached data"),
    show_raw: bool = Query(True, description="Show raw scraped data (before filtering)")
):
    """Debug endpoint to see raw scraped data for a city"""
    from app.services.scraper_service import scraper_service
    
    city = city.lower()
    if city not in ["oakville", "burlington", "mississauga"]:
        raise HTTPException(status_code=400, detail=f"Invalid city: {city}")
    
    try:
        if show_raw:
            # Get raw data (before date filtering)
            raw_data = await scraper_service.get_raw_programs(city, use_cache=use_cache)
            programs = raw_data["raw_programs"]
            filtered_programs = raw_data["filtered_programs"]
            scrape_status = raw_data["scrape_status"]
        else:
            # Get filtered programs (normal API behavior)
            programs = await scraper_service.get_programs(city, use_cache=use_cache)
            filtered_programs = programs
            scrape_status = "filtered"
        
        # Analyze the data
        stats = {
            "total_programs": len(programs),
            "filtered_programs": len(filtered_programs) if show_raw else len(programs),
            "by_location": {},
            "by_activity_type": {},
            "by_age_group": {},
            "date_range": {
                "earliest": None,
                "latest": None,
            },
            "sample_program": programs[0] if programs else None,
        }
        
        # Count by location
        for prog in programs:
            loc = prog.get("location_name", "Unknown")
            stats["by_location"][loc] = stats["by_location"].get(loc, 0) + 1
        
        # Count by activity type
        for prog in programs:
            act = prog.get("activity_type", "other")
            stats["by_activity_type"][act] = stats["by_activity_type"].get(act, 0) + 1
        
        # Count by age group
        for prog in programs:
            age = prog.get("age_group", "family")
            stats["by_age_group"][age] = stats["by_age_group"].get(age, 0) + 1
        
        # Find date range
        dates = [p.get("date") for p in programs if p.get("date")]
        if dates:
            stats["date_range"]["earliest"] = min(dates)
            stats["date_range"]["latest"] = max(dates)
        
        result = {
            "city": city,
            "use_cache": use_cache,
            "show_raw": show_raw,
            "scrape_status": scrape_status if show_raw else "filtered",
            "statistics": stats,
            "all_programs": programs,
            "total_count": len(programs),
        }
        
        if show_raw:
            result["filtered_programs"] = filtered_programs
            result["filtered_count"] = len(filtered_programs)
        
        return result
    except Exception as e:
        import traceback
        return {
            "city": city,
            "error": str(e),
            "traceback": traceback.format_exc(),
        }

@router.get("/{program_id}")
async def get_program(program_id: str):
    """Get program details"""
    return {"id": program_id, "name": "Program Details", "message": "Full details here"}
