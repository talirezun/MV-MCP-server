#!/usr/bin/env node

/**
 * Test script for MountVacation MCP Server Pagination Features
 * Tests the new pagination capabilities against the production worker
 */

const https = require('https');

const WORKER_URL = 'mountvacation-mcp-final.4thtech.workers.dev';

// Test scenarios for pagination
const testScenarios = [
  {
    name: "Slovenia Quick Search (First Batch)",
    tool: "search_accommodations",
    params: {
      location: "Slovenia",
      arrival_date: "2026-01-15",
      departure_date: "2026-01-20",
      persons_ages: "30,30",
      currency: "EUR"
    }
  },
  {
    name: "Slovenia Complete Search (All Pages)",
    tool: "search_accommodations_complete",
    params: {
      location: "Slovenia",
      arrival_date: "2026-01-15",
      departure_date: "2026-01-20",
      persons_ages: "30,30",
      currency: "EUR",
      max_total_results: 50,
      max_pages: 5
    }
  },
  {
    name: "Italian Dolomites Complete Search",
    tool: "search_accommodations_complete",
    params: {
      location: "Italian Dolomites",
      arrival_date: "2026-02-15",
      departure_date: "2026-02-22",
      persons_ages: "30,28",
      currency: "EUR",
      max_total_results: 30,
      max_pages: 3
    }
  }
];

async function makeRequest(tool, params) {
  return new Promise((resolve, reject) => {
    const mcpRequest = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: tool,
        arguments: params
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
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

async function runTest(scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📋 Tool: ${scenario.tool}`);
  console.log(`📍 Search: ${scenario.params.location || `Resort ID ${scenario.params.resort_id}` || 'Unknown'}`);
  
  try {
    const startTime = Date.now();
    const response = await makeRequest(scenario.tool, scenario.params);
    const duration = Date.now() - startTime;
    
    if (response.error) {
      console.log(`❌ Error: ${response.error.message}`);
      return { success: false, error: response.error.message };
    }
    
    const result = JSON.parse(response.result.content[0].text);
    
    if (result.error) {
      console.log(`❌ API Error: ${result.error}`);
      return { success: false, error: result.error };
    }
    
    const accommodations = result.accommodations || [];
    const pagination = result.pagination || {};
    const searchSummary = result.search_summary || {};
    
    console.log(`✅ Success! Found ${accommodations.length} accommodations`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`💰 Currency: ${searchSummary.currency || 'N/A'}`);
    console.log(`🗓️  Dates: ${searchSummary.arrival_date} to ${searchSummary.departure_date}`);
    
    if (searchSummary.pages_fetched) {
      console.log(`📄 Pages fetched: ${searchSummary.pages_fetched}`);
      console.log(`🔄 Collection method: ${searchSummary.collection_method}`);
    }
    
    if (pagination.has_more_pages) {
      console.log(`📄 More pages available: ${pagination.has_more_pages}`);
      console.log(`🔗 Next page URL: ${pagination.next_page_url ? 'Available' : 'None'}`);
    }
    
    // Show first few accommodations
    if (accommodations.length > 0) {
      console.log(`\n🏨 Sample accommodations:`);
      accommodations.slice(0, 3).forEach((acc, index) => {
        console.log(`  ${index + 1}. ${acc.name} - ${acc.location?.city || 'Unknown city'}`);
        console.log(`     💰 From ${acc.booking_offers?.[0]?.price || 'N/A'} ${acc.booking_offers?.[0]?.currency || ''}`);
      });
    }
    
    return { 
      success: true, 
      count: accommodations.length, 
      duration,
      pagination: pagination.has_more_pages,
      pages_fetched: searchSummary.pages_fetched || 1
    };
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🎿 MountVacation MCP Server - Pagination Testing');
  console.log('=' .repeat(60));
  console.log(`🌐 Worker URL: ${WORKER_URL}`);
  
  const results = [];
  
  for (const scenario of testScenarios) {
    const result = await runTest(scenario);
    results.push({ scenario: scenario.name, ...result });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful tests: ${successful.length}/${results.length}`);
  console.log(`❌ Failed tests: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n🎯 Successful Results:');
    successful.forEach(result => {
      console.log(`  • ${result.scenario}: ${result.count} results in ${result.duration}ms`);
      if (result.pages_fetched > 1) {
        console.log(`    📄 Fetched ${result.pages_fetched} pages`);
      }
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Results:');
    failed.forEach(result => {
      console.log(`  • ${result.scenario}: ${result.error}`);
    });
  }
  
  console.log('\n🏁 Testing complete!');
}

main().catch(console.error);
