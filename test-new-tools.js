#!/usr/bin/env node

const SERVER_URL = 'https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp';

async function testNewTools() {
  console.log('🔧 Testing New MountVacation MCP Tools...\n');

  // Test 1: List all available tools
  console.log('1️⃣ Testing tools/list...');
  try {
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };

    const response = await fetch(SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toolsRequest)
    });

    const data = await response.json();
    
    if (data.result?.tools) {
      console.log(`✅ SUCCESS: Found ${data.result.tools.length} tools`);
      data.result.tools.forEach((tool, index) => {
        console.log(`   ${index + 1}. ${tool.name} - ${tool.description.substring(0, 80)}...`);
      });
    } else {
      console.log(`❌ FAILED: ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
  
  console.log('');

  // Test 2: Test enhanced search_accommodations with new parameters
  console.log('2️⃣ Testing enhanced search_accommodations...');
  try {
    const searchRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'search_accommodations',
        arguments: {
          location: 'Madonna di Campiglio',
          arrival_date: '2026-02-15',
          departure_date: '2026-02-20',
          persons_ages: '30,28',
          currency: 'EUR',
          language: 'en',
          include_additional_fees: true,
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
        console.log(`✅ SUCCESS: Found ${resultData.accommodations.length} accommodations`);
        const acc = resultData.accommodations[0];
        console.log(`   🏨 ${acc.name}`);
        console.log(`   📍 ${acc.location.full_address}`);
        console.log(`   💰 ${acc.pricing.total_price} ${acc.pricing.currency}`);
        console.log(`   🔗 ${acc.property_page_url !== 'N/A' ? 'Has booking link' : 'No booking link'}`);
        
        // Check for enhanced data
        if (acc.amenities) {
          console.log(`   🏊 Amenities: ${Object.keys(acc.amenities).filter(k => acc.amenities[k]).slice(0, 3).join(', ')}`);
        }
        if (acc.distances) {
          console.log(`   📏 Distances: Resort ${acc.distances.resort}m, Center ${acc.distances.center}m`);
        }
      } else {
        console.log(`❌ FAILED: No accommodations found`);
        if (resultData.error) {
          console.log(`   Error: ${resultData.error}`);
        }
      }
    } else {
      console.log(`❌ FAILED: Invalid response format`);
      if (data.error) {
        console.log(`   Error: ${data.error.message}`);
      }
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
  
  console.log('');

  // Test 3: Test search with nights instead of departure_date
  console.log('3️⃣ Testing search with nights parameter...');
  try {
    const searchRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'search_accommodations',
        arguments: {
          location: 'Val Gardena',
          arrival_date: '2026-03-10',
          nights: 5,
          persons: 2,
          currency: 'USD',
          max_results: 2
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
        console.log(`✅ SUCCESS: Found ${resultData.accommodations.length} accommodations`);
        const acc = resultData.accommodations[0];
        console.log(`   🏨 ${acc.name}`);
        console.log(`   💰 ${acc.pricing.total_price} ${acc.pricing.currency} (should be USD)`);
      } else {
        console.log(`❌ FAILED: No accommodations found`);
      }
    } else {
      console.log(`❌ FAILED: Invalid response`);
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
  
  console.log('');

  // Test 4: Test new search_by_resort_id tool (if implemented)
  console.log('4️⃣ Testing search_by_resort_id tool...');
  try {
    const searchRequest = {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'search_by_resort_id',
        arguments: {
          resort_id: 142, // Example resort ID
          arrival_date: '2026-02-15',
          departure_date: '2026-02-20',
          persons_ages: '30,30',
          currency: 'EUR'
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
        console.log(`✅ SUCCESS: Found ${resultData.accommodations.length} accommodations by resort ID`);
      } else {
        console.log(`❌ FAILED: No accommodations found for resort ID 142`);
      }
    } else if (data.error) {
      console.log(`⚠️  TOOL NOT IMPLEMENTED: ${data.error.message}`);
    } else {
      console.log(`❌ FAILED: Invalid response`);
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
  
  console.log('');

  // Test 5: Test pagination
  console.log('5️⃣ Testing pagination...');
  try {
    const searchRequest = {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'search_accommodations',
        arguments: {
          location: 'Alps',
          arrival_date: '2026-02-15',
          departure_date: '2026-02-20',
          persons_ages: '30,30',
          max_results: 2,
          page: 1
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
        console.log(`✅ SUCCESS: Found ${resultData.accommodations.length} accommodations (page 1)`);
        if (resultData.pagination) {
          console.log(`   📄 Pagination info available: ${JSON.stringify(resultData.pagination)}`);
        } else {
          console.log(`   📄 No pagination info (may not be implemented yet)`);
        }
      } else {
        console.log(`❌ FAILED: No accommodations found`);
      }
    } else {
      console.log(`❌ FAILED: Invalid response`);
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }

  console.log('\n🎉 New Tools Testing Complete!');
}

testNewTools().catch(console.error);
