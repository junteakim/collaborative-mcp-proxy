#!/usr/bin/env node

// Test General Analysis (Non-Pressure Vessel)
const { spawn } = require('child_process');

console.log('🧪 Testing General Analysis in Collaborative MCP');
console.log('📊 Testing code analysis task');

const mcpServer = spawn('node', ['/private/tmp/collaborative-workspace/mcp-proxy-server/simple-collaborative.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let buffer = '';

function testGeneralAnalysis() {
  return new Promise((resolve, reject) => {
    const id = Date.now();
    const request = JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      id: id,
      params: {
        name: 'collaborate',
        arguments: {
          task: 'Code performance optimization analysis',
          content: `
Please analyze this JavaScript function for performance optimization:

function processData(data) {
  let results = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].status === 'active') {
      results.push({
        id: data[i].id,
        processed: true,
        timestamp: new Date().toISOString()
      });
    }
  }
  return results;
}

Performance metrics:
- Input size: 10000 items
- Current execution time: 45ms
- Memory usage: 2.5MB
- Target: <20ms execution time

Files involved: main.js, utils.js, performance.test.js
`,
          participants: ['ollama']
        }
      }
    }) + '\n';
    
    console.log('\n🚀 Sending general analysis request...');
    
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
                  console.log('📊 GENERAL ANALYSIS RESULTS');
                  console.log('='.repeat(80));
                  console.log(content);
                  console.log('='.repeat(80));
                  
                  // Validation checks for general analysis
                  const validationChecks = {
                    'Detects analysis type': content.includes('Analysis Type:') && content.includes('Performance'),
                    'Extracts measurements': content.includes('45ms') || content.includes('10000') || content.includes('2.5MB'),
                    'Identifies files': content.includes('main.js') || content.includes('Files:'),
                    'Shows complexity analysis': content.includes('Complexity') || content.includes('words'),
                    'Provides recommendations': content.includes('Recommendation:') || content.includes('optimization'),
                    'No hardcoded pressure vessel data': !content.includes('15 bar') && !content.includes('ASME'),
                  };
                  
                  console.log('\n✅ VALIDATION RESULTS:');
                  let passed = 0;
                  const total = Object.keys(validationChecks).length;
                  
                  for (const [check, result] of Object.entries(validationChecks)) {
                    console.log(`   ${result ? '✅' : '❌'} ${check}`);
                    if (result) passed++;
                  }
                  
                  const percentage = Math.round((passed / total) * 100);
                  console.log(`\n🎯 GENERAL ANALYSIS SCORE: ${passed}/${total} (${percentage}%)`);
                  
                  if (percentage >= 80) {
                    console.log('🎉 SUCCESS! General analysis working correctly!');
                  } else {
                    console.log('⚠️  ISSUE: General analysis needs improvement');
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
        name: 'general-analysis-test', 
        version: '1.0.0' 
      }
    }
  }) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    await testGeneralAnalysis();
    console.log('\n🎊 GENERAL ANALYSIS TEST COMPLETED!');
    
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