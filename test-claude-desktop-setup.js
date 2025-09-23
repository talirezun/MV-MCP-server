#!/usr/bin/env node

/**
 * Test script to verify Claude Desktop MCP setup
 * This simulates the exact same protocol that Claude Desktop uses
 */

const { spawn } = require('child_process');
const path = require('path');

const BRIDGE_PATH = '/Users/talirezun/MV-MCP-server/scripts/mcp-cloud-bridge.js';

async function testClaudeDesktopSetup() {
  console.log('🧪 Testing Claude Desktop MCP Setup...\n');

  // Test 1: Check if bridge file exists
  console.log('1️⃣ Checking bridge file...');
  try {
    const fs = require('fs');
    if (fs.existsSync(BRIDGE_PATH)) {
      console.log('✅ Bridge file exists:', BRIDGE_PATH);
    } else {
      console.log('❌ Bridge file not found:', BRIDGE_PATH);
      return;
    }
  } catch (error) {
    console.log('❌ Error checking bridge file:', error.message);
    return;
  }

  // Test 2: Start the bridge process (like Claude Desktop does)
  console.log('\n2️⃣ Starting MCP bridge process...');
  
  const bridge = spawn('node', [BRIDGE_PATH], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let responseBuffer = '';
  let testsPassed = 0;
  let totalTests = 3;

  bridge.stdout.on('data', (data) => {
    responseBuffer += data.toString();
    
    // Process complete JSON-RPC responses
    const lines = responseBuffer.split('\n');
    responseBuffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          handleResponse(response);
        } catch (error) {
          console.log('❌ Invalid JSON response:', line);
        }
      }
    }
  });

  bridge.stderr.on('data', (data) => {
    console.log('⚠️ Bridge stderr:', data.toString());
  });

  bridge.on('close', (code) => {
    console.log(`\n📊 Test Results: ${testsPassed}/${totalTests} tests passed`);
    if (testsPassed === totalTests) {
      console.log('🎉 All tests passed! Claude Desktop setup should work perfectly.');
    } else {
      console.log('❌ Some tests failed. Check the configuration.');
    }
  });

  function handleResponse(response) {
    if (response.id === 1) {
      // Initialize response
      console.log('3️⃣ Testing MCP initialize...');
      if (response.result && response.result.protocolVersion) {
        console.log('✅ Initialize successful');
        console.log(`   Protocol: ${response.result.protocolVersion}`);
        console.log(`   Server: ${response.result.serverInfo.name} v${response.result.serverInfo.version}`);
        testsPassed++;
      } else {
        console.log('❌ Initialize failed:', response);
      }
    } else if (response.id === 2) {
      // Tools list response
      console.log('\n4️⃣ Testing tools list...');
      if (response.result && response.result.tools) {
        console.log(`✅ Tools list successful: ${response.result.tools.length} tools found`);
        response.result.tools.forEach((tool, index) => {
          console.log(`   ${index + 1}. ${tool.name}`);
        });
        testsPassed++;
      } else {
        console.log('❌ Tools list failed:', response);
      }
    } else if (response.id === 3) {
      // Search test response
      console.log('\n5️⃣ Testing accommodation search...');
      if (response.result && response.result.content) {
        try {
          const content = JSON.parse(response.result.content[0].text);
          if (content.accommodations && content.accommodations.length > 0) {
            console.log(`✅ Search successful: ${content.accommodations.length} accommodations found`);
            const acc = content.accommodations[0];
            console.log(`   🏨 ${acc.name}`);
            console.log(`   📍 ${acc.location.full_address}`);
            console.log(`   💰 ${acc.pricing.total_price} ${acc.pricing.currency}`);
            console.log(`   🔗 Property link: ${acc.property_page_url !== 'N/A' ? 'Yes' : 'No'}`);
            testsPassed++;
          } else {
            console.log('❌ Search returned no accommodations');
          }
        } catch (error) {
          console.log('❌ Search response parsing failed:', error.message);
        }
      } else {
        console.log('❌ Search failed:', response);
      }
      
      // End test after search
      setTimeout(() => {
        bridge.kill();
      }, 1000);
    }
  }

  // Send test requests (simulating Claude Desktop)
  setTimeout(() => {
    // 1. Initialize (required by MCP protocol)
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: { listChanged: true },
          sampling: {}
        },
        clientInfo: {
          name: 'claude-desktop',
          version: '0.7.1'
        }
      }
    };
    bridge.stdin.write(JSON.stringify(initRequest) + '\n');
  }, 500);

  setTimeout(() => {
    // 2. List tools
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };
    bridge.stdin.write(JSON.stringify(toolsRequest) + '\n');
  }, 1500);

  setTimeout(() => {
    // 3. Test search
    const searchRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'search_accommodations',
        arguments: {
          location: 'Madonna di Campiglio',
          arrival_date: '2026-01-15',
          departure_date: '2026-01-20',
          persons_ages: '30,30',
          currency: 'EUR',
          max_results: 2
        }
      }
    };
    bridge.stdin.write(JSON.stringify(searchRequest) + '\n');
  }, 2500);
}

testClaudeDesktopSetup().catch(console.error);
