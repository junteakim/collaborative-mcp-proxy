#!/usr/bin/env node

/**
 * Simple MCP Test Server
 */

class SimpleMCPServer {
  constructor() {
    this.requestId = 0;
  }

  start() {
    console.error('[Simple MCP] Starting...');
    
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (data) => {
      const lines = data.trim().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          this.handleMessage(line);
        }
      }
    });
    
    console.error('[Simple MCP] Ready');
  }

  handleMessage(line) {
    try {
      const request = JSON.parse(line);
      console.error('[Simple MCP] Request:', JSON.stringify(request));
      
      const { method, id } = request;
      
      if (method === 'initialize') {
        this.sendResponse({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2025-06-18',
            capabilities: { tools: {} },
            serverInfo: { name: 'simple-mcp', version: '1.0.0' }
          }
        });
      } else if (method === 'tools/list') {
        this.sendResponse({
          jsonrpc: '2.0',
          id,
          result: {
            tools: [{
              name: 'test',
              description: 'Test tool',
              inputSchema: {
                type: 'object',
                properties: {
                  message: { type: 'string' }
                }
              }
            }]
          }
        });
      } else if (method === 'tools/call') {
        this.sendResponse({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{
              type: 'text',
              text: 'Test response from simple MCP'
            }]
          }
        });
      }
      
    } catch (error) {
      console.error('[Simple MCP] Error:', error);
    }
  }

  sendResponse(response) {
    const message = JSON.stringify(response) + '\n';
    console.error('[Simple MCP] Sending:', message.trim());
    process.stdout.write(message);
  }
}

const server = new SimpleMCPServer();
server.start();