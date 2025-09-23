#!/usr/bin/env node

/**
 * MountVacation MCP Setup Test Script
 * 
 * Tests the complete setup process to ensure everything works before deployment
 */

const https = require('https');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.MOUNTVACATION_API_KEY;
const SERVER_URL = 'https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp';

console.log('🧪 MountVacation MCP Setup Test');
console.log('================================\n');

async function testServerEndpoint() {
  console.log('1. Testing Cloudflare Workers server endpoint...');
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    });

    const options = {
      hostname: 'blocklabs-mountvacation-mcp-production.4thtech.workers.dev',
      port: 443,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-MountVacation-API-Key': API_KEY || 'test-key'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.result && response.result.tools) {
            console.log('   ✅ Server endpoint working');
            console.log(`   📊 Found ${response.result.tools.length} tools available`);
            resolve(true);
          } else {
            console.log('   ❌ Server endpoint returned unexpected response');
            console.log('   📄 Response:', JSON.stringify(response, null, 2));
            resolve(false);
          }
        } catch (error) {
          console.log('   ❌ Server endpoint returned invalid JSON');
          console.log('   📄 Raw response:', body);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('   ❌ Server endpoint connection failed:', error.message);
      resolve(false);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      console.log('   ❌ Server endpoint timeout');
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

async function testStandaloneBridge() {
  console.log('\n2. Testing standalone MCP bridge...');
  
  const bridgePath = path.join(__dirname, 'scripts', 'standalone-mcp-bridge.js');
  
  if (!fs.existsSync(bridgePath)) {
    console.log('   ❌ Standalone bridge script not found');
    return false;
  }

  console.log('   ✅ Standalone bridge script exists');
  
  return new Promise((resolve) => {
    const env = { ...process.env };
    if (API_KEY) {
      env.MOUNTVACATION_API_KEY = API_KEY;
    }

    const child = spawn('node', [bridgePath], {
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Send initialize request
    const initRequest = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0' }
      }
    }) + '\n';

    child.stdin.write(initRequest);

    setTimeout(() => {
      child.kill();
      
      if (errorOutput.includes('MountVacation MCP Bridge v3.0 started successfully')) {
        console.log('   ✅ Bridge starts successfully');
        
        if (output.includes('"protocolVersion":"2024-11-05"')) {
          console.log('   ✅ Bridge responds to initialize request');
          resolve(true);
        } else {
          console.log('   ❌ Bridge does not respond correctly to initialize');
          console.log('   📄 Output:', output);
          resolve(false);
        }
      } else {
        console.log('   ❌ Bridge failed to start');
        console.log('   📄 Error output:', errorOutput);
        resolve(false);
      }
    }, 3000);
  });
}

async function testProjectStructure() {
  console.log('\n3. Testing project structure...');
  
  const requiredFiles = [
    'README.md',
    'SIMPLE_SETUP_GUIDE.md',
    'scripts/standalone-mcp-bridge.js',
    'scripts/test-deployed-server.js',
    'cloudflare-workers/src/index.ts',
    'cloudflare-workers/package.json',
    'cloudflare-workers/wrangler.toml'
  ];

  const removedFiles = [
    'docs',
    'client-configs',
    'python-fastmcp',
    'CHANGELOG.md',
    'CLIENT_CONFIGURATIONS.md',
    'PRODUCTION_SETUP_GUIDE.md'
  ];

  let allGood = true;

  // Check required files exist
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file} exists`);
    } else {
      console.log(`   ❌ ${file} missing`);
      allGood = false;
    }
  }

  // Check removed files are gone
  for (const file of removedFiles) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.log(`   ✅ ${file} removed`);
    } else {
      console.log(`   ❌ ${file} still exists (should be removed)`);
      allGood = false;
    }
  }

  return allGood;
}

async function runTests() {
  if (!API_KEY) {
    console.log('⚠️  Warning: MOUNTVACATION_API_KEY not set. Some tests may fail.\n');
  }

  const serverTest = await testServerEndpoint();
  const bridgeTest = await testStandaloneBridge();
  const structureTest = await testProjectStructure();

  console.log('\n📊 Test Results:');
  console.log('================');
  console.log(`Server Endpoint: ${serverTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Standalone Bridge: ${bridgeTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Project Structure: ${structureTest ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = serverTest && bridgeTest && structureTest;
  console.log(`\n🎯 Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  if (allPassed) {
    console.log('\n🚀 Ready for deployment!');
    console.log('   • Cloudflare Workers server is working');
    console.log('   • Standalone bridge is functional');
    console.log('   • Project structure is clean');
    console.log('\nNext steps:');
    console.log('   1. git add .');
    console.log('   2. git commit -m "Ultra-simple MCP setup - production ready"');
    console.log('   3. git push origin main');
    console.log('   4. Deploy to Cloudflare Workers');
  } else {
    console.log('\n❌ Fix the failing tests before deployment');
  }

  process.exit(allPassed ? 0 : 1);
}

runTests().catch(console.error);
