#!/usr/bin/env node

/**
 * FINAL COMPREHENSIVE TEST - MountVacation MCP Server
 * 
 * This test validates the fixed location mapping system with:
 * 1. Location validation logic
 * 2. Corrected static mappings
 * 3. Improved fallback behavior
 * 4. Clean "no results" responses instead of wrong locations
 */

const https = require('https');

const MCP_SERVER_URL = 'https://mountvacation-mcp-final.4thtech.workers.dev';

// Test scenarios covering different mapping strategies
const TEST_SCENARIOS = [
  {
    id: 1,
    name: 'Alta Badia (Verified Resort ID)',
    location: 'Alta Badia',
    dates: { arrival: '2026-01-15', departure: '2026-01-20' },
    persons: '30,30',
    expected: 'CORRECT_LOCATION', // Should return Hotel Lagació in San Cassiano
    mapping_type: 'static_resort_id'
  },
  {
    id: 2,
    name: 'Chamonix (Verified Resort ID)',
    location: 'Chamonix',
    dates: { arrival: '2026-03-05', departure: '2026-03-08' },
    persons: '35,33',
    expected: 'CORRECT_LOCATION', // Should return Grand Hôtel des Alpes in Chamonix
    mapping_type: 'static_resort_id'
  },
  {
    id: 3,
    name: 'Zermatt (Coordinate-based)',
    location: 'Zermatt',
    dates: { arrival: '2026-01-25', departure: '2026-01-29' },
    persons: '40,38',
    expected: 'NO_RESULTS_OR_CORRECT', // Should return no results or Swiss properties
    mapping_type: 'coordinates'
  },
  {
    id: 4,
    name: 'Verbier (Coordinate-based)',
    location: 'Verbier',
    dates: { arrival: '2026-01-28', departure: '2026-02-01' },
    persons: '27,29',
    expected: 'NO_RESULTS', // Should return no results with helpful message
    mapping_type: 'coordinates'
  },
  {
    id: 5,
    name: 'Livigno (Coordinate-based)',
    location: 'Livigno',
    dates: { arrival: '2026-01-20', departure: '2026-01-24' },
    persons: '28,31',
    expected: 'NO_RESULTS_OR_CORRECT', // Should return no results or Italian properties
    mapping_type: 'coordinates'
  },
  {
    id: 6,
    name: 'Innsbruck (Coordinate-based)',
    location: 'Innsbruck',
    dates: { arrival: '2026-02-10', departure: '2026-02-14' },
    persons: '32,29',
    expected: 'NO_RESULTS_OR_CORRECT', // Should return no results or Austrian properties
    mapping_type: 'coordinates'
  },
  {
    id: 7,
    name: 'St Anton (Coordinate-based)',
    location: 'St Anton',
    dates: { arrival: '2026-01-18', departure: '2026-01-22' },
    persons: '25,27',
    expected: 'NO_RESULTS_OR_CORRECT', // Should return no results or Austrian properties
    mapping_type: 'coordinates'
  },
  {
    id: 8,
    name: 'Val d\'Isère (Coordinate-based)',
    location: 'Val d\'Isère',
    dates: { arrival: '2026-02-15', departure: '2026-02-19' },
    persons: '30,32',
    expected: 'NO_RESULTS_OR_CORRECT', // Should return no results or French properties
    mapping_type: 'coordinates'
  },
  {
    id: 9,
    name: 'Cortina (Coordinate-based)',
    location: 'Cortina',
    dates: { arrival: '2026-01-12', departure: '2026-01-16' },
    persons: '35,37',
    expected: 'NO_RESULTS_OR_CORRECT', // Should return no results or Italian properties
    mapping_type: 'coordinates'
  },
  {
    id: 10,
    name: 'Unknown Location (Should fail gracefully)',
    location: 'NonExistentSkiResort',
    dates: { arrival: '2026-02-01', departure: '2026-02-05' },
    persons: '30,30',
    expected: 'NO_RESULTS', // Should return helpful error message
    mapping_type: 'none'
  }
];

// Location validation rules for checking results
const LOCATION_VALIDATION = {
  'alta badia': ['italy', 'italian', 'dolomites', 'san cassiano', 'corvara', 'badia'],
  'chamonix': ['france', 'french', 'chamonix', 'mont blanc'],
  'zermatt': ['switzerland', 'swiss', 'zermatt', 'valais'],
  'verbier': ['switzerland', 'swiss', 'verbier', 'valais'],
  'livigno': ['italy', 'italian', 'livigno', 'lombardy'],
  'innsbruck': ['austria', 'austrian', 'innsbruck', 'tirol', 'tyrol'],
  'st anton': ['austria', 'austrian', 'st anton', 'arlberg'],
  'val d\'isère': ['france', 'french', 'val d\'isère', 'savoie'],
  'cortina': ['italy', 'italian', 'cortina', 'dolomites', 'ampezzo']
};

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: 'Invalid JSON response', raw: data });
        }
      });
    }).on('error', reject);
  });
}

function validateLocationMatch(results, requestedLocation) {
  if (!results?.accommodations || results.accommodations.length === 0) {
    return { valid: false, reason: 'No accommodations found' };
  }

  const normalizedRequested = requestedLocation.toLowerCase().trim();
  const validationKeywords = LOCATION_VALIDATION[normalizedRequested];
  
  if (!validationKeywords) {
    return { valid: true, reason: 'No validation rules defined - allowing result' };
  }

  for (const accommodation of results.accommodations) {
    const locationText = [
      accommodation.location?.city,
      accommodation.location?.country,
      accommodation.location?.resort,
      accommodation.location?.region,
      accommodation.location?.full_address,
      accommodation.name
    ].filter(Boolean).join(' ').toLowerCase();

    const hasMatch = validationKeywords.some(keyword => 
      locationText.includes(keyword.toLowerCase())
    );

    if (hasMatch) {
      return { valid: true, reason: 'Location match found', matched_text: locationText };
    }
  }

  return { 
    valid: false, 
    reason: 'No location matches found',
    expected_keywords: validationKeywords,
    actual_locations: results.accommodations.map(acc => ({
      name: acc.name,
      city: acc.location?.city,
      country: acc.location?.country,
      resort: acc.location?.resort
    }))
  };
}

async function runTest(scenario) {
  console.log(`\n🧪 Test ${scenario.id}: ${scenario.name}`);
  console.log(`   Location: ${scenario.location}`);
  console.log(`   Dates: ${scenario.dates.arrival} to ${scenario.dates.departure}`);
  console.log(`   Mapping: ${scenario.mapping_type}`);

  const url = `${MCP_SERVER_URL}/search?` + new URLSearchParams({
    location: scenario.location,
    arrival_date: scenario.dates.arrival,
    departure_date: scenario.dates.departure,
    persons_ages: scenario.persons,
    currency: 'EUR'
  });

  try {
    const result = await makeRequest(url);
    
    if (result.error) {
      if (scenario.expected === 'NO_RESULTS') {
        console.log(`   ✅ PASS: Correctly returned no results`);
        console.log(`   📝 Error: ${result.error}`);
        if (result.suggestions) {
          console.log(`   💡 Suggestions provided: ${result.suggestions.length} items`);
        }
        return { status: 'PASS', reason: 'Correct no-results response' };
      } else {
        console.log(`   ❌ FAIL: Unexpected error when results expected`);
        console.log(`   📝 Error: ${result.error}`);
        return { status: 'FAIL', reason: 'Unexpected error' };
      }
    }

    if (result.accommodations && result.accommodations.length > 0) {
      const validation = validateLocationMatch(result, scenario.location);
      
      if (validation.valid) {
        console.log(`   ✅ PASS: Found ${result.accommodations.length} valid accommodations`);
        console.log(`   🏨 Sample: ${result.accommodations[0].name} in ${result.accommodations[0].location?.city}, ${result.accommodations[0].location?.country}`);
        return { status: 'PASS', reason: 'Valid location match', count: result.accommodations.length };
      } else {
        console.log(`   ❌ FAIL: Location validation failed`);
        console.log(`   📍 Reason: ${validation.reason}`);
        if (validation.actual_locations) {
          console.log(`   🏨 Wrong locations:`, validation.actual_locations.slice(0, 2));
        }
        return { status: 'FAIL', reason: 'Invalid location match', validation };
      }
    } else {
      if (scenario.expected === 'NO_RESULTS' || scenario.expected === 'NO_RESULTS_OR_CORRECT') {
        console.log(`   ✅ PASS: Correctly returned no results`);
        return { status: 'PASS', reason: 'Correct empty response' };
      } else {
        console.log(`   ❌ FAIL: No results when accommodations expected`);
        return { status: 'FAIL', reason: 'Unexpected empty response' };
      }
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return { status: 'ERROR', reason: error.message };
  }
}

async function runAllTests() {
  console.log('🎯 FINAL COMPREHENSIVE TEST - MountVacation MCP Server');
  console.log('=' .repeat(60));
  console.log(`📡 Testing: ${MCP_SERVER_URL}`);
  console.log(`📅 Date: ${new Date().toISOString()}`);

  const results = [];
  
  for (const scenario of TEST_SCENARIOS) {
    const result = await runTest(scenario);
    results.push({ scenario, result });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.result.status === 'PASS').length;
  const failed = results.filter(r => r.result.status === 'FAIL').length;
  const errors = results.filter(r => r.result.status === 'ERROR').length;

  console.log(`✅ PASSED: ${passed}/${TEST_SCENARIOS.length}`);
  console.log(`❌ FAILED: ${failed}/${TEST_SCENARIOS.length}`);
  console.log(`🚨 ERRORS: ${errors}/${TEST_SCENARIOS.length}`);

  if (failed > 0) {
    console.log('\n🔍 FAILED TESTS:');
    results.filter(r => r.result.status === 'FAIL').forEach(({ scenario, result }) => {
      console.log(`   • ${scenario.name}: ${result.reason}`);
    });
  }

  if (errors > 0) {
    console.log('\n🚨 ERROR TESTS:');
    results.filter(r => r.result.status === 'ERROR').forEach(({ scenario, result }) => {
      console.log(`   • ${scenario.name}: ${result.reason}`);
    });
  }

  console.log('\n🎯 OVERALL STATUS:', passed === TEST_SCENARIOS.length ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  return { passed, failed, errors, total: TEST_SCENARIOS.length };
}

// Run the tests
runAllTests().catch(console.error);
