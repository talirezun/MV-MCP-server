#!/usr/bin/env python3
"""
Comprehensive API test to find working parameters
"""

import os
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

def test_comprehensive_api():
    """Test various API parameter combinations to find what works"""
    
    api_key = os.getenv('MOUNTVACATION_API_KEY')
    
    if not api_key:
        print("❌ No API key found!")
        return False
    
    print("🏔️  Comprehensive MountVacation API Test")
    print("=" * 50)
    print(f"🔑 Using API key: {api_key[:8]}...")
    
    base_url = 'https://api.mountvacation.com/accommodations/search/'
    arrival = '2025-12-15'
    departure = '2025-12-18'
    
    # Test cases to try
    test_cases = [
        # Try some common resort IDs
        {
            'name': 'Resort ID 1',
            'params': {
                'resort': '1',
                'arrival': arrival,
                'departure': departure,
                'personsAges': '30,28',
                'currency': 'EUR',
                'apiKey': api_key
            }
        },
        {
            'name': 'Resort ID 142 (from docs)',
            'params': {
                'resort': '142',
                'arrival': arrival,
                'departure': departure,
                'personsAges': '30,28',
                'currency': 'EUR',
                'apiKey': api_key
            }
        },
        # Try city IDs
        {
            'name': 'City ID 1152 (from docs)',
            'params': {
                'city': '1152',
                'arrival': arrival,
                'departure': departure,
                'personsAges': '30,28',
                'currency': 'EUR',
                'apiKey': api_key
            }
        },
        # Try region IDs
        {
            'name': 'Region ID 1',
            'params': {
                'region': '1',
                'arrival': arrival,
                'departure': departure,
                'personsAges': '30,28',
                'currency': 'EUR',
                'apiKey': api_key
            }
        },
        # Try skiarea IDs
        {
            'name': 'Ski Area ID 1',
            'params': {
                'skiarea': '1',
                'arrival': arrival,
                'departure': departure,
                'personsAges': '30,28',
                'currency': 'EUR',
                'apiKey': api_key
            }
        },
        # Try geolocation with different format
        {
            'name': 'Geolocation (Dolomites) - Format 1',
            'params': {
                'longitude': '11.9073',
                'latitude': '46.5951',
                'radius': '15000',
                'arrival': arrival,
                'departure': departure,
                'personsAges': '30,28',
                'currency': 'EUR',
                'apiKey': api_key
            }
        },
        # Try a range of resort IDs to find working ones
        {
            'name': 'Resort ID 10',
            'params': {
                'resort': '10',
                'arrival': arrival,
                'departure': departure,
                'personsAges': '30,28',
                'currency': 'EUR',
                'apiKey': api_key
            }
        },
        {
            'name': 'Resort ID 100',
            'params': {
                'resort': '100',
                'arrival': arrival,
                'departure': departure,
                'personsAges': '30,28',
                'currency': 'EUR',
                'apiKey': api_key
            }
        }
    ]
    
    working_params = []
    
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
            
            if response.status_code == 200:
                data = response.json()
                accommodations = data.get('accommodations', [])
                print(f"   ✅ SUCCESS! Found {len(accommodations)} accommodations")
                
                if accommodations:
                    working_params.append({
                        'test_case': test_case['name'],
                        'params': test_case['params'],
                        'count': len(accommodations)
                    })
                    
                    # Show sample result
                    first = accommodations[0]
                    print(f"   📍 Sample: {first.get('title', 'N/A')} in {first.get('city', 'N/A')}")
                    if first.get('offers'):
                        price = first['offers'][0].get('price', 'N/A')
                        print(f"   💰 Price: {price} {data.get('currency', 'EUR')}")
                
            elif response.status_code == 400:
                error_data = response.json()
                print(f"   ❌ Validation Error: {error_data.get('message', 'Unknown')}")
                errors = error_data.get('errors', [])
                for error in errors:
                    print(f"      Field: {error.get('field', 'N/A')}")
                    print(f"      Type: {error.get('type', 'N/A')}")
                    
            elif response.status_code == 401:
                print(f"   ❌ Authentication failed")
                
            else:
                print(f"   ❌ Failed with status {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                
        except Exception as e:
            print(f"   💥 Error: {e}")
    
    # Summary
    print(f"\n📊 Test Summary")
    print("=" * 30)
    
    if working_params:
        print(f"✅ Found {len(working_params)} working parameter combinations:")
        
        for wp in working_params:
            print(f"\n🎯 {wp['test_case']}")
            print(f"   Found: {wp['count']} accommodations")
            
            # Show the working parameters (without API key)
            params_display = {k: v for k, v in wp['params'].items() if k != 'apiKey'}
            print(f"   Params: {params_display}")
        
        print(f"\n🎉 SUCCESS! We found working API parameters!")
        print(f"Now we can update the MCP server to use these working IDs.")
        
        return True
    else:
        print(f"❌ No working parameter combinations found")
        print(f"This suggests either:")
        print(f"   • The API requires specific resort/city/region IDs")
        print(f"   • The geolocation format is different")
        print(f"   • There might be additional required parameters")
        
        print(f"\n💡 Recommendations:")
        print(f"   1. Contact MountVacation support for valid location IDs")
        print(f"   2. Check if there's a locations/search endpoint")
        print(f"   3. Try different date ranges or person configurations")
        
        return False

if __name__ == "__main__":
    print("🚀 Starting Comprehensive API Test")
    
    success = test_comprehensive_api()
    
    if success:
        print(f"\n🎯 Next Steps:")
        print(f"1. Update the MCP server with working location IDs")
        print(f"2. Create a mapping from location names to working IDs")
        print(f"3. Test the full MCP server functionality")
        print(f"4. Deploy to production")
    else:
        print(f"\n📞 Contact MountVacation Support:")
        print(f"   Email: cs@mountvacation.com")
        print(f"   Phone: +44 20 3514 1200")
        print(f"   Request: Valid location IDs for API integration")
