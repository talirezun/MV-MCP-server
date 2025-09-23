#!/bin/bash

echo "🏔️  Testing MountVacation MCP Server with Virtual Environment"
echo "=============================================================="

# Navigate to the python-fastmcp directory
cd python-fastmcp

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Check if activation worked
if [[ "$VIRTUAL_ENV" != "" ]]; then
    echo "✅ Virtual environment activated: $VIRTUAL_ENV"
else
    echo "❌ Failed to activate virtual environment"
    exit 1
fi

# Load environment variables
echo "🔑 Loading environment variables..."
export $(grep -v '^#' ../.env | xargs)

if [[ -z "$MOUNTVACATION_API_KEY" ]]; then
    echo "❌ No API key found in .env file"
    exit 1
fi

echo "🔑 Using API key: ${MOUNTVACATION_API_KEY:0:8}..."

# Create a simple test script
cat > test_api_direct.py << 'EOF'
#!/usr/bin/env python3
"""
Direct API test within virtual environment
"""

import os
from mountvacation_mcp import MountVacationAPI

def test_search():
    print("🧪 Testing Dolomites search...")
    
    # Create API client
    api = MountVacationAPI()
    
    # Test your specific scenario
    print("📍 Location: Colfosco (Italian Dolomites)")
    print("📅 Dates: December 15-18, 2025 (3 nights)")
    print("👥 Persons: 2 adults (ages 30, 28)")
    print("💰 Budget: Up to 250 EUR per night")
    print("🎯 Looking for: Hotels with pool, sauna, close to slopes")
    
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
        
        # Try alternatives
        print(f"\n🔄 Trying alternative locations...")
        alternatives = ["Dolomites", "Alta Badia", "Corvara"]
        
        for location in alternatives:
            print(f"   🧪 Testing: {location}")
            alt_result = api.search_accommodations(
                location=location,
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
            print(f"\n🏨 Perfect for your Dolomites ski trip:")
            
            for i, acc in enumerate(accommodations, 1):
                print(f"\n   {i}. 🏨 {acc.get('name', 'N/A')}")
                print(f"      📍 {acc.get('location', 'N/A')}")
                print(f"      ⭐ {acc.get('category', 'N/A')} stars")
                print(f"      💰 {acc.get('price', 'N/A')} {acc.get('currency', 'EUR')}/night")
                
                # Check amenities
                amenities = acc.get('amenities', {})
                features = []
                if amenities.get('pool'): features.append("🏊 Pool")
                if amenities.get('sauna'): features.append("🧖 Sauna")
                if amenities.get('breakfast_included'): features.append("🍳 Breakfast")
                if amenities.get('wifi'): features.append("📶 WiFi")
                
                if features:
                    print(f"      🎯 {', '.join(features)}")
                
                # Distance to slopes
                distances = acc.get('distances', {})
                ski_dist = distances.get('to_ski_runs', 'N/A')
                if ski_dist != 'N/A' and ski_dist != 'N/Am':
                    print(f"      🎿 {ski_dist} to slopes")
                
                # Budget check
                try:
                    price = float(acc.get('price', 0))
                    if price <= 250:
                        print(f"      ✅ Within budget")
                    else:
                        print(f"      ⚠️  Above budget")
                except:
                    pass
            
            print(f"\n🎯 Your Dolomites ski trip is ready!")
            return True
        else:
            print(f"\nℹ️  No accommodations found")
            return False
    else:
        print(f"\n❌ All searches failed")
        return False

if __name__ == "__main__":
    try:
        success = test_search()
        if success:
            print("\n🎉 MCP Server is working perfectly!")
            print("Ready for AI assistant integration!")
        else:
            print("\n❌ Test failed - check API configuration")
    except Exception as e:
        print(f"💥 Error: {e}")
EOF

# Run the test
echo ""
echo "🚀 Running direct API test..."
python test_api_direct.py

# Clean up
rm test_api_direct.py

echo ""
echo "🏁 Test completed!"
