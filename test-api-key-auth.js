#!/usr/bin/env node

const SERVER_URL = 'https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp';

async function testAPIKeyAuth() {
  console.log('🔐 Testing API Key Authentication...\n');

  const testCases = [
    {
      name: 'No API Key',
      headers: {},
      expected: 'Should return 401 error'
    },
    {
      name: 'Invalid API Key',
      headers: { 'X-MountVacation-API-Key': 'invalid_key_123' },
      expected: 'Should return authentication error'
    },
    {
      name: 'Valid API Key (X-MountVacation-API-Key header)',
      headers: { 'X-MountVacation-API-Key': 'test_api_key_for_demo' },
      expected: 'Should work and return tools list'
    },
    {
      name: 'Valid API Key (Authorization Bearer header)',
      headers: { 'Authorization': 'Bearer test_api_key_for_demo' },
      expected: 'Should work and return tools list'
    }
  ];

  for (const testCase of testCases) {
    console.log(`🧪 Testing: ${testCase.name}`);
    console.log(`🎯 Expected: ${testCase.expected}`);
    
    try {
      const toolsRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      };

      const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...testCase.headers
        },
        body: JSON.stringify(toolsRequest)
      });

      const data = await response.json();
      
      if (response.status === 401) {
        console.log(`✅ EXPECTED: Got 401 Unauthorized`);
        console.log(`   Message: ${data.error?.message || 'No message'}`);
      } else if (data.result?.tools) {
        console.log(`✅ SUCCESS: Got ${data.result.tools.length} tools`);
        console.log(`   Tools: ${data.result.tools.map(t => t.name).join(', ')}`);
      } else if (data.error) {
        console.log(`⚠️  ERROR: ${data.error.message}`);
        console.log(`   Code: ${data.error.code}`);
      } else {
        console.log(`❓ UNEXPECTED: ${JSON.stringify(data, null, 2)}`);
      }
      
    } catch (error) {
      console.log(`❌ NETWORK ERROR: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('🎉 API Key Authentication Test Complete!');
}

testAPIKeyAuth().catch(console.error);
