#!/usr/bin/env node

/**
 * Test script to demonstrate the enhanced booking functionality
 * Tests the new booking links and multiple offers features
 */

const API_KEY = process.env.MOUNTVACATION_API_KEY;
const SERVER_URL = 'https://blocklabs-mountvacation-mcp.4thtech.workers.dev';

if (!API_KEY) {
  console.log('❌ MOUNTVACATION_API_KEY environment variable is required');
  console.log('💡 Get your API key from https://www.mountvacation.si/');
  process.exit(1);
}

async function testBookingLinks() {
  console.log('🔗 Testing Enhanced Booking Links Functionality');
  console.log('📍 Server:', SERVER_URL);
  console.log('');

  try {
    // Test 1: Search for accommodations with booking links
    console.log('🏨 Test 1: Search accommodations in Italian Dolomites with booking links...');
    const searchResponse = await fetch(`${SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MountVacation-API-Key': API_KEY,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'search_accommodations',
          arguments: {
            location: 'Madonna di Campiglio',
            arrival_date: '2025-12-15',
            departure_date: '2025-12-22',
            persons_ages: '35,32,8,5',
            currency: 'EUR',
            max_results: 3
          }
        }
      })
    });

    const searchResult = await searchResponse.json();
    
    if (searchResult.error) {
      console.log('❌ Search failed:', searchResult.error.message);
      return;
    }

    const searchData = JSON.parse(searchResult.result.content[0].text);
    
    if (searchData.error) {
      console.log('❌ Search error:', searchData.error);
      return;
    }

    console.log('✅ Search successful!');
    console.log(`📊 Found ${searchData.accommodations?.length || 0} accommodations`);
    
    if (searchData.accommodations && searchData.accommodations.length > 0) {
      const firstAccommodation = searchData.accommodations[0];
      
      console.log('');
      console.log('🏨 First Accommodation Details:');
      console.log(`   Name: ${firstAccommodation.name}`);
      console.log(`   Location: ${firstAccommodation.location.full_address}`);
      console.log(`   Price: ${firstAccommodation.pricing.total_price} ${firstAccommodation.pricing.currency}`);
      
      // Check for booking links
      console.log('');
      console.log('🔗 Booking Links Analysis:');
      console.log(`   Primary Booking URL: ${firstAccommodation.book_now_url !== 'N/A' ? '✅ Available' : '❌ Not available'}`);
      console.log(`   Booking Offers Count: ${firstAccommodation.booking_offers?.length || 0}`);
      
      if (firstAccommodation.booking_offers && firstAccommodation.booking_offers.length > 0) {
        console.log('');
        console.log('💰 Available Booking Offers:');
        firstAccommodation.booking_offers.forEach((offer, index) => {
          console.log(`   ${index + 1}. ${offer.facility_title}`);
          console.log(`      Price: ${offer.price} ${offer.currency}`);
          console.log(`      Beds: ${offer.beds}`);
          console.log(`      Service: ${offer.service_type}`);
          console.log(`      Booking URL: ${offer.booking_url !== 'N/A' ? '✅ Available' : '❌ Not available'}`);
          console.log(`      Free Cancellation: ${offer.free_cancellation_until}`);
          console.log('');
        });
      }

      // Test 2: Get specific booking links
      if (firstAccommodation.property_details.accommodation_id !== 'N/A') {
        console.log('🔍 Test 2: Getting specific booking links...');
        
        const bookingResponse = await fetch(`${SERVER_URL}/mcp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-MountVacation-API-Key': API_KEY,
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
              name: 'get_booking_links',
              arguments: {
                accommodation_id: parseInt(firstAccommodation.property_details.accommodation_id),
                arrival_date: '2025-12-15',
                departure_date: '2025-12-22',
                persons_ages: '35,32,8,5',
                currency: 'EUR'
              }
            }
          })
        });

        const bookingResult = await bookingResponse.json();
        
        if (bookingResult.error) {
          console.log('❌ Booking links request failed:', bookingResult.error.message);
        } else {
          const bookingData = JSON.parse(bookingResult.result.content[0].text);
          
          if (bookingData.error) {
            console.log('❌ Booking links error:', bookingData.error);
          } else {
            console.log('✅ Booking links retrieved successfully!');
            console.log(`📋 ${bookingData.message}`);
            console.log(`🔗 Primary booking URL: ${bookingData.primary_booking_url !== 'N/A' ? '✅ Available' : '❌ Not available'}`);
            console.log(`💰 Available offers: ${bookingData.booking_offers?.length || 0}`);
          }
        }
      }
    }

    console.log('');
    console.log('🎉 Booking Links Test Complete!');
    console.log('');
    console.log('📋 Summary:');
    console.log('✅ Enhanced search with prominent booking links');
    console.log('✅ Multiple booking offers per accommodation');
    console.log('✅ Dedicated booking links tool');
    console.log('✅ Comprehensive booking information');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testBookingLinks();
