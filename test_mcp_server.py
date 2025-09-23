#!/usr/bin/env python3
"""
Test the MountVacation MCP Server directly
"""

import json
import subprocess
import sys
from datetime import datetime, timedelta

def test_mcp_server():
    """Test the MCP server with your specific scenario"""
    
    print("🏔️  Testing MountVacation MCP Server")
    print("=" * 50)
    
    # Your specific test case: Italian Dolomites, Colfosco area, December 2025
    test_request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "search_accommodations",
            "arguments": {
                "location": "Colfosco",  # Italian Dolomites
                "arrival_date": "2025-12-15",  # Second part of December
                "departure_date": "2025-12-18",  # 3 nights
                "persons_ages": "30,28",  # 2 persons
                "currency": "EUR",
                "max_results": 5
            }
        }
    }
    
    print("🧪 Test Scenario:")
    print(f"   Location: {test_request['params']['arguments']['location']}")
    print(f"   Dates: {test_request['params']['arguments']['arrival_date']} to {test_request['params']['arguments']['departure_date']}")
    print(f"   Persons: {test_request['params']['arguments']['persons_ages']} (2 adults)")
    print(f"   Currency: {test_request['params']['arguments']['currency']}")
    print(f"   Max Results: {test_request['params']['arguments']['max_results']}")
    
    try:
        # Run the MCP server and send the request (with virtual environment)
        process = subprocess.Popen(
            ['bash', '-c', 'source venv/bin/activate && python mountvacation_mcp.py'],
            cwd='python-fastmcp',
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Send the request
        request_json = json.dumps(test_request)
        print(f"\n📤 Sending request...")
        
        stdout, stderr = process.communicate(input=request_json, timeout=30)
        
        print(f"📥 Response received:")
        
        if stderr:
            print(f"⚠️  Stderr: {stderr}")
        
        # Parse the response
        try:
            response = json.loads(stdout.strip())
            
            if 'error' in response:
                print(f"❌ Error: {response['error']}")
                return False
            
            result = response.get('result', {})
            
            if 'error' in result:
                print(f"❌ API Error: {result['error']}")
                return False
            
            # Display results
            accommodations = result.get('accommodations', [])
            print(f"✅ Found {len(accommodations)} accommodations")
            
            if accommodations:
                print(f"\n🏨 Sample Results:")
                for i, acc in enumerate(accommodations[:3], 1):
                    print(f"\n   {i}. {acc.get('name', 'N/A')}")
                    print(f"      📍 Location: {acc.get('location', 'N/A')}")
                    print(f"      ⭐ Rating: {acc.get('category', 'N/A')} stars")
                    print(f"      💰 Price: {acc.get('price', 'N/A')} {acc.get('currency', 'EUR')}")
                    
                    amenities = acc.get('amenities', {})
                    if amenities.get('pool'):
                        print(f"      🏊 Pool: ✅")
                    if amenities.get('sauna'):
                        print(f"      🧖 Sauna: ✅")
                    if amenities.get('breakfast_included'):
                        print(f"      🍳 Breakfast: ✅")
                    
                    distances = acc.get('distances', {})
                    if distances.get('to_ski_runs') != 'N/Am':
                        print(f"      🎿 Distance to slopes: {distances.get('to_ski_runs', 'N/A')}")
                
                return True
            else:
                print("ℹ️  No accommodations found for this search")
                return True
                
        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse JSON response: {e}")
            print(f"Raw response: {stdout}")
            return False
            
    except subprocess.TimeoutExpired:
        print("⏰ Request timeout")
        process.kill()
        return False
    except Exception as e:
        print(f"💥 Error: {e}")
        return False

def test_alternative_locations():
    """Test with alternative location names"""
    
    print("\n🔄 Testing Alternative Locations")
    print("=" * 40)
    
    locations_to_test = [
        "Dolomites",
        "Alta Badia", 
        "Corvara",
        "Val Gardena",
        "Chamonix"
    ]
    
    for location in locations_to_test:
        print(f"\n🧪 Testing: {location}")
        
        test_request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": "search_accommodations",
                "arguments": {
                    "location": location,
                    "arrival_date": "2025-12-15",
                    "departure_date": "2025-12-18",
                    "persons_ages": "30,28",
                    "currency": "EUR",
                    "max_results": 3
                }
            }
        }
        
        try:
            process = subprocess.Popen(
                ['bash', '-c', 'source venv/bin/activate && python mountvacation_mcp.py'],
                cwd='python-fastmcp',
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            request_json = json.dumps(test_request)
            stdout, stderr = process.communicate(input=request_json, timeout=20)
            
            try:
                response = json.loads(stdout.strip())
                result = response.get('result', {})
                
                if 'error' in result:
                    print(f"   ❌ {result['error']}")
                else:
                    accommodations = result.get('accommodations', [])
                    print(f"   ✅ Found {len(accommodations)} accommodations")
                    
            except json.JSONDecodeError:
                print(f"   ❌ Invalid response")
                
        except Exception as e:
            print(f"   💥 Error: {e}")

if __name__ == "__main__":
    print("🚀 Starting MCP Server Tests")
    
    # Test main scenario
    success = test_mcp_server()
    
    if success:
        # Test alternative locations
        test_alternative_locations()
        
        print("\n🎉 MCP Server testing completed!")
        print("\nNext steps:")
        print("1. Open MCP Inspector: http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=e0573379ce5eae542be7227d336db844530d6c7be61f05b9769cc3130c953ed0")
        print("2. Connect to: stdio://python ../python-fastmcp/mountvacation_mcp.py")
        print("3. Test the search_accommodations tool with your parameters")
    else:
        print("\n❌ MCP Server test failed")
        print("Check the API configuration and try again")
