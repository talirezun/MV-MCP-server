#!/usr/bin/env node

const SERVER_URL = 'https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp';

async function testEuropeanCoverage() {
  console.log('🌍 Testing European-Wide Coverage...\n');

  const testDestinations = [
    // Major European Cities
    { location: 'Paris, France', type: 'City', country: 'France' },
    { location: 'Rome, Italy', type: 'City', country: 'Italy' },
    { location: 'Barcelona, Spain', type: 'City', country: 'Spain' },
    { location: 'Vienna, Austria', type: 'City', country: 'Austria' },
    { location: 'Prague, Czech Republic', type: 'City', country: 'Czech Republic' },
    
    // Ski Destinations (Multiple Countries)
    { location: 'Chamonix, France', type: 'Ski Resort', country: 'France' },
    { location: 'Zermatt, Switzerland', type: 'Ski Resort', country: 'Switzerland' },
    { location: 'Innsbruck, Austria', type: 'Ski Resort', country: 'Austria' },
    { location: 'Cortina d\'Ampezzo, Italy', type: 'Ski Resort', country: 'Italy' },
    
    // Coastal & Beach Destinations
    { location: 'Nice, France', type: 'Coastal', country: 'France' },
    { location: 'Lisbon, Portugal', type: 'Coastal', country: 'Portugal' },
    { location: 'Dubrovnik, Croatia', type: 'Coastal', country: 'Croatia' },
    
    // Wine & Cultural Regions
    { location: 'Tuscany, Italy', type: 'Wine Region', country: 'Italy' },
    { location: 'Rhine Valley, Germany', type: 'Wine Region', country: 'Germany' },
    { location: 'Douro Valley, Portugal', type: 'Wine Region', country: 'Portugal' },
    
    // Mountain & Nature (Non-Ski)
    { location: 'Lake Bled, Slovenia', type: 'Nature', country: 'Slovenia' },
    { location: 'Swiss Alps', type: 'Mountain', country: 'Switzerland' },
    { location: 'Black Forest, Germany', type: 'Nature', country: 'Germany' }
  ];

  let successCount = 0;
  let totalTests = testDestinations.length;

  for (const destination of testDestinations) {
    console.log(`🔍 Testing: ${destination.location}`);
    console.log(`   Type: ${destination.type} | Country: ${destination.country}`);
    
    try {
      const searchRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'search_accommodations',
          arguments: {
            location: destination.location,
            arrival_date: '2026-06-15',
            departure_date: '2026-06-20',
            persons_ages: '30,30',
            currency: 'EUR',
            max_results: 3
          }
        }
      };

      const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchRequest)
      });

      const data = await response.json();
      
      if (data.result?.content?.[0]?.text) {
        const resultData = JSON.parse(data.result.content[0].text);
        
        if (resultData.accommodations && resultData.accommodations.length > 0) {
          console.log(`   ✅ SUCCESS: Found ${resultData.accommodations.length} accommodations`);
          
          // Show first result details
          const acc = resultData.accommodations[0];
          console.log(`   🏨 ${acc.name}`);
          console.log(`   📍 ${acc.location.full_address}`);
          console.log(`   💰 ${acc.pricing.total_price} ${acc.pricing.currency}`);
          console.log(`   🔗 ${acc.property_page_url !== 'N/A' ? 'Has booking link' : 'No booking link'}`);
          
          // Verify the result is actually in the expected country/region
          const addressLower = acc.location.full_address.toLowerCase();
          const countryLower = destination.country.toLowerCase();
          const locationLower = destination.location.toLowerCase();
          
          if (addressLower.includes(countryLower) || 
              addressLower.includes(locationLower.split(',')[0].toLowerCase())) {
            console.log(`   🎯 LOCATION MATCH: Result is in expected region`);
            successCount++;
          } else {
            console.log(`   ⚠️  LOCATION MISMATCH: Result may be in different region`);
            console.log(`   Expected: ${destination.country}, Got: ${acc.location.full_address}`);
          }
          
        } else {
          console.log(`   ❌ FAILED: No accommodations found`);
          if (resultData.error) {
            console.log(`   Error: ${resultData.error}`);
          }
          if (resultData.suggestions) {
            console.log(`   Suggestions: ${resultData.suggestions.slice(0, 3).join(', ')}`);
          }
        }
      } else {
        console.log(`   ❌ FAILED: Invalid response format`);
        if (data.error) {
          console.log(`   Error: ${data.error.message}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('📊 EUROPEAN COVERAGE TEST RESULTS:');
  console.log(`✅ Successful searches: ${successCount}/${totalTests}`);
  console.log(`📈 Success rate: ${Math.round((successCount/totalTests) * 100)}%`);
  
  if (successCount >= totalTests * 0.8) {
    console.log('🎉 EXCELLENT: European coverage is working well!');
  } else if (successCount >= totalTests * 0.6) {
    console.log('👍 GOOD: Most European destinations are covered');
  } else {
    console.log('⚠️  NEEDS IMPROVEMENT: Some European regions may need better coverage');
  }
  
  console.log('\n🌍 European-wide accommodation search is ready!');
}

testEuropeanCoverage().catch(console.error);
