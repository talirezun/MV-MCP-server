#!/usr/bin/env python3
"""
MountVacation API Test Script
Test your API key and explore the API structure
"""

import os
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

def test_api_connection():
    """Test the MountVacation API connection"""
    
    api_key = os.getenv('MOUNTVACATION_API_KEY')
    
    if not api_key or api_key == 'your_actual_api_key_here':
        print("❌ No API key found!")
        print("Please update your .env file with your actual MountVacation API key")
        print("Contact: cs@mountvacation.com or +44 20 3514 1200")
        return False
    
    print(f"🔑 Testing API key: {api_key[:8]}...")
    
    # Test parameters
    arrival = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
    departure = (datetime.now() + timedelta(days=37)).strftime('%Y-%m-%d')
    
    # Test different search strategies
    # Note: API expects integer IDs, not names. Let's try some common IDs and geolocation
    test_cases = [
        {
            'name': 'Geolocation Search (Chamonix area)',
            'params': {
                'latitude': '45.9237',
                'longitude': '6.8694',
                'radius': '10000',  # 10km radius
                'arrival': arrival,
                'departure': departure,
                'personsAges': '30,28',
                'currency': 'EUR',
                'lang': 'en',
                'apiKey': api_key
            }
        },
        {
            'name': 'Geolocation Search (Dolomites - Colfosco area)',
            'params': {
                'latitude': '46.5951',
                'longitude': '11.9073',
                'radius': '15000',  # 15km radius
                'arrival': arrival,
                'departure': departure,
                'personsAges': '30,28',
                'currency': 'EUR',
                'lang': 'en',
                'apiKey': api_key
            }
        },
        {
            'name': 'Resort ID Test (trying common IDs)',
            'params': {
                'resort': '1',  # Try resort ID 1
                'arrival': arrival,
                'departure': departure,
                'personsAges': '30',
                'currency': 'EUR',
                'lang': 'en',
                'apiKey': api_key
            }
        },
        {
            'name': 'Resort ID Test (ID 142 - from API docs example)',
            'params': {
                'resort': '142',  # From API documentation example
                'arrival': arrival,
                'departure': departure,
                'personsAges': '30,28',
                'currency': 'EUR',
                'lang': 'en',
                'apiKey': api_key
            }
        },
        {
            'name': 'City ID Test (trying ID 1152 - from API docs)',
            'params': {
                'city': '1152',  # From API documentation example
                'arrival': arrival,
                'departure': departure,
                'personsAges': '30',
                'currency': 'EUR',
                'lang': 'en',
                'apiKey': api_key
            }
        }
    ]
    
    base_url = 'https://api.mountvacation.com/accommodations/search/'
    
    for test_case in test_cases:
        print(f"\n🧪 Testing: {test_case['name']}")
        
        try:
            response = requests.get(
                base_url,
                params=test_case['params'],
                timeout=30,
                headers={
                    'User-Agent': 'MountVacation-MCP-Test/1.0',
                    'Accept': 'application/json'
                }
            )
            
            print(f"   Status: {response.status_code}")
            print(f"   URL: {response.url}")
            
            if response.status_code == 200:
                data = response.json()
                accommodations = data.get('accommodations', [])
                print(f"   ✅ Success! Found {len(accommodations)} accommodations")
                
                if accommodations:
                    first = accommodations[0]
                    print(f"   📍 Example: {first.get('title', 'N/A')} in {first.get('city', 'N/A')}")
                    if first.get('offers'):
                        price = first['offers'][0].get('price', 'N/A')
                        print(f"   💰 Price: {price} {data.get('currency', 'EUR')}")
                
                return True
                
            elif response.status_code == 401:
                print(f"   ❌ Authentication failed - Invalid API key")
                print(f"   Response: {response.text[:200]}")
                
            elif response.status_code == 404:
                print(f"   ❌ Endpoint not found - Check API documentation")
                print(f"   Response: {response.text[:200]}")
                
            else:
                print(f"   ❌ Request failed")
                print(f"   Response: {response.text[:200]}")
                
        except requests.exceptions.Timeout:
            print(f"   ⏰ Request timeout")
        except requests.exceptions.ConnectionError:
            print(f"   🌐 Connection error")
        except Exception as e:
            print(f"   💥 Error: {e}")
    
    return False

def explore_api_structure():
    """Explore the API response structure"""
    
    api_key = os.getenv('MOUNTVACATION_API_KEY')
    if not api_key or api_key == 'your_actual_api_key_here':
        return
    
    print("\n🔍 Exploring API Response Structure...")
    
    # Simple test request
    arrival = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
    departure = (datetime.now() + timedelta(days=37)).strftime('%Y-%m-%d')
    
    # Use geolocation search for Dolomites area (Colfosco) - your specific request
    arrival_dec = '2025-12-15'  # Second part of December 2025
    departure_dec = '2025-12-18'  # 3 nights

    params = {
        'latitude': '46.5951',
        'longitude': '11.9073',
        'radius': '15000',
        'arrival': arrival_dec,
        'departure': departure_dec,
        'personsAges': '30,28',  # 2 persons
        'currency': 'EUR',
        'lang': 'en',
        'apiKey': api_key
    }
    
    try:
        response = requests.get(
            'https://api.mountvacation.com/accommodations/search/',
            params=params,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            print("📊 Response Structure:")
            print(f"   - accommodations: {len(data.get('accommodations', []))} items")
            print(f"   - arrival: {data.get('arrival')}")
            print(f"   - departure: {data.get('departure')}")
            print(f"   - nights: {data.get('nights')}")
            print(f"   - personsAges: {data.get('personsAges')}")
            
            if data.get('accommodations'):
                acc = data['accommodations'][0]
                print(f"\n🏨 Sample Accommodation:")
                print(f"   - id: {acc.get('id')}")
                print(f"   - title: {acc.get('title')}")
                print(f"   - city: {acc.get('city')}")
                print(f"   - country: {acc.get('country')}")
                print(f"   - category: {acc.get('category')} stars")
                print(f"   - offers: {len(acc.get('offers', []))} available")
                
                if acc.get('offers'):
                    offer = acc['offers'][0]
                    print(f"\n💰 Sample Offer:")
                    print(f"   - id: {offer.get('id')}")
                    print(f"   - title: {offer.get('title')}")
                    print(f"   - price: {offer.get('price')} {data.get('currency', 'EUR')}")
                    print(f"   - beds: {offer.get('beds')}")
                    print(f"   - nights: {offer.get('nights')}")
        
    except Exception as e:
        print(f"💥 Error exploring API: {e}")

if __name__ == "__main__":
    print("🏔️  MountVacation API Test")
    print("=" * 50)
    
    success = test_api_connection()
    
    if success:
        explore_api_structure()
        print("\n🎉 API test completed successfully!")
        print("\nNext steps:")
        print("1. Test the MCP server: cd python-fastmcp && source venv/bin/activate && python mountvacation_mcp.py")
        print("2. Test with MCP Inspector: cd mcp-inspector && npm start")
        print("3. Deploy to Cloudflare Workers: cd cloudflare-workers && wrangler deploy")
    else:
        print("\n❌ API test failed. Please check your API key and try again.")
