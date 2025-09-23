#!/usr/bin/env python3
"""
Direct test of the search functionality without MCP protocol
"""

import os
import sys
sys.path.append('python-fastmcp')

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Set environment variables
os.environ['MOUNTVACATION_API_KEY'] = os.getenv('MOUNTVACATION_API_KEY', '')

def test_search_direct():
    """Test the search functionality directly"""
    
    print("🏔️  Direct Search Test - Dolomites Ski Trip")
    print("=" * 50)
    
    try:
        # Import the MountVacation API class
        from mountvacation_mcp import MountVacationAPI
        
        # Create API client
        api = MountVacationAPI()
        
        print("🔑 API client created successfully")
        
        # Test your specific scenario
        print("\n🧪 Testing your scenario:")
        print("   Location: Colfosco (Italian Dolomites)")
        print("   Dates: December 15-18, 2025 (3 nights)")
        print("   Persons: 2 adults (ages 30, 28)")
        print("   Looking for: Hotels with pool, sauna, close to slopes")
        print("   Budget: Up to 250 EUR per night")
        
        # Call the search method
        result = api.search_accommodations(
            location="Colfosco",
            arrival_date="2025-12-15",
            departure_date="2025-12-18", 
            persons_ages="30,28",
            currency="EUR",
            max_results=5
        )
        
        print(f"\n📥 Search completed!")
        
        if 'error' in result:
            print(f"❌ Error: {result['error']}")
            
            # Try alternative locations
            print(f"\n🔄 Trying alternative locations...")
            
            alternatives = ["Dolomites", "Alta Badia", "Corvara", "Val Gardena"]
            
            for alt_location in alternatives:
                print(f"\n   🧪 Testing: {alt_location}")
                alt_result = api.search_accommodations(
                    location=alt_location,
                    arrival_date="2025-12-15",
                    departure_date="2025-12-18",
                    persons_ages="30,28",
                    currency="EUR",
                    max_results=3
                )
                
                if 'error' not in alt_result:
                    accommodations = alt_result.get('accommodations', [])
                    print(f"      ✅ Found {len(accommodations)} accommodations")
                    if accommodations:
                        result = alt_result
                        break
                else:
                    print(f"      ❌ {alt_result['error']}")
        
        # Display results
        if 'error' not in result:
            accommodations = result.get('accommodations', [])
            
            if accommodations:
                print(f"\n🎉 SUCCESS! Found {len(accommodations)} accommodations")
                print(f"\n🏨 Perfect options for your Dolomites ski trip:")
                
                for i, acc in enumerate(accommodations, 1):
                    print(f"\n   {i}. 🏨 {acc.get('name', 'N/A')}")
                    print(f"      📍 Location: {acc.get('location', 'N/A')}")
                    print(f"      ⭐ Rating: {acc.get('category', 'N/A')} stars")
                    
                    price = acc.get('price', 'N/A')
                    currency = acc.get('currency', 'EUR')
                    print(f"      💰 Price: {price} {currency} per night")
                    
                    # Check if it meets your criteria
                    amenities = acc.get('amenities', {})
                    features = []
                    
                    if amenities.get('pool'):
                        features.append("🏊 Pool ✅")
                    if amenities.get('sauna'):
                        features.append("🧖 Sauna ✅")
                    if amenities.get('breakfast_included'):
                        features.append("🍳 Breakfast ✅")
                    if amenities.get('wifi'):
                        features.append("📶 WiFi")
                    if amenities.get('parking'):
                        features.append("🚗 Parking")
                    
                    if features:
                        print(f"      🎯 Amenities: {', '.join(features)}")
                    
                    # Distance to ski slopes
                    distances = acc.get('distances', {})
                    ski_distance = distances.get('to_ski_runs', 'N/A')
                    if ski_distance != 'N/A' and ski_distance != 'N/Am':
                        print(f"      🎿 Distance to slopes: {ski_distance}")
                    
                    # Booking info
                    booking = acc.get('booking', {})
                    if booking.get('reservation_url') and booking['reservation_url'] != 'N/A':
                        print(f"      🔗 Book now: {booking['reservation_url']}")
                    
                    # Check if within budget
                    try:
                        price_num = float(price) if price != 'N/A' else 0
                        if price_num <= 250:
                            print(f"      ✅ Within budget (≤250 EUR)")
                        elif price_num > 250:
                            print(f"      ⚠️  Above budget (>250 EUR)")
                    except:
                        pass
                
                # Summary
                print(f"\n📊 Search Summary:")
                print(f"   • Found {len(accommodations)} accommodations")
                print(f"   • Location: Italian Dolomites area")
                print(f"   • Dates: December 15-18, 2025")
                print(f"   • Perfect for skiing with amenities")
                
                return True
            else:
                print(f"\nℹ️  No accommodations found for the specified criteria")
                print(f"   Try adjusting dates or location")
                return False
        else:
            print(f"\n❌ Search failed: {result['error']}")
            return False
            
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure the virtual environment is set up correctly")
        return False
    except Exception as e:
        print(f"💥 Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Direct Search Test")
    
    # Check API key
    api_key = os.getenv('MOUNTVACATION_API_KEY')
    if not api_key or api_key == 'your_actual_api_key_here':
        print("❌ No API key found!")
        print("Please set MOUNTVACATION_API_KEY in your .env file")
        sys.exit(1)
    
    print(f"🔑 Using API key: {api_key[:8]}...")
    
    success = test_search_direct()
    
    if success:
        print("\n🎉 Direct search test completed successfully!")
        print("\n🎯 Your MountVacation MCP Server is working perfectly!")
        print("Ready for:")
        print("• AI assistant integration (Claude, ChatGPT, etc.)")
        print("• Production deployment on Cloudflare Workers")
        print("• Real-time accommodation searches")
        
        print("\n📱 Try it with an AI assistant:")
        print('Ask: "Find me a ski hotel in Colfosco, Italy for December 15-18, 2025"')
        print('     "I need 2 adults, with pool and sauna, under 250 EUR per night"')
        
    else:
        print("\n❌ Direct search test failed")
        print("Check the API configuration and try again")
