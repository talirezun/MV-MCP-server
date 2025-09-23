#!/usr/bin/env node

/**
 * Simple test script for the deployed MountVacation MCP Server
 * Usage: node test-deployed-server.js
 */

const SERVER_URL = 'https://mountvacation-mcp.4thtech.workers.dev';

async function testHealthCheck() {
  console.log('🏥 Testing health check...');
  try {
    const response = await fetch(`${SERVER_URL}/health`);
    const data = await response.json();
    console.log('✅ Health check passed:', data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testToolsList() {
  console.log('\n🔧 Testing tools list...');
  try {
    const response = await fetch(`${SERVER_URL}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list'
      })
    });
    const data = await response.json();
    console.log('✅ Tools list:', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Tools list failed:', error.message);
    return false;
  }
}

async function testSearch() {
  console.log('\n🔍 Testing accommodation search...');
  try {
    const response = await fetch(`${SERVER_URL}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
            max_results: 3
          }
        }
      })
    });
    const data = await response.json();
    console.log('✅ Search results:', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Search failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing MountVacation MCP Server');
  console.log(`📍 Server: ${SERVER_URL}\n`);

  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n❌ Server is not healthy, stopping tests');
    process.exit(1);
  }

  const toolsOk = await testToolsList();
  const searchOk = await testSearch();

  console.log('\n📊 Test Summary:');
  console.log(`Health Check: ${healthOk ? '✅' : '❌'}`);
  console.log(`Tools List: ${toolsOk ? '✅' : '❌'}`);
  console.log(`Search: ${searchOk ? '✅' : '❌'}`);

  if (healthOk && toolsOk && searchOk) {
    console.log('\n🎉 All tests passed! Server is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above.');
    process.exit(1);
  }
}

main().catch(console.error);
