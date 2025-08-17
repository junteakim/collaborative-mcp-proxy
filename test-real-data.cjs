#!/usr/bin/env node

// Test Real Data Parsing in Collaborative MCP
const { spawn } = require('child_process');

console.log('🧪 Testing Real Data Parsing in Collaborative MCP');
console.log('📊 Testing with: 20.7 bar, 325°C, ID 3950mm');

const mcpServer = spawn('node', ['/private/tmp/collaborative-workspace/mcp-proxy-server/simple-collaborative.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let buffer = '';

function testRealDataParsing() {
  return new Promise((resolve, reject) => {
    const id = Date.now();
    const request = JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      id: id,
      params: {
        name: 'collaborate',
        arguments: {
          task: 'REAL DATA ANALYSIS: Pressure vessel design analysis',
          content: `
IGNORE any previous 15 bar examples - USE ONLY THIS REAL DATA:

PROJECT SPECIFICATIONS:
- Design Pressure: 20.7 bar (300 psi)
- Operating Temperature: 325°C (617°F) 
- Inner Diameter: 3950mm (155.5 inches)
- Material: ASTM A516 Grade 70
- Service: FLNG Offshore Application
- Design Code: ASME Section VIII Division 1

REQUIREMENTS:
- Calculate shell thickness for 20.7 bar pressure
- Use 3950mm diameter (NOT 1200mm)
- Consider 325°C temperature (NOT 80°C)
- Apply proper safety factors for offshore service

DO NOT use 15 bar or 1200mm - these are WRONG values!
`,
          participants: ['ollama']
        }
      }
    }) + '\n';
    
    console.log('\n🚀 Sending real data analysis request...');
    
    const responseHandler = (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            if (response.id === id) {
              mcpServer.stdout.off('data', responseHandler);
              
              if (response.result) {
                const content = response.result.content?.[0]?.text;
                
                if (content) {
                  console.log('\n' + '='.repeat(80));
                  console.log('📊 REAL DATA ANALYSIS RESULTS');
                  console.log('='.repeat(80));
                  console.log(content);
                  console.log('='.repeat(80));
                  
                  // Validation checks
                  const validationChecks = {
                    'Uses 20.7 bar (NOT 15 bar)': content.includes('20.7') && !content.includes('15 bar'),
                    'Uses 325°C (NOT 80°C)': content.includes('325') && !content.includes('80°C'),
                    'Uses 3950mm (NOT 1200mm)': content.includes('3950') && !content.includes('1200'),
                    'Shows extracted data section': content.includes('EXTRACTED REAL DATA') || content.includes('REAL DATA'),
                    'Performs real calculations': content.includes('Required thickness') && !content.includes('10mm'),
                    'Temperature-adjusted stress': content.includes('17') || content.includes('allowable'),
                  };
                  
                  console.log('\n✅ VALIDATION RESULTS:');
                  let passed = 0;
                  const total = Object.keys(validationChecks).length;
                  
                  for (const [check, result] of Object.entries(validationChecks)) {
                    console.log(`   ${result ? '✅' : '❌'} ${check}`);
                    if (result) passed++;
                  }
                  
                  const percentage = Math.round((passed / total) * 100);
                  console.log(`\n🎯 ACCURACY SCORE: ${passed}/${total} (${percentage}%)`);
                  
                  if (percentage >= 80) {
                    console.log('🎉 SUCCESS! Real data is being used correctly!');
                  } else {
                    console.log('⚠️  ISSUE: Still using hardcoded examples instead of real data');
                  }
                  
                  resolve(content);
                } else {
                  reject(new Error('No content in response'));
                }
              } else if (response.error) {
                console.log('❌ Error:', response.error.message);
                reject(new Error(response.error.message));
              }
            }
          } catch (e) {
            // Ignore non-JSON
          }
        }
      }
    };
    
    mcpServer.stdout.on('data', responseHandler);
    mcpServer.stdin.write(request);
    
    setTimeout(() => {
      mcpServer.stdout.off('data', responseHandler);
      reject(new Error('Test timeout'));
    }, 15000);
  });
}

async function runTest() {
  // Wait for server ready
  await new Promise(resolve => {
    const handler = (data) => {
      if (data.toString().includes('ready for requests')) {
        mcpServer.stderr.off('data', handler);
        resolve();
      }
    };
    mcpServer.stderr.on('data', handler);
  });
  
  console.log('\n⚡ Server ready, initializing...');
  
  // Initialize MCP
  mcpServer.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 0,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { 
        name: 'real-data-test', 
        version: '1.0.0' 
      }
    }
  }) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    await testRealDataParsing();
    console.log('\n🎊 REAL DATA TEST COMPLETED!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
  
  mcpServer.kill();
  process.exit(0);
}

mcpServer.stderr.on('data', (data) => {
  const msg = data.toString().trim();
  if (msg && !msg.includes('ExperimentalWarning')) {
    if (msg.includes('[INFO]')) {
      console.log('📝', msg.split('[INFO]')[1]?.trim() || msg);
    }
  }
});

mcpServer.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

runTest();