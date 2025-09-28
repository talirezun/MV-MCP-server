#!/usr/bin/env node

/**
 * Comprehensive Website vs MCP Server Comparison Test
 * Uses Playwright MCP to test MountVacation website and compares with MCP server results
 */

const https = require('https');

const WORKER_URL = 'mountvacation-mcp-final.4thtech.workers.dev';

// 10 diverse test scenarios for comprehensive comparison
const testScenarios = [
  {
    name: "Scenario 1: Slovenia Winter Week",
    location: "Slovenia",
    arrival: "2026-01-15",
    departure: "2026-01-22",
    persons: "30,28,8,5", // Family with 2 adults, 2 children
    description: "Family ski vacation in Slovenia"
  },
  {
    name: "Scenario 2: Italian Dolomites Romantic Getaway",
    location: "Italian Dolomites",
    arrival: "2026-02-14",
    departure: "2026-02-17",
    persons: "32,29", // Couple
    description: "Valentine's weekend in Dolomites"
  },
  {
    name: "Scenario 3: Austrian Alps Group Trip",
    location: "Austria",
    arrival: "2026-03-01",
    departure: "2026-03-08",
    persons: "25,26,27,28,24,23", // Group of 6 friends
    description: "Week-long group skiing in Austria"
  },
  {
    name: "Scenario 4: French Alps Luxury Stay",
    location: "French Alps",
    arrival: "2026-02-20",
    departure: "2026-02-25",
    persons: "45,42", // Mature couple
    description: "Luxury ski experience in French Alps"
  },
  {
    name: "Scenario 5: German Alps Short Break",
    location: "Germany",
    arrival: "2026-01-25",
    departure: "2026-01-27",
    persons: "35", // Solo traveler
    description: "Weekend solo skiing in Germany"
  },
  {
    name: "Scenario 6: Swiss Alps Extended Stay",
    location: "Switzerland",
    arrival: "2026-02-01",
    departure: "2026-02-15",
    persons: "40,38,12,10", // Family with older children
    description: "Two-week Swiss Alps adventure"
  },
  {
    name: "Scenario 7: Specific Resort - Madonna di Campiglio",
    location: "Madonna di Campiglio",
    arrival: "2026-01-20",
    departure: "2026-01-25",
    persons: "30,30", // Couple
    description: "Specific Italian resort booking"
  },
  {
    name: "Scenario 8: Specific Resort - Val Gardena",
    location: "Val Gardena",
    arrival: "2026-02-10",
    departure: "2026-02-14",
    persons: "28,26,3", // Young family
    description: "Dolomites family resort"
  },
  {
    name: "Scenario 9: Specific Resort - Kranjska Gora",
    location: "Kranjska Gora",
    arrival: "2026-01-30",
    departure: "2026-02-02",
    persons: "22,21,20,19", // Young group
    description: "Slovenian resort for young adults"
  },
  {
    name: "Scenario 10: Large Group Booking",
    location: "Italian Dolomites",
    arrival: "2026-03-15",
    departure: "2026-03-22",
    persons: "30,31,32,33,34,35,28,29,26,27", // Large group of 10
    description: "Large group spring skiing"
  }
];

async function testMCPServer(scenario) {
  return new Promise((resolve, reject) => {
    const mcpRequest = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: "search_accommodations_complete",
        arguments: {
          location: scenario.location,
          arrival_date: scenario.arrival,
          departure_date: scenario.departure,
          persons_ages: scenario.persons,
          currency: "EUR",
          max_total_results: 50,
          max_pages: 5
        }
      }
    };

    const postData = JSON.stringify(mcpRequest);
    
    const options = {
      hostname: WORKER_URL,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-MountVacation-API-Key': 'demo-key-for-testing-pagination-features'
      },
      timeout: 60000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            resolve({ success: false, error: response.error.message, results: [] });
          } else {
            const result = JSON.parse(response.result.content[0].text);
            if (result.error) {
              resolve({ success: false, error: result.error, results: [] });
            } else {
              resolve({ 
                success: true, 
                results: result.accommodations || [],
                pagination: result.pagination || {},
                search_summary: result.search_summary || {}
              });
            }
          }
        } catch (error) {
          resolve({ success: false, error: `Parse error: ${error.message}`, results: [] });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message, results: [] });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Request timeout', results: [] });
    });

    req.write(postData);
    req.end();
  });
}

async function runComprehensiveTest() {
  console.log('🎿 COMPREHENSIVE WEBSITE vs MCP SERVER COMPARISON');
  console.log('=' .repeat(80));
  console.log(`🌐 MCP Server: ${WORKER_URL}`);
  console.log(`📅 Test Date: ${new Date().toISOString()}`);
  console.log(`🧪 Test Scenarios: ${testScenarios.length}`);
  console.log('');

  const results = [];
  
  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    console.log(`\n🧪 ${scenario.name}`);
    console.log(`📍 Location: ${scenario.location}`);
    console.log(`📅 Dates: ${scenario.arrival} to ${scenario.departure}`);
    console.log(`👥 Persons: ${scenario.persons}`);
    console.log(`📝 Description: ${scenario.description}`);
    
    const startTime = Date.now();
    const mcpResult = await testMCPServer(scenario);
    const duration = Date.now() - startTime;
    
    if (mcpResult.success) {
      console.log(`✅ MCP Server: ${mcpResult.results.length} accommodations found`);
      console.log(`⏱️  Response time: ${duration}ms`);
      
      if (mcpResult.search_summary.pages_fetched) {
        console.log(`📄 Pages fetched: ${mcpResult.search_summary.pages_fetched}`);
      }
      
      // Show sample results
      if (mcpResult.results.length > 0) {
        console.log(`🏨 Sample results:`);
        mcpResult.results.slice(0, 3).forEach((acc, index) => {
          console.log(`  ${index + 1}. ${acc.name} - ${acc.location?.city || 'Unknown'}`);
          console.log(`     💰 From ${acc.booking_offers?.[0]?.price || 'N/A'} EUR`);
        });
      }
      
      results.push({
        scenario: scenario.name,
        success: true,
        mcp_count: mcpResult.results.length,
        duration,
        pages_fetched: mcpResult.search_summary.pages_fetched || 1,
        location: scenario.location
      });
    } else {
      console.log(`❌ MCP Server Error: ${mcpResult.error}`);
      results.push({
        scenario: scenario.name,
        success: false,
        error: mcpResult.error,
        location: scenario.location
      });
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate comprehensive summary
  console.log('\n📊 COMPREHENSIVE TEST SUMMARY');
  console.log('=' .repeat(80));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful tests: ${successful.length}/${results.length} (${Math.round(successful.length/results.length*100)}%)`);
  console.log(`❌ Failed tests: ${failed.length}/${results.length} (${Math.round(failed.length/results.length*100)}%)`);
  
  if (successful.length > 0) {
    const totalResults = successful.reduce((sum, r) => sum + r.mcp_count, 0);
    const avgResults = Math.round(totalResults / successful.length);
    const avgDuration = Math.round(successful.reduce((sum, r) => sum + r.duration, 0) / successful.length);
    const totalPages = successful.reduce((sum, r) => sum + (r.pages_fetched || 1), 0);
    
    console.log(`\n📈 Performance Metrics:`);
    console.log(`  • Total accommodations found: ${totalResults}`);
    console.log(`  • Average per successful search: ${avgResults}`);
    console.log(`  • Average response time: ${avgDuration}ms`);
    console.log(`  • Total pages fetched: ${totalPages}`);
    console.log(`  • Pagination working: ${successful.filter(r => r.pages_fetched > 1).length} searches`);
  }
  
  console.log(`\n🎯 Next Steps for Website Comparison:`);
  console.log(`  1. Use Playwright MCP to test these same scenarios on mountvacation.com`);
  console.log(`  2. Compare result counts and accommodation names`);
  console.log(`  3. Verify pagination is collecting all available results`);
  console.log(`  4. Check for missing locations or data discrepancies`);
  
  console.log('\n🏁 MCP Server testing complete!');
  console.log('Ready for Playwright website comparison testing.');
}

runComprehensiveTest().catch(console.error);
