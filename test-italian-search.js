#!/usr/bin/env node

const SERVER_URL = 'https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp';

async function testItalianSearch() {
  console.log('🇮🇹 Testing Italian Ski Resort Search...\n');

  const testCases = [
    {
      name: 'Italy ski resort (generic)',
      location: 'Italy ski resort',
      expected: 'Should find Italian ski accommodations'
    },
    {
      name: 'Cortina d\'Ampezzo',
      location: 'Cortina d\'Ampezzo',
      expected: 'Famous Dolomites ski resort'
    },
    {
      name: 'Madonna di Campiglio',
      location: 'Madonna di Campiglio',
      expected: 'Trentino ski resort'
    },
    {
      name: 'Val Gardena',
      location: 'Val Gardena',
      expected: 'South Tyrol ski area'
    },
    {
      name: 'Italian Dolomites',
      location: 'Italian Dolomites',
      expected: 'Dolomites region accommodations'
    }
  ];

  for (const testCase of testCases) {
    console.log(`🔍 Testing: ${testCase.name}`);
    console.log(`📍 Location: "${testCase.location}"`);
    console.log(`🎯 Expected: ${testCase.expected}`);
    
    try {
      const searchRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'search_accommodations',
          arguments: {
            location: testCase.location,
            arrival_date: '2026-01-15',
            departure_date: '2026-01-20',
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
          console.log(`✅ SUCCESS: Found ${resultData.accommodations.length} accommodations`);
          
          // Show first result details
          const acc = resultData.accommodations[0];
          console.log(`   🏨 ${acc.name}`);
          console.log(`   📍 ${acc.location.full_address}`);
          console.log(`   💰 ${acc.pricing.total_price} ${acc.pricing.currency}`);
          console.log(`   🔗 ${acc.property_page_url !== 'N/A' ? 'Has property link' : 'No property link'}`);
          
        } else {
          console.log(`❌ FAILED: No accommodations found`);
          if (resultData.error) {
            console.log(`   Error: ${resultData.error}`);
          }
        }
      } else {
        console.log(`❌ FAILED: Invalid response format`);
        console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('🎉 Italian Search Test Complete!');
}

testItalianSearch().catch(console.error);
