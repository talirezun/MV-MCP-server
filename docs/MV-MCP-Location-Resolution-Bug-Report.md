# MV Travel MCP — Location Resolution Bug: Diagnosis & Resolution

**Status:** ✅ **RESOLVED** in v2.1.0 (2026-03-12)
**Document type:** Coding Agent Brief
**Date:** 2026-03-12
**Author:** Tali Režun / Generated via live diagnostic session with Claude
**Resolution:** Strategy reordering (resort→city→skiarea→region) + cross-border validation
**Repo:** https://github.com/talirezun/MV-MCP-server
**API Docs:** https://api.mountvacation.com/docs

---

## 1. Executive Summary

The MV Travel MCP server fails to resolve a significant subset of valid European mountain resort names into search results, even though the underlying MV Travel API contains full data for those locations. The root cause is a **missing or incomplete location-name-to-numeric-ID resolution layer** in the MCP.

When a user provides a location name like `"Katschberg"`, the MCP either fails silently or falls back to a generic country-level search, returning zero relevant results. In contrast, when the correct numeric resort ID (`9146`) is passed directly to the API, all 13 available properties are returned correctly.

The same API powers the MV Travel website search, which does resolve "Katschberg" correctly — because the website already knows the resort ID and embeds it in the URL as `?resort=9146`.

**Impact:** Any resort, city, or region that is not already in the MCP's internal mapping (if one exists) is effectively invisible to end users — producing the false impression that no accommodation exists there.

---

## 2. Background: API Architecture

The MV Travel API exposes a strict **hierarchical geographic taxonomy**:

```
Countries  →  Regions  →  Ski Areas  →  Resorts  →  Cities
```

All endpoints under `/accommodations/search` require **numeric IDs** for location filtering. The API does **not** accept free-text location names as search parameters. The relevant parameters are:

| Parameter | Type | Description |
|-----------|------|-------------|
| `resort` | integer | Resort ID (e.g., `9146` for Katschberg) |
| `city` | integer | City ID |
| `region` | integer | Region ID |
| `skiArea` | integer | Ski area ID |
| `dmo` | integer | DMO ID |

Free-text name resolution must therefore happen **before** the accommodation search call — by querying the separate geography endpoints:

| Endpoint | Purpose |
|----------|---------|
| `GET /resorts` | Returns all resorts; filterable by region, country, type |
| `GET /cities` | Returns all cities; filterable by resort, region |
| `GET /regions` | Returns all regions |
| `GET /skiareas` | Returns all ski areas |

Each of these endpoints returns objects with both a numeric `id` and a human-readable `title`, enabling name-to-ID lookup.

---

## 3. Live Testing Evidence

### 3.1 Test Case: Katschberg, Austria

**User's web search URL (working):**
```
https://mv-travel.eu/en/austria/katschberg?arrival=2026-03-22&departure=2026-03-29&personsAges=30&personsAges=30&resort=9146
```
Result: **13 properties returned** ✅

**MCP `search_accommodations(location="Katschberg")` call:** 0 results ❌

**MCP `search_by_resort_id(resort_id=9146)` call:** 13 properties returned ✅

**MCP geolocation fallback `(lat=47.0595, lng=13.6097, radius=30000)`:** 0 results ❌

**Conclusion:** The API has the data. The resort exists (ID `9146`). The MCP simply cannot map the name `"Katschberg"` to this ID.

### 3.2 Confirmed Working Locations (MCP resolves correctly)

| Location | Results |
|----------|---------|
| Novigrad, Croatia | 18 ✅ |
| Portorož, Slovenia | 5 ✅ |
| Trentino, Italy | 6 ✅ |
| Lago di Como, Italy | 2 ✅ |

### 3.3 Confirmed Failing Locations

| Location | MCP Results | Expected | Resort/City ID |
|----------|-------------|----------|----------------|
| Katschberg, Austria | 0 ❌ | 13 | resort `9146` |
| Terme Čatež, Slovenia | 0 ❌ | Unknown | Unknown — same class of problem |
| Livigno, Italy | 0 ❌ | Unknown | Likely valid resort ID exists |
| Bormio, Italy | 0 ❌ | Unknown | Likely valid resort ID exists |
| Madesimo, Italy | 0 ❌ | Unknown | Likely valid resort ID exists |

### 3.4 Austria Broad Search Reveals Coverage Bias

Running `search_accommodations(location="Austria")` returned results **only from Tirol and partial Salzburg region** (Kitzbühel, Zillertal, Mayrhofen, Söll, Seefeld, Ischgl). Katschberg, which sits on the Salzburg/Carinthia border, was completely absent — confirming the issue is at the location resolution layer, not data availability.

---

## 4. Root Cause Analysis

### ⚠️ Critical Observation: Most Searches Work Fine

Before diagnosing the failure, it is essential to note that the MCP **successfully resolves many locations** — including Novigrad (18 results), Portorož (5 results), Como, Tremezzo, and others. This means the location resolution layer is **not globally broken**. This rules out a missing ID resolution system entirely.

The correct question is: **why does resolution work for some names and fail for others?**

### Primary Root Cause: City Resolver Works, Resort Resolver Does Not

The MV Travel API has two distinct geographic entity types that a user might name:

| Entity type | API endpoint | Example |
|---|---|---|
| **City** | `GET /cities` | Novigrad, Portorož, Como, Tremezzo |
| **Resort** | `GET /resorts` | Katschberg, Terme Čatež, Livigno |

The critical distinction: **a Resort is a grouping of multiple cities/villages** under a common brand or ski area. "Katschberg" is a resort spanning St. Michael im Lungau, Rennweg, Mauterndorf, and Mariapfarr — none of which are named "Katschberg". The name "Katschberg" only exists in the `/resorts` endpoint, not in `/cities`.

**Working locations (Novigrad, Portorož)** are city-level names — they appear in `/cities` and are resolved correctly by the MCP's existing city-based lookup.

**Failing locations (Katschberg)** are resort-level names — they only exist in `/resorts`, which the MCP's location resolver does not appear to query.

This is confirmed by the live test results:

```
GET /cities  → search for "Katschberg" → NOT FOUND (no city named Katschberg)
GET /resorts → search for "Katschberg" → FOUND: id=9146 ✅
```

The MCP resolves against cities but **not against resorts** — and silently returns 0 results when no matching city is found, rather than falling back to a resort lookup.

### Secondary Root Cause: Geolocation Fallback Not Working for Katschberg

The geolocation-based search (`lat=47.0595, lng=13.6097, radius=30000`) also returned 0 results for Katschberg, even though the API includes properties with coordinates clearly within that bounding box. Since `/cities` returns lat/lng per city, the geolocation resolver likely attempts to find a city near those coordinates and search by city ID — but may have a radius, projection, or distance threshold issue that silently excludes the result.

### Tertiary Cause: No Graceful Fallback or User Feedback

When resolution fails, the MCP returns empty results without informing the user that the location exists at the resort level, not the city level. A message like "No city named 'Katschberg' found — did you mean the Katschberg resort (ID: 9146)?" would immediately improve the experience.

---

## 5. API Endpoints Available for Resolution (Not Currently Used)

The following API endpoints are available and should be integrated into a location resolution flow:

### 5.1 `GET /resorts`

Supports filtering by: `resort`, `resorts`, `skiarea`, `region`, `country`, `ski`, `lake`, `sea`, `thermal`, `changedSince`.

**Returns:**
```json
{
  "resorts": [
    {
      "id": 9146,
      "title": "Katschberg",
      "regionID": 1191,
      "region": { "en": "Carinthia", "de": "Kärnten" },
      "countryID": 1,
      "countryCode": "AT",
      "isSkiResort": true,
      "active": true
    }
  ]
}
```

The `title` field can be matched against a user-supplied location string.

### 5.2 `GET /cities`

Supports filtering by: `city`, `resort`, `region`, `country`. Returns `latitude` and `longitude` per city — enabling reverse geolocation matching.

### 5.3 `GET /regions`

Supports filtering by: `region`, `country`.

### 5.4 `GET /skiareas`

Supports filtering by: `skiarea`, `region`, `country`.

---

## 6. Proposed Solution Architecture

### 6.1 The Precise Fix Required

Since city-level resolution **already works**, the fix is targeted and surgical: **add resort-level resolution as a fallback** when city resolution returns no match.

The resolution order should be:

```
Input: location string (e.g., "Katschberg")
  │
  ├─ Step 1: Try existing city resolver (already working ✅)
  │    └─ if city found → search by city ID (current behaviour)
  │
  ├─ Step 2: [NEW] Try resort resolver
  │    └─ Query GET /resorts (cache result)
  │    └─ fuzzy-match title against input (all language variants)
  │    └─ if resort found → search by resort ID
  │
  ├─ Step 3: [NEW] Try region resolver
  │    └─ Query GET /regions (cache result)
  │    └─ fuzzy-match title (en, de, it, fr, sl, hr variants)
  │    └─ if region found → search by region ID
  │
  ├─ Step 4: Country-level fallback (may already exist)
  │
  └─ Step 5: Fail gracefully with informative message
       └─ "Location 'Katschberg' not found as a city. 
           Did you mean the Katschberg ski resort? 
           If so, try searching with resort_id=9146."
```

### 6.2 Why This Is a Small Change

The city resolver is already functional. Adding resort resolution requires:

1. **One new API call** at session start: `GET /resorts` — returns all resorts with names and IDs
2. **One new lookup function** — fuzzy-match input against resort titles (same logic as existing city matcher)
3. **Wire into existing fallback chain** — only triggered when city resolution returns no match

### 6.3 Caching Strategy

The resort data is largely static. Fetch and cache at session start:

```javascript
// Module-level cache (Cloudflare Workers compatible)
let resortIndex = null;  // Map<normalizedName, resortId>

async function getResortIndex() {
  if (resortIndex) return resortIndex;
  const data = await fetch('https://api.mountvacation.com/resorts', { headers: AUTH });
  resortIndex = new Map(
    data.resorts.map(r => [normalize(r.title), r.id])
  );
  return resortIndex;
}
```

### 6.4 Fuzzy Matching Strategy

Simple exact match will fail for:
- Diacritics: `"Catez"` vs `"Čatež"`
- Partial names: `"Katschberg Austria"` vs `"Katschberg"`
- Multilingual: `"Carinthia"` vs `"Kärnten"` (regions have multilingual `title` objects)

Recommended approach:
1. **Normalize:** strip diacritics, lowercase, trim
2. **Exact match:** try normalized input vs normalized title
3. **Contains match:** check if normalized input is a substring of title (or vice versa)
4. **Multilingual match:** for regions, check all language variants in the `title` object

```javascript
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strip diacritics
    .trim();
}
```

---

## 7. Specific Fix for Katschberg (Immediate / Quick Win)

While building the full dynamic resolver, a quick fix can unblock Katschberg immediately:

**Option A — Add to a static known-resorts map:**
```javascript
const KNOWN_RESORT_IDS = {
  'katschberg': 9146,
  'terme catez': XXXX,   // TBD — query /resorts to find
  'livigno': XXXX,       // TBD
  'bormio': XXXX,        // TBD
  // ... other known gaps
};
```

**Option B — Implement dynamic `/resorts` query (preferred, covers all future gaps):**
The dynamic approach described in Section 6 is the correct long-term fix and requires only 1-2 additional API calls at session initialization.

---

## 8. Additional Improvements Identified During Testing

### 8.1 Pagination Is Working but Should Be Transparent

The `load_more_accommodations` tool works correctly. However, the initial `search_by_resort_id` call only returned 2 results per page — requiring 5 additional pagination calls to retrieve all 13 Katschberg properties. Consider:
- Increasing default page size in the API request if the API supports it
- Auto-paginating internally and returning all results in one response

### 8.2 Geolocation Search Needs Investigation

The geolocation-based fallback returned 0 results for valid Katschberg coordinates (`47.0595, 13.6097`). This path should be validated independently:
- Confirm the API endpoint being called supports lat/lng + radius
- Check if the MCP is using `/accommodations/search` or a different endpoint for geolocation
- If the endpoint doesn't support geolocation natively, consider using `/cities` (which returns lat/lng per city) to find the nearest city ID, then searching by city ID

### 8.3 Austria Coverage Bias

Broad `"Austria"` searches currently return only Tirol + partial Salzburg results. This is probably because the MCP resolves `"Austria"` to a country-level search but paginates insufficiently, missing Carinthia and Lungau resorts. Full pagination should be enforced before returning results.

### 8.4 Terme Čatež / Thermal Resorts

`"Terme Čatež"` returned 0 results. This is a known Slovenian thermal resort. It may exist under a different resort name in the API (e.g., `"Čatež ob Savi"`). The resolution layer should query `/resorts?thermal=true&country=<Slovenia_ID>` as a fallback for thermal resort queries.

---

## 9. Files to Modify

Based on the GitHub repository structure:

| File | Change Required |
|------|----------------|
| `server-versions/mountvacation-mcp-server.js` | Add `resolveLocationToIds()` function; wire into `search_accommodations` handler |
| `cloudflare-workers/` (main worker file) | Same resolution logic, adapted for Cloudflare Workers module syntax; add module-level geography cache variables |

---

## 10. Test Cases for Validation

After implementing the fix, the coding agent should validate all of the following:

| Test Case | Input | Expected Output |
|-----------|-------|----------------|
| Katschberg exact | `location="Katschberg"` | ≥13 results, resort_id=9146 |
| Katschberg + country | `location="Katschberg Austria"` | ≥13 results |
| Diacritic handling | `location="Terme Catez"` (no diacritic) | Results for Terme Čatež |
| Diacritic handling | `location="Terme Čatež"` (with diacritic) | Results for Terme Čatež |
| Italian Alps specific | `location="Livigno"` | Results if resort exists in DB |
| Region-level | `location="Carinthia"` | All Carinthia resorts |
| Already-working | `location="Novigrad"` | ≥18 results (regression test) |
| Already-working | `location="Portorož"` | ≥5 results (regression test) |
| Direct ID bypass | `resort_id=9146` | ≥13 results (existing tool, must still work) |
| Unknown location | `location="XYZ123"` | Graceful error message, not empty array |

---

## 11. Summary of Changes for Coding Agent

```
PRECISE ROOT CAUSE:
  The MCP resolves location names against the /cities API endpoint.
  This works correctly when the user's location string matches a city name
  (e.g., "Novigrad", "Portorož", "Como" → all cities in the database ✅).
  
  "Katschberg" is NOT a city — it is a RESORT that spans multiple villages
  (St. Michael im Lungau, Rennweg, Mauterndorf, Mariapfarr). The name 
  "Katschberg" only exists in the /resorts endpoint.
  
  The MCP does not query /resorts during location resolution, so any 
  resort-level name silently returns 0 results.

EVIDENCE:
  /cities  → "Katschberg" → NOT FOUND ❌
  /resorts → "Katschberg" → FOUND: id=9146 ✅
  search_by_resort_id(resort_id=9146) → 13 results ✅
  search_accommodations(location="Novigrad") → 18 results ✅ (city name)

REQUIRED CHANGE (targeted and small):
  Add resort-level resolution as a fallback in the location resolver:
  
  1. After city resolution fails → query GET /resorts (cache it)
  2. Fuzzy-match user input against resort titles (with diacritic normalization)
  3. If resort match found → call search_by_resort_id() with resolved resort ID
  4. Also add region fallback (GET /regions) for area-level queries
  5. Fail gracefully with informative message if all resolution fails

WHAT DOES NOT NEED TO CHANGE:
  - City resolution (already working)
  - search_by_resort_id tool (already working)
  - Pagination logic (already working)
  - All other MCP tools

PRIORITY: High — affects any resort-named destination (common for ski resorts)
EFFORT ESTIMATE: Small — add one fallback step after existing city resolver fails
FILES: mountvacation-mcp-server.js, cloudflare-workers/[main worker file]
```

---

*Document prepared from live API testing session on 2026-03-12. All test results are from direct MCP tool calls against the live MV Travel API with real search parameters (arrival: 2026-03-22, departure: 2026-03-29, 2 adults).*
