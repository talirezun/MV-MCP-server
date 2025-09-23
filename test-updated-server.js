const SERVER_URL = 'https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev';
const MCP_URL = `${SERVER_URL}/mcp`;

async function testUpdatedServer() {
  console.log('🧪 Testing Updated MountVacation MCP Server...\n');

  // Test 1: Health Check
  console.log('1️⃣ Testing Health Check...');
  try {
    const healthResponse = await fetch(`${SERVER_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData.status);
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
    return;
  }

  // Test 2: Tools List
  console.log('\n2️⃣ Testing Tools List...');
  try {
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };

    const toolsResponse = await fetch(MCP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toolsRequest)
    });

    const toolsData = await toolsResponse.json();
    if (toolsData.result?.tools) {
      console.log('✅ Available Tools:');
      toolsData.result.tools.forEach(tool => {
        console.log(`   - ${tool.name}: ${tool.description.substring(0, 80)}...`);
      });
    } else {
      console.log('❌ No tools found');
    }
  } catch (error) {
    console.log('❌ Tools List Failed:', error.message);
  }

  // Test 3: Search Accommodations with Property Links
  console.log('\n3️⃣ Testing Accommodation Search (Madonna di Campiglio)...');
  try {
    const searchRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'search_accommodations',
        arguments: {
          location: 'Madonna di Campiglio',
          arrival_date: '2026-01-15',
          departure_date: '2026-01-22',
          persons_ages: '30,28',
          currency: 'EUR',
          max_results: 2
        }
      }
    };

    const searchResponse = await fetch(MCP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchRequest)
    });

    const searchData = await searchResponse.json();
    
    if (searchData.result?.accommodations) {
      console.log(`✅ Found ${searchData.result.accommodations.length} accommodations`);
      
      // Check first accommodation for property links
      const firstAccommodation = searchData.result.accommodations[0];
      console.log('\n📋 First Accommodation Details:');
      console.log(`   Name: ${firstAccommodation.name}`);
      console.log(`   Location: ${firstAccommodation.location.full_address}`);
      console.log(`   Price: ${firstAccommodation.pricing.total_price} ${firstAccommodation.pricing.currency}`);
      
      // Check for property links
      console.log('\n🔗 Property Links:');
      console.log(`   Property Page URL: ${firstAccommodation.property_page_url}`);
      console.log(`   Reservation URL: ${firstAccommodation.booking.reservation_url}`);
      console.log(`   Legacy Property URL: ${firstAccommodation.property_url}`);
      
      // Check for images
      console.log('\n🖼️ Images:');
      console.log(`   Main Images: ${firstAccommodation.images.length} images`);
      console.log(`   Thumbnail URLs: ${firstAccommodation.image_gallery.thumbnail_urls.length} thumbnails`);
      console.log(`   Full Size URLs: ${firstAccommodation.image_gallery.full_size_urls.length} full-size`);
      
      if (firstAccommodation.images.length > 0) {
        console.log(`   First Image: ${firstAccommodation.images[0]}`);
      }
      
      // Check for accommodation ID
      console.log('\n🆔 Property Details:');
      console.log(`   Accommodation ID: ${firstAccommodation.property_details.accommodation_id}`);
      console.log(`   Category: ${firstAccommodation.property_details.category}`);
      console.log(`   Type: ${firstAccommodation.property_details.type}`);
      
      // Check for coordinates
      if (firstAccommodation.location.coordinates) {
        console.log(`   Coordinates: ${firstAccommodation.location.coordinates.latitude}, ${firstAccommodation.location.coordinates.longitude}`);
      }
      
    } else {
      console.log('❌ No accommodations found');
      console.log('Response:', JSON.stringify(searchData, null, 2));
    }
  } catch (error) {
    console.log('❌ Search Failed:', error.message);
  }

  // Test 4: Test New Accommodation Details Tool (if we have an accommodation ID)
  console.log('\n4️⃣ Testing Get Accommodation Details...');
  try {
    // First get an accommodation ID from search
    const searchRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'search_accommodations',
        arguments: {
          location: 'Cortina d\'Ampezzo',
          arrival_date: '2026-01-15',
          departure_date: '2026-01-22',
          persons_ages: '30,28',
          max_results: 1
        }
      }
    };

    const searchResponse = await fetch(MCP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchRequest)
    });

    const searchData = await searchResponse.json();
    
    if (searchData.result?.accommodations?.[0]?.property_details?.accommodation_id) {
      const accommodationId = searchData.result.accommodations[0].property_details.accommodation_id;
      console.log(`   Using Accommodation ID: ${accommodationId}`);
      
      const detailsRequest = {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'get_accommodation_details',
          arguments: {
            accommodation_id: parseInt(accommodationId),
            language: 'en',
            include_facilities: true
          }
        }
      };

      const detailsResponse = await fetch(MCP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(detailsRequest)
      });

      const detailsData = await detailsResponse.json();
      
      if (detailsData.result?.accommodation_details) {
        console.log('✅ Accommodation Details Retrieved');
        const details = detailsData.result.accommodation_details;
        console.log(`   Title: ${details.properties?.main?.title || 'N/A'}`);
        console.log(`   Category: ${details.properties?.main?.category || 'N/A'} stars`);
        console.log(`   Description: ${(details.properties?.main?.description || 'N/A').substring(0, 100)}...`);
        
        if (details.properties?.accommodationContactInfo?.accommodationUrl) {
          console.log(`   🔗 Property URL: ${details.properties.accommodationContactInfo.accommodationUrl}`);
        }
        
        if (details.facilitiesProperties) {
          const facilityCount = Object.keys(details.facilitiesProperties).length;
          console.log(`   🏠 Facilities: ${facilityCount} rooms/facilities available`);
        }
      } else {
        console.log('❌ No accommodation details found');
        console.log('Response:', JSON.stringify(detailsData, null, 2));
      }
    } else {
      console.log('❌ No accommodation ID found from search');
    }
  } catch (error) {
    console.log('❌ Accommodation Details Failed:', error.message);
  }

  console.log('\n🎉 Testing Complete!');
}

testUpdatedServer().catch(console.error);
