#!/usr/bin/env node

const SERVER_URL = 'https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp';

async function testActualCoverage() {
  console.log('🔍 Testing Actual MountVacation Coverage...\n');

  const testDestinations = [
    // Known ski destinations that should work
    'Madonna di Campiglio',
    'Cortina d\'Ampezzo', 
    'Val Gardena',
    'Alta Badia',
    'Canazei',
    'Livigno',
    'Bormio',
    'Cervinia',
    'Courmayeur',
    'La Thuile',
    
    // French ski resorts
    'Chamonix',
    'Val d\'Isère',
    'Tignes',
    'Courchevel',
    'Méribel',
    'Les Deux Alpes',
    'Alpe d\'Huez',
    
    // Austrian ski resorts
    'Innsbruck',
    'Kitzbühel',
    'Zell am See',
    'Saalbach',
    'St. Anton',
    
    // Swiss ski resorts
    'Zermatt',
    'St. Moritz',
    'Verbier',
    'Davos',
    'Grindelwald',
    
    // Slovenian destinations (since we're getting these results)
    'Ljubljana',
    'Bled',
    'Kranjska Gora',
    'Bohinj',
    'Portorož',
    
    // Croatian destinations
    'Zagreb',
    'Split',
    'Dubrovnik',
    'Pula',
    'Rovinj',
    
    // Generic terms
    'Alps',
    'Italian Alps',
    'French Alps',
    'Austrian Alps',
    'Swiss Alps',
    'Dolomites',
    'Italian Dolomites'
  ];

  let workingDestinations = [];
  let failedDestinations = [];

  for (const location of testDestinations) {
    console.log(`🔍 Testing: ${location}`);
    
    try {
      const searchRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'search_accommodations',
          arguments: {
            location: location,
            arrival_date: '2026-02-15',
            departure_date: '2026-02-20',
            persons_ages: '30,30',
            currency: 'EUR',
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
          console.log(`   ✅ SUCCESS: Found ${resultData.accommodations.length} accommodations`);
          
          const acc = resultData.accommodations[0];
          console.log(`   🏨 ${acc.name}`);
          console.log(`   📍 ${acc.location.full_address}`);
          console.log(`   💰 ${acc.pricing.total_price} ${acc.pricing.currency}`);
          
          workingDestinations.push({
            search: location,
            result: acc.location.full_address,
            name: acc.name,
            price: acc.pricing.total_price
          });
          
        } else {
          console.log(`   ❌ FAILED: No accommodations found`);
          failedDestinations.push(location);
        }
      } else {
        console.log(`   ❌ FAILED: Invalid response`);
        failedDestinations.push(location);
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failedDestinations.push(location);
    }
    
    console.log('');
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  console.log('📊 ACTUAL COVERAGE ANALYSIS:');
  console.log(`✅ Working destinations: ${workingDestinations.length}`);
  console.log(`❌ Failed destinations: ${failedDestinations.length}`);
  console.log(`📈 Success rate: ${Math.round((workingDestinations.length/(workingDestinations.length + failedDestinations.length)) * 100)}%`);
  
  console.log('\n🎯 WORKING DESTINATIONS:');
  workingDestinations.forEach((dest, index) => {
    console.log(`${index + 1}. "${dest.search}" → ${dest.result}`);
  });
  
  console.log('\n❌ FAILED DESTINATIONS:');
  failedDestinations.forEach((dest, index) => {
    console.log(`${index + 1}. "${dest}"`);
  });
  
  // Analyze patterns
  console.log('\n🔍 COVERAGE ANALYSIS:');
  const countries = {};
  workingDestinations.forEach(dest => {
    const address = dest.result.toLowerCase();
    if (address.includes('italy')) countries.Italy = (countries.Italy || 0) + 1;
    if (address.includes('slovenia')) countries.Slovenia = (countries.Slovenia || 0) + 1;
    if (address.includes('croatia')) countries.Croatia = (countries.Croatia || 0) + 1;
    if (address.includes('france')) countries.France = (countries.France || 0) + 1;
    if (address.includes('austria')) countries.Austria = (countries.Austria || 0) + 1;
    if (address.includes('switzerland')) countries.Switzerland = (countries.Switzerland || 0) + 1;
  });
  
  console.log('Countries with results:');
  Object.entries(countries).forEach(([country, count]) => {
    console.log(`  ${country}: ${count} results`);
  });
}

testActualCoverage().catch(console.error);
