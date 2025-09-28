#!/usr/bin/env node

/**
 * Website vs MCP Server Comparison Test
 * 
 * This script compares results from the MountVacation website with our MCP server
 * to identify location mapping issues and validate functionality.
 */

const https = require('https');

// Test scenarios based on website observations
const testScenarios = [
  {
    name: "Bohinj, Slovenia - Basic Test",
    location: "Bohinj",
    arrival: "2026-01-15",
    departure: "2026-01-16",
    persons_ages: "30,30",
    website_url: "https://www.mountvacation.co.uk/search?personsages=18%2C18&arrival=2026-01-15&departure=2026-01-16&idresort=76",
    expected_results: [
      "Art Hotel Kristal (4-star, Ribčev laz, £68-£157)",
      "Hotel Bohinj (4-star, Ribčev laz, £157-£219)", 
      "Hiša Pr Pristavc (Guest house, Bohinjska Bistrica, £103-£105)",
      "Alpik Chalets Bohinj (4-star chalets, Ukanc, £130-£281)",
      "Hotel Jezero (4-star, Ribčev laz, £103-£152)",
      "House Budkovič (Hostel, Bohinjska Bistrica, £50-£54)"
    ],
    resort_id: 76
  },
  {
    name: "Kranjska Gora, Slovenia",
    location: "Kranjska Gora", 
    arrival: "2026-01-15",
    departure: "2026-01-16",
    persons_ages: "30,30",
    website_note: "Available in Slovenia dropdown"
  },
  {
    name: "Bled, Slovenia",
    location: "Bled",
    arrival: "2026-01-15", 
    departure: "2026-01-16",
    persons_ages: "30,30",
    website_note: "Available in Slovenia dropdown"
  },
  {
    name: "Madonna di Campiglio, Italy",
    location: "Madonna di Campiglio",
    arrival: "2026-01-15",
    departure: "2026-01-16", 
    persons_ages: "30,30",
    website_note: "Popular Italian Dolomites resort"
  },
  {
    name: "Val Gardena, Italy",
    location: "Val Gardena",
    arrival: "2026-01-15",
    departure: "2026-01-16",
    persons_ages: "30,30", 
    website_note: "Popular Italian Dolomites resort"
  }
];

// MCP Server configuration
const MCP_SERVER_URL = 'https://mountvacation-mcp-final.4thtech.workers.dev/mcp';
const API_KEY = 'demo-key-for-testing';

/**
 * Test MCP server with given parameters
 */
async function testMCPServer(scenario) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "search_accommodations",
        arguments: {
          location: scenario.location,
          arrival_date: scenario.arrival,
          departure_date: scenario.departure,
          persons_ages: scenario.persons_ages,
          currency: "GBP",
          language: "en"
        }
      }
    });

    const options = {
      hostname: 'mountvacation-mcp-final.4thtech.workers.dev',
      port: 443,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MountVacation-API-Key': API_KEY,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Run comprehensive comparison test
 */
async function runComparisonTest() {
  console.log('🏔️  MountVacation Website vs MCP Server Comparison Test');
  console.log('=' .repeat(70));
  console.log();

  const results = {
    total_tests: testScenarios.length,
    successful_searches: 0,
    failed_searches: 0,
    location_mapping_issues: [],
    working_locations: [],
    detailed_results: []
  };

  for (const scenario of testScenarios) {
    console.log(`📍 Testing: ${scenario.name}`);
    console.log(`   Location: ${scenario.location}`);
    console.log(`   Dates: ${scenario.arrival} to ${scenario.departure}`);
    console.log(`   Persons: ${scenario.persons_ages}`);
    
    if (scenario.website_url) {
      console.log(`   Website URL: ${scenario.website_url}`);
    }
    if (scenario.resort_id) {
      console.log(`   Resort ID: ${scenario.resort_id}`);
    }
    if (scenario.website_note) {
      console.log(`   Website Note: ${scenario.website_note}`);
    }

    try {
      const mcpResponse = await testMCPServer(scenario);
      
      if (mcpResponse.result && mcpResponse.result.content) {
        const content = JSON.parse(mcpResponse.result.content[0].text);
        
        if (content.error) {
          console.log(`   ❌ MCP Result: ${content.error}`);
          results.failed_searches++;
          results.location_mapping_issues.push({
            location: scenario.location,
            error: content.error,
            suggestions: content.suggestions
          });
        } else {
          console.log(`   ✅ MCP Result: Found ${content.accommodations?.length || 0} accommodations`);
          results.successful_searches++;
          results.working_locations.push(scenario.location);
        }
      } else if (mcpResponse.error) {
        console.log(`   ❌ MCP Error: ${mcpResponse.error.message}`);
        results.failed_searches++;
      }

      results.detailed_results.push({
        scenario: scenario.name,
        location: scenario.location,
        mcp_response: mcpResponse
      });

    } catch (error) {
      console.log(`   ❌ Test Error: ${error.message}`);
      results.failed_searches++;
    }

    console.log();
  }

  // Summary Report
  console.log('📊 COMPARISON SUMMARY');
  console.log('=' .repeat(70));
  console.log(`Total Tests: ${results.total_tests}`);
  console.log(`Successful Searches: ${results.successful_searches}`);
  console.log(`Failed Searches: ${results.failed_searches}`);
  console.log(`Success Rate: ${((results.successful_searches / results.total_tests) * 100).toFixed(1)}%`);
  console.log();

  if (results.working_locations.length > 0) {
    console.log('✅ Working Locations:');
    results.working_locations.forEach(loc => console.log(`   - ${loc}`));
    console.log();
  }

  if (results.location_mapping_issues.length > 0) {
    console.log('❌ Location Mapping Issues:');
    results.location_mapping_issues.forEach(issue => {
      console.log(`   - ${issue.location}: ${issue.error}`);
    });
    console.log();
  }

  // Critical Findings
  console.log('🔍 CRITICAL FINDINGS');
  console.log('=' .repeat(70));
  
  if (results.failed_searches === results.total_tests) {
    console.log('🚨 CRITICAL: ALL LOCATION SEARCHES FAILED');
    console.log('   The location mapping system is completely broken.');
    console.log('   Website shows accommodations but MCP server finds none.');
    console.log();
  }

  console.log('📋 NEXT STEPS REQUIRED:');
  console.log('1. Debug location mapping system in mountvacation-client.ts');
  console.log('2. Verify resort ID mappings (e.g., Bohinj = resort ID 76)');
  console.log('3. Test coordinate-based searches as fallback');
  console.log('4. Implement proper ID mapping APIs integration');
  console.log('5. Add validation for location search results');

  return results;
}

// Run the test
if (require.main === module) {
  runComparisonTest()
    .then(results => {
      console.log('\n✅ Comparison test completed');
      process.exit(results.failed_searches > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { runComparisonTest, testMCPServer };
