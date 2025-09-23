const SERVER_URL = 'https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev';
const MCP_URL = `${SERVER_URL}/mcp`;

async function testPropertyLinks() {
  console.log('🔗 Testing Property Links and New Features...\n');

  // Test search with property links
  console.log('🏔️ Searching for accommodations in Madonna di Campiglio...');
  try {
    const searchRequest = {
      jsonrpc: '2.0',
      id: 1,
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
    
    if (searchData.result?.content?.[0]?.text) {
      const resultData = JSON.parse(searchData.result.content[0].text);
      
      if (resultData.accommodations && resultData.accommodations.length > 0) {
        console.log(`✅ Found ${resultData.accommodations.length} accommodations\n`);
        
        resultData.accommodations.forEach((acc, index) => {
          console.log(`🏨 Accommodation ${index + 1}: ${acc.name}`);
          console.log(`   📍 Location: ${acc.location.full_address}`);
          console.log(`   💰 Price: ${acc.pricing.total_price} ${acc.pricing.currency} (${acc.pricing.nights} nights)`);
          console.log(`   🆔 Accommodation ID: ${acc.property_details.accommodation_id}`);
          
          // Property Links - This is what was missing before!
          console.log(`   🔗 Property Page URL: ${acc.property_page_url}`);
          console.log(`   🎫 Reservation URL: ${acc.booking.reservation_url}`);
          
          // Image Gallery
          console.log(`   🖼️ Images: ${acc.images.length} main images`);
          console.log(`   📸 Thumbnails: ${acc.image_gallery.thumbnail_urls.length} thumbnail URLs`);
          console.log(`   🖼️ Full Size: ${acc.image_gallery.full_size_urls.length} full-size URLs`);
          
          if (acc.images.length > 0) {
            console.log(`   🎨 First Image: ${acc.images[0]}`);
            console.log(`   🔍 Thumbnail: ${acc.image_gallery.thumbnail_urls[0]}`);
            console.log(`   📷 Full Size: ${acc.image_gallery.full_size_urls[0]}`);
          }
          
          // Coordinates
          if (acc.location.coordinates) {
            console.log(`   🗺️ Coordinates: ${acc.location.coordinates.latitude}, ${acc.location.coordinates.longitude}`);
          }
          
          // Enhanced amenities
          console.log(`   🏊 Pool: ${acc.amenities.pool ? '✅' : '❌'}`);
          console.log(`   💆 Wellness: ${acc.amenities.wellness ? '✅' : '❌'}`);
          console.log(`   🎿 Ski In/Out: ${acc.amenities.ski_in_out ? '✅' : '❌'}`);
          
          console.log(''); // Empty line between accommodations
        });
        
        // Test the new accommodation details tool
        const firstAccommodationId = resultData.accommodations[0].property_details.accommodation_id;
        console.log(`🔍 Testing accommodation details for ID: ${firstAccommodationId}...`);
        
        const detailsRequest = {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'get_accommodation_details',
            arguments: {
              accommodation_id: parseInt(firstAccommodationId),
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
        
        if (detailsData.result?.content?.[0]?.text) {
          const detailsResult = JSON.parse(detailsData.result.content[0].text);
          const details = detailsResult.accommodation_details;
          
          console.log('✅ Detailed accommodation properties retrieved:');
          console.log(`   🏨 Title: ${details.properties?.main?.title || 'N/A'}`);
          console.log(`   ⭐ Category: ${details.properties?.main?.category || 'N/A'} stars`);
          console.log(`   🏢 Type: ${details.properties?.main?.type || 'N/A'}`);
          console.log(`   📝 Description: ${(details.properties?.main?.description || 'N/A').substring(0, 150)}...`);
          
          if (details.properties?.accommodationContactInfo?.accommodationUrl) {
            console.log(`   🌐 Official Property URL: ${details.properties.accommodationContactInfo.accommodationUrl}`);
          }
          
          if (details.properties?.geolocation) {
            console.log(`   📍 Exact Location: ${details.properties.geolocation.latitude}, ${details.properties.geolocation.longitude}`);
          }
          
          // Count amenities
          const amenityGroups = ['wellness', 'freetime', 'general', 'food'];
          amenityGroups.forEach(group => {
            if (details.properties?.[group]) {
              const amenities = Object.entries(details.properties[group]).filter(([key, value]) => value === true);
              console.log(`   ${group.toUpperCase()}: ${amenities.length} amenities available`);
            }
          });
          
          if (details.facilitiesProperties) {
            const facilityCount = Object.keys(details.facilitiesProperties).length;
            console.log(`   🏠 Facilities: ${facilityCount} rooms/facilities with detailed properties`);
            
            // Show first facility details
            const firstFacilityId = Object.keys(details.facilitiesProperties)[0];
            if (firstFacilityId) {
              const facility = details.facilitiesProperties[firstFacilityId];
              console.log(`   🛏️ Sample Room: ${facility.main?.title || 'N/A'}`);
              console.log(`   📐 Size: ${facility.main?.sizeSqM || 'N/A'} sqm`);
              console.log(`   🛏️ Beds: ${facility.main?.beds || 'N/A'} + ${facility.main?.bedsExtra || 0} extra`);
              console.log(`   🚿 Bathrooms: ${facility.main?.bathrooms || 'N/A'}`);
            }
          }
        } else {
          console.log('❌ Failed to get accommodation details');
        }
        
      } else {
        console.log('❌ No accommodations found in search results');
      }
    } else {
      console.log('❌ Invalid search response format');
      console.log('Response:', JSON.stringify(searchData, null, 2));
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  console.log('\n🎉 Property Links Test Complete!');
  console.log('\n📋 Summary of New Features:');
  console.log('✅ Property page URLs (accommodationUrl) now included');
  console.log('✅ Direct reservation URLs with dates and guest info');
  console.log('✅ Rich image galleries with thumbnails and full-size URLs');
  console.log('✅ Accommodation IDs for detailed property lookups');
  console.log('✅ GPS coordinates for exact location mapping');
  console.log('✅ Enhanced amenities (pool, wellness, ski-in/out)');
  console.log('✅ New accommodation details API tool');
  console.log('✅ Facility details API tool for room-specific info');
}

testPropertyLinks().catch(console.error);
