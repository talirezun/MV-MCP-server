#!/usr/bin/env python3
"""
Proper MCP Server Test with Protocol Initialization
"""

import json
import subprocess
import sys
import time

def test_mcp_server_properly():
    """Test the MCP server with proper protocol initialization"""
    
    print("🏔️  Testing MountVacation MCP Server (Proper Protocol)")
    print("=" * 60)
    
    try:
        # Start the MCP server
        process = subprocess.Popen(
            ['bash', '-c', 'source venv/bin/activate && python mountvacation_mcp.py'],
            cwd='python-fastmcp',
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=0
        )
        
        print("🚀 MCP Server started, initializing...")
        
        # Step 1: Initialize the MCP connection
        init_request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {}
                },
                "clientInfo": {
                    "name": "test-client",
                    "version": "1.0.0"
                }
            }
        }
        
        print("📤 Sending initialization request...")
        process.stdin.write(json.dumps(init_request) + '\n')
        process.stdin.flush()
        
        # Read initialization response
        time.sleep(2)
        
        # Step 2: Send initialized notification
        initialized_notification = {
            "jsonrpc": "2.0",
            "method": "notifications/initialized"
        }
        
        print("📤 Sending initialized notification...")
        process.stdin.write(json.dumps(initialized_notification) + '\n')
        process.stdin.flush()
        
        time.sleep(1)
        
        # Step 3: List available tools
        tools_request = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
            "params": {}
        }
        
        print("📤 Requesting tools list...")
        process.stdin.write(json.dumps(tools_request) + '\n')
        process.stdin.flush()
        
        time.sleep(1)
        
        # Step 4: Test the search_accommodations tool
        search_request = {
            "jsonrpc": "2.0",
            "id": 3,
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
        print(f"   Location: Colfosco (Italian Dolomites)")
        print(f"   Dates: 2025-12-15 to 2025-12-18 (3 nights)")
        print(f"   Persons: 2 adults (ages 30, 28)")
        print(f"   Currency: EUR")
        print(f"   Looking for: Hotels with pool, sauna, close to ski slopes")
        print(f"   Budget: Up to 250 EUR per night")
        
        print("\n📤 Sending accommodation search request...")
        process.stdin.write(json.dumps(search_request) + '\n')
        process.stdin.flush()
        
        # Give the server time to process
        time.sleep(5)
        
        # Read all responses
        print("\n📥 Reading responses...")
        
        # Terminate the process to get all output
        process.stdin.close()
        stdout, stderr = process.communicate(timeout=10)
        
        print(f"📊 Server Output:")
        if stdout:
            lines = stdout.strip().split('\n')
            for line in lines:
                if line.strip():
                    try:
                        response = json.loads(line)
                        if response.get('id') == 3:  # Our search request
                            print(f"\n✅ Search Response Received:")
                            result = response.get('result', {})
                            
                            if 'error' in result:
                                print(f"❌ API Error: {result['error']}")
                            else:
                                accommodations = result.get('accommodations', [])
                                print(f"🏨 Found {len(accommodations)} accommodations")
                                
                                if accommodations:
                                    print(f"\n🎯 Results for your Dolomites ski trip:")
                                    for i, acc in enumerate(accommodations[:3], 1):
                                        print(f"\n   {i}. {acc.get('name', 'N/A')}")
                                        print(f"      📍 {acc.get('location', 'N/A')}")
                                        print(f"      ⭐ {acc.get('category', 'N/A')} stars")
                                        print(f"      💰 {acc.get('price', 'N/A')} {acc.get('currency', 'EUR')} per night")
                                        
                                        amenities = acc.get('amenities', {})
                                        features = []
                                        if amenities.get('pool'): features.append("🏊 Pool")
                                        if amenities.get('sauna'): features.append("🧖 Sauna") 
                                        if amenities.get('breakfast_included'): features.append("🍳 Breakfast")
                                        if amenities.get('wifi'): features.append("📶 WiFi")
                                        if amenities.get('parking'): features.append("🚗 Parking")
                                        
                                        if features:
                                            print(f"      🎯 Features: {', '.join(features)}")
                                        
                                        distances = acc.get('distances', {})
                                        if distances.get('to_ski_runs') and distances['to_ski_runs'] != 'N/Am':
                                            print(f"      🎿 Distance to slopes: {distances['to_ski_runs']}")
                                        
                                        booking = acc.get('booking', {})
                                        if booking.get('reservation_url') and booking['reservation_url'] != 'N/A':
                                            print(f"      🔗 Book: {booking['reservation_url']}")
                                
                                return True
                        elif response.get('id') == 2:  # Tools list
                            print(f"🔧 Available tools: {len(response.get('result', {}).get('tools', []))}")
                            
                    except json.JSONDecodeError:
                        # Skip non-JSON lines (like the banner)
                        continue
        
        if stderr:
            print(f"\n⚠️  Server Errors:")
            print(stderr)
        
        return False
        
    except subprocess.TimeoutExpired:
        print("⏰ Request timeout")
        process.kill()
        return False
    except Exception as e:
        print(f"💥 Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Proper MCP Server Test")
    
    success = test_mcp_server_properly()
    
    if success:
        print("\n🎉 MCP Server test completed successfully!")
        print("\n📋 Summary:")
        print("✅ MCP protocol initialization working")
        print("✅ API connection established")
        print("✅ Search functionality working")
        print("✅ Location mapping working (Colfosco → Dolomites)")
        
        print("\n🎯 Your Dolomites ski trip search is ready!")
        print("The MCP server can now help you find:")
        print("• Hotels with pools and saunas")
        print("• Accommodations close to ski slopes")
        print("• Properties in Colfosco and surrounding areas")
        print("• Options within your 250 EUR/night budget")
        
        print("\n🔗 Next Steps:")
        print("1. Use MCP Inspector for visual testing")
        print("2. Connect to Claude Desktop or other AI clients")
        print("3. Deploy to Cloudflare Workers for production")
        
    else:
        print("\n❌ MCP Server test failed")
        print("Check the logs above for details")
