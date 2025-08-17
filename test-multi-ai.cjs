#!/usr/bin/env node

// Test Multi-AI Collaboration (All Participants)
const { spawn } = require('child_process');

console.log('🧪 Testing Multi-AI Collaboration');
console.log('🤖 Testing all participants: Ollama, Gemini, Codex, Serena');

const mcpServer = spawn('node', ['/private/tmp/collaborative-workspace/mcp-proxy-server/simple-collaborative.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let buffer = '';

function testMultiAI() {
  return new Promise((resolve, reject) => {
    const id = Date.now();
    const request = JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      id: id,
      params: {
        name: 'collaborate',
        arguments: {
          task: 'Quick system architecture review',
          content: `Simple web application with React frontend and Node.js backend. Need scalability assessment.`
          // No participants specified - should use all 4 by default
        }
      }
    }) + '\n';
    
    console.log('\n🚀 Sending multi-AI collaboration request...');
    console.log('📝 No participants specified - should use all 4 AIs');
    
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
                  console.log('🤖 MULTI-AI COLLABORATION RESULTS');
                  console.log('='.repeat(80));
                  console.log(content);
                  console.log('='.repeat(80));
                  
                  // Check if all 4 AIs participated
                  const participationChecks = {
                    'Ollama participated': content.includes('OLLAMA'),
                    'Gemini participated': content.includes('GEMINI'),
                    'Codex participated': content.includes('CODEX'),
                    'Serena participated': content.includes('SERENA'),
                    'Multiple AI sections': (content.match(/##\s+\w+\s+Results/g) || []).length >= 2,
                    'Success rate shown': content.includes('Success Rate:')
                  };
                  
                  console.log('\n✅ PARTICIPATION CHECK:');
                  let participated = 0;
                  const total = Object.keys(participationChecks).length;
                  
                  for (const [check, result] of Object.entries(participationChecks)) {
                    console.log(`   ${result ? '✅' : '❌'} ${check}`);
                    if (result) participated++;
                  }
                  
                  const percentage = Math.round((participated / total) * 100);
                  console.log(`\n🎯 COLLABORATION SCORE: ${participated}/${total} (${percentage}%)`);
                  
                  if (percentage >= 80) {
                    console.log('🎉 SUCCESS! Multi-AI collaboration working!');
                  } else {
                    console.log('⚠️  ISSUE: Not all AIs are participating');
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
      reject(new Error('Test timeout - waiting for all AIs'));
    }, 25000); // Longer timeout for multiple AIs
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
        name: 'multi-ai-test', 
        version: '1.0.0' 
      }
    }
  }) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    await testMultiAI();
    console.log('\n🎊 MULTI-AI COLLABORATION TEST COMPLETED!');
    
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