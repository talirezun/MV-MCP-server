#!/usr/bin/env python3
"""
Find location IDs that might cover Italian Dolomites
"""

import os
import requests
from dotenv import load_dotenv
import time

load_dotenv()

def find_dolomites_locations():
    """Search for location IDs that might have Dolomites accommodations"""
    
    api_key = os.getenv('MOUNTVACATION_API_KEY')
    base_url = 'https://api.mountvacation.com/accommodations/search/'
    arrival = '2025-12-15'
    departure = '2025-12-18'
    
    print("🔍 Searching for Italian Dolomites locations...")
    print("=" * 50)
    
    # Test ranges of IDs to find Italian locations
    id_ranges = [
        ('resort', range(1, 51)),      # Resort IDs 1-50
        ('city', range(1, 101)),       # City IDs 1-100  
        ('skiarea', range(1, 21)),     # Ski Area IDs 1-20
        ('region', range(1, 21))       # Region IDs 1-20
    ]
    
    italian_locations = []
    
    for id_type, id_range in id_ranges:
        print(f"\n🧪 Testing {id_type} IDs...")
        
        for location_id in id_range:
            try:
                params = {
                    id_type: str(location_id),
                    'arrival': arrival,
                    'departure': departure,
                    'personsAges': '30,28',
                    'currency': 'EUR',
                    'apiKey': api_key
                }
                
                response = requests.get(base_url, params=params, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    accommodations = data.get('accommodations', [])
                    
                    if accommodations:
                        # Check if any accommodations are in Italy
                        for acc in accommodations:
                            country = acc.get('country', '').lower()
                            city = acc.get('city', '').lower()
                            title = acc.get('title', '').lower()
                            
                            # Look for Italian locations or Dolomites-related terms
                            italian_terms = ['italy', 'italia', 'dolomiti', 'dolomites', 'alto adige', 
                                           'south tyrol', 'trentino', 'cortina', 'selva', 'ortisei',
                                           'corvara', 'colfosco', 'canazei', 'val gardena', 'alta badia']
                            
                            is_italian = (country == 'italy' or country == 'italia' or 
                                        any(term in city for term in italian_terms) or
                                        any(term in title for term in italian_terms))
                            
                            if is_italian:
                                location_info = {
                                    'id_type': id_type,
                                    'id': location_id,
                                    'count': len(accommodations),
                                    'sample_accommodation': {
                                        'title': acc.get('title', 'N/A'),
                                        'city': acc.get('city', 'N/A'),
                                        'country': acc.get('country', 'N/A'),
                                        'price': acc.get('offers', [{}])[0].get('price', 'N/A') if acc.get('offers') else 'N/A'
                                    }
                                }
                                
                                if location_info not in italian_locations:
                                    italian_locations.append(location_info)
                                    print(f"   ✅ {id_type.upper()} {location_id}: {acc.get('title')} in {acc.get('city')}, {acc.get('country')}")
                                
                                break  # Found Italian location for this ID
                
                # Small delay to avoid rate limiting
                time.sleep(0.1)
                
            except Exception as e:
                continue  # Skip errors and continue searching
    
    # Display results
    print(f"\n📊 Italian/Dolomites Locations Found")
    print("=" * 40)
    
    if italian_locations:
        print(f"✅ Found {len(italian_locations)} Italian location IDs:")
        
        for loc in italian_locations:
            print(f"\n🎯 {loc['id_type'].upper()} ID {loc['id']}")
            print(f"   📍 {loc['sample_accommodation']['title']}")
            print(f"   🌍 {loc['sample_accommodation']['city']}, {loc['sample_accommodation']['country']}")
            print(f"   💰 {loc['sample_accommodation']['price']} EUR")
            print(f"   🏨 {loc['count']} accommodations available")
        
        return italian_locations
    else:
        print("❌ No Italian/Dolomites locations found in tested ID ranges")
        print("\n💡 Recommendations:")
        print("1. Try higher ID ranges (50-200)")
        print("2. Contact MountVacation for Italian location IDs")
        print("3. Use the working French/Austrian locations for testing")
        
        return []

def test_working_locations():
    """Test the locations we found to make sure they work for your scenario"""
    
    print(f"\n🧪 Testing Working Locations for Your Scenario")
    print("=" * 50)
    
    # Use the working IDs we found earlier
    working_ids = [
        {'type': 'resort', 'id': '142'},
        {'type': 'city', 'id': '1152'},
        {'type': 'skiarea', 'id': '1'},
        {'type': 'resort', 'id': '10'}
    ]
    
    api_key = os.getenv('MOUNTVACATION_API_KEY')
    base_url = 'https://api.mountvacation.com/accommodations/search/'
    
    for location in working_ids:
        print(f"\n🏨 Testing {location['type'].upper()} ID {location['id']}")
        
        try:
            params = {
                location['type']: location['id'],
                'arrival': '2025-12-15',
                'departure': '2025-12-18',
                'personsAges': '30,28',
                'currency': 'EUR',
                'apiKey': api_key
            }
            
            response = requests.get(base_url, params=params, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                accommodations = data.get('accommodations', [])
                
                print(f"   ✅ Found {len(accommodations)} accommodations")
                
                if accommodations:
                    for i, acc in enumerate(accommodations[:2], 1):  # Show first 2
                        print(f"\n   {i}. 🏨 {acc.get('title', 'N/A')}")
                        print(f"      📍 {acc.get('city', 'N/A')}, {acc.get('country', 'N/A')}")
                        print(f"      ⭐ {acc.get('category', 'N/A')} stars")
                        
                        if acc.get('offers'):
                            offer = acc['offers'][0]
                            price = offer.get('price', 'N/A')
                            print(f"      💰 {price} EUR per night")
                            
                            # Check if within budget
                            try:
                                if float(price) <= 250:
                                    print(f"      ✅ Within your 250 EUR budget")
                                else:
                                    print(f"      ⚠️  Above your 250 EUR budget")
                            except:
                                pass
                        
                        # Check amenities
                        amenities = []
                        if acc.get('pool'): amenities.append("🏊 Pool")
                        if acc.get('sauna'): amenities.append("🧖 Sauna")
                        if acc.get('wifi'): amenities.append("📶 WiFi")
                        
                        if amenities:
                            print(f"      🎯 {', '.join(amenities)}")
            else:
                print(f"   ❌ Failed with status {response.status_code}")
                
        except Exception as e:
            print(f"   💥 Error: {e}")

if __name__ == "__main__":
    print("🏔️  Finding Dolomites Location IDs")
    
    # First, search for Italian locations
    italian_locations = find_dolomites_locations()
    
    # Then test our working locations
    test_working_locations()
    
    print(f"\n🎯 Summary for Your Dolomites Ski Trip")
    print("=" * 40)
    
    if italian_locations:
        print(f"🎉 Great news! Found {len(italian_locations)} Italian locations")
        print(f"Your MCP server can now search Italian Dolomites accommodations!")
    else:
        print(f"🔄 No Italian locations found in current search")
        print(f"But we have working French/Austrian ski locations for testing")
    
    print(f"\n📋 Next Steps:")
    print(f"1. Update MCP server with working location IDs")
    print(f"2. Create location name → ID mappings")
    print(f"3. Test complete MCP functionality")
    print(f"4. Deploy and connect to AI assistants")
    
    print(f"\n🎿 Your ski trip search is ready to go!")
