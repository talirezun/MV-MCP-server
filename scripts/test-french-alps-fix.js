#!/usr/bin/env node

/**
 * Test script to verify French Alps search fix
 * Tests that French destinations now return proper French results
 */

const API_KEY = process.env.MOUNTVACATION_API_KEY;
const SERVER_URL = 'https://blocklabs-mountvacation-mcp.4thtech.workers.dev/mcp';

if (!API_KEY) {
  console.error('❌ MOUNTVACATION_API_KEY environment variable is required');
  process.exit(1);
}

async function testSearch(location, expectedCountry = 'France') {
  console.log(`\n🧪 Testing: "${location}"`);
  
  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'search_accommodations',
      arguments: {
        location: location,
        arrival_date: '2026-01-10',
        departure_date: '2026-01-17',
        persons_ages: '18,18',
        currency: 'EUR',
        max_results: 1
      }
    }
  };

  try {
    const response = await fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MountVacation-API-Key': API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      console.log(`❌ Error: ${data.error.message}`);
      return false;
    }

    const result = JSON.parse(data.result.content[0].text);
    
    if (result.accommodations && result.accommodations.length > 0) {
      const accommodation = result.accommodations[0];
      const country = accommodation.location.country;
      const city = accommodation.location.city;
      const resort = accommodation.location.resort;
      const bookingUrl = accommodation.book_now_url;
      
      console.log(`✅ Found: ${accommodation.name}`);
      console.log(`   📍 Location: ${city}, ${country}`);
      console.log(`   🎿 Resort: ${resort}`);
      console.log(`   💰 Price: €${accommodation.pricing.total_price} for 7 nights`);
      console.log(`   🔗 Booking: ${bookingUrl ? 'Available' : 'Missing'}`);
      
      if (country === expectedCountry) {
        console.log(`✅ SUCCESS: Correct country (${country})`);
        return true;
      } else {
        console.log(`❌ FAIL: Expected ${expectedCountry}, got ${country}`);
        return false;
      }
    } else {
      console.log(`❌ No accommodations found`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🎿 MountVacation MCP - French Alps Fix Verification');
  console.log('=' .repeat(60));
  
  const tests = [
    { location: 'Chamonix', expected: 'France' },
    { location: 'French Alps', expected: 'France' },
    { location: 'Avoriaz', expected: 'France' },
    { location: 'Val d\'Isère', expected: 'France' },
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const success = await testSearch(test.location, test.expected);
    if (success) passed++;
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`📊 Test Results: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED! French Alps fix is working correctly.');
    console.log('✅ MountVacation MCP now properly supports French ski destinations.');
  } else {
    console.log('❌ Some tests failed. French Alps fix needs more work.');
    process.exit(1);
  }
}

runTests().catch(console.error);
