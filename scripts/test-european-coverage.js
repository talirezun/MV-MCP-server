#!/usr/bin/env node

/**
 * Comprehensive European Coverage Test
 * Tests MountVacation MCP Server across multiple European countries and scenarios
 */

const API_KEY = process.env.MOUNTVACATION_API_KEY;
const SERVER_URL = 'https://blocklabs-mountvacation-mcp.4thtech.workers.dev';

if (!API_KEY) {
  console.log('❌ MOUNTVACATION_API_KEY environment variable is required');
  console.log('💡 Get your API key from https://www.mountvacation.si/');
  process.exit(1);
}

// European test scenarios
const TEST_SCENARIOS = [
  {
    name: '🇮🇹 Italian Dolomites - Family Skiing',
    location: 'Madonna di Campiglio',
    arrival_date: '2025-12-15',
    departure_date: '2025-12-22',
    persons_ages: '35,32,8,5',
    currency: 'EUR',
    description: 'Family with children in Italian Dolomites'
  },
  {
    name: '🇫🇷 French Alps - Luxury Skiing',
    location: 'Chamonix',
    arrival_date: '2026-01-20',
    departure_date: '2026-01-27',
    persons_ages: '45,42',
    currency: 'EUR',
    description: 'Couple in premium French Alps resort'
  },
  {
    name: '🇦🇹 Austrian Alps - Group Skiing',
    location: 'Innsbruck',
    arrival_date: '2026-02-10',
    departure_date: '2026-02-17',
    persons_ages: '28,26,30,29,27,25',
    currency: 'EUR',
    description: 'Group of friends in Austrian Alps'
  },
  {
    name: '🇨🇭 Swiss Alps - Premium Resort',
    location: 'Zermatt',
    arrival_date: '2026-03-05',
    departure_date: '2026-03-12',
    persons_ages: '50,48',
    currency: 'CHF',
    description: 'Premium couple vacation in Swiss Alps'
  },
  {
    name: '🇮🇹 Italian Alps - Alternative Region',
    location: 'Livigno',
    arrival_date: '2026-01-15',
    departure_date: '2026-01-22',
    persons_ages: '22,24,23',
    currency: 'EUR',
    description: 'Young adults in Italian Alps (Lombardy)'
  },
  {
    name: '🇫🇷 French Alps - Val d\'Isère',
    location: 'Val d\'Isère',
    arrival_date: '2026-02-20',
    departure_date: '2026-02-27',
    persons_ages: '40,38,12,10',
    currency: 'EUR',
    description: 'Family in premium French resort'
  }
];

async function testScenario(scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📍 Location: ${scenario.location}`);
  console.log(`📅 Dates: ${scenario.arrival_date} to ${scenario.departure_date}`);
  console.log(`👥 Group: ${scenario.persons_ages.split(',').length} people`);
  console.log(`💰 Currency: ${scenario.currency}`);
  
  try {
    const response = await fetch(`${SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MountVacation-API-Key': API_KEY,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Math.floor(Math.random() * 1000),
        method: 'tools/call',
        params: {
          name: 'search_accommodations',
          arguments: {
            location: scenario.location,
            arrival_date: scenario.arrival_date,
            departure_date: scenario.departure_date,
            persons_ages: scenario.persons_ages,
            currency: scenario.currency,
            max_results: 2
          }
        }
      })
    });

    const result = await response.json();
    
    if (result.error) {
      console.log(`❌ API Error: ${result.error.message}`);
      return { success: false, error: result.error.message };
    }

    const data = JSON.parse(result.result.content[0].text);
    
    if (data.error) {
      console.log(`❌ Search Error: ${data.error}`);
      return { success: false, error: data.error };
    }

    const accommodations = data.accommodations || [];
    console.log(`✅ Found ${accommodations.length} accommodations`);
    
    if (accommodations.length > 0) {
      const first = accommodations[0];
      console.log(`🏨 Top Result: ${first.name}`);
      console.log(`📍 Address: ${first.location.full_address}`);
      console.log(`💰 Price: ${first.pricing.total_price} ${first.pricing.currency}`);
      console.log(`🔗 Booking: ${first.book_now_url !== 'N/A' ? 'Available' : 'Not available'}`);
      console.log(`💼 Offers: ${first.booking_offers?.length || 0} booking options`);
      
      return { 
        success: true, 
        accommodations: accommodations.length,
        hasBookingLinks: first.book_now_url !== 'N/A',
        bookingOffers: first.booking_offers?.length || 0,
        topResult: first.name
      };
    } else {
      console.log(`⚠️ No accommodations found for ${scenario.location}`);
      return { success: true, accommodations: 0 };
    }

  } catch (error) {
    console.log(`❌ Request Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runComprehensiveTest() {
  console.log('🌍 MountVacation MCP Server - European Coverage Test');
  console.log('📍 Server:', SERVER_URL);
  console.log('🔑 API Key:', API_KEY ? `${API_KEY.substring(0, 8)}...` : 'Not provided');
  console.log('');

  // Test health first
  console.log('🏥 Testing server health...');
  try {
    const healthResponse = await fetch(`${SERVER_URL}/health`);
    const health = await healthResponse.json();
    console.log(`✅ Server healthy: ${health.status} (v${health.version})`);
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
    return;
  }

  const results = [];
  
  // Run all test scenarios
  for (const scenario of TEST_SCENARIOS) {
    const result = await testScenario(scenario);
    results.push({ scenario: scenario.name, ...result });
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  
  const successful = results.filter(r => r.success);
  const withAccommodations = results.filter(r => r.accommodations > 0);
  const withBookingLinks = results.filter(r => r.hasBookingLinks);
  
  console.log(`✅ Successful requests: ${successful.length}/${results.length}`);
  console.log(`🏨 Found accommodations: ${withAccommodations.length}/${results.length}`);
  console.log(`🔗 With booking links: ${withBookingLinks.length}/${results.length}`);
  
  console.log('\n🌍 COUNTRY COVERAGE:');
  results.forEach(result => {
    const status = result.success ? 
      (result.accommodations > 0 ? '✅' : '⚠️') : '❌';
    console.log(`${status} ${result.scenario}`);
    if (result.topResult) {
      console.log(`   └─ Top: ${result.topResult}`);
    }
    if (result.error) {
      console.log(`   └─ Error: ${result.error}`);
    }
  });

  console.log('\n🎯 CONCLUSION:');
  if (successful.length === results.length && withAccommodations.length >= results.length * 0.8) {
    console.log('🎉 EXCELLENT! European coverage is comprehensive and working well.');
    console.log('✅ Ready for production use across all major European destinations.');
  } else if (successful.length >= results.length * 0.8) {
    console.log('👍 GOOD! Most European destinations are working well.');
    console.log('⚠️ Some locations may need additional mapping or have limited inventory.');
  } else {
    console.log('⚠️ NEEDS IMPROVEMENT! Several European destinations are not working properly.');
    console.log('🔧 Review API mappings and error handling.');
  }
}

// Run the comprehensive test
runComprehensiveTest().catch(console.error);
