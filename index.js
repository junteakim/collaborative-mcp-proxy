#!/usr/bin/env node

/**
 * Collaborative MCP Proxy Server
 * Routes collaboration requests to existing Gemini CLI and Codex CLI MCPs
 */

import { spawn } from 'child_process';
import { createReadStream, createWriteStream } from 'fs';
import { ProxyHandler } from './proxy-handler.js';

class CollaborativeMCPServer {
  constructor() {
    this.proxyHandler = new ProxyHandler();
    this.requestId = 0;
  }

  async start() {
    console.error('[MCP Proxy] Starting collaborative MCP server...');
    
    // Listen for JSON-RPC requests on stdin
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', this.handleInput.bind(this));
    process.stdin.on('end', () => {
      console.error('[MCP Proxy] Input stream ended');
      process.exit(0);
    });

    // Don't send initial response - wait for initialize request

    console.error('[MCP Proxy] Server ready and listening...');
  }

  async handleInput(data) {
    const lines = data.trim().split('\\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const request = JSON.parse(line);
        console.error('[MCP Proxy] Received request:', JSON.stringify(request));
        await this.handleRequest(request);
      } catch (error) {
        console.error('[MCP Proxy] Error parsing request:', error);
        this.sendError(null, -32700, 'Parse error');
      }
    }
  }

  async handleRequest(request) {
    console.error(`[MCP Proxy] Handling request: ${request.method}`);
    
    const { method, params, id } = request;

    try {
      switch (method) {
        case 'initialize':
          await this.handleInitialize(id, params);
          break;
          
        case 'tools/list':
          await this.handleToolsList(id);
          break;
          
        case 'tools/call':
          await this.handleToolCall(id, params);
          break;
          
        case 'notifications/cancelled':
          console.error('[MCP Proxy] Request cancelled:', params);
          break;
          
        default:
          this.sendError(id, -32601, `Method not found: ${method}`);
      }
    } catch (error) {
      console.error(`[MCP Proxy] Error handling ${method}:`, error);
      this.sendError(id, -32603, `Internal error: ${error.message}`);
    }
  }

  async handleInitialize(id, params) {
    console.error('[MCP Proxy] Initialize called with params:', JSON.stringify(params));
    
    this.sendResponse({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: params.protocolVersion || '2025-06-18',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'collaborative-mcp-proxy',
          version: '1.0.0'
        }
      }
    });
  }

  async handleToolsList(id) {
    console.error('[MCP Proxy] Sending tools list...');
    
    const response = {
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'collaborate',
            description: 'Perform collaborative analysis using multiple AI models',
            inputSchema: {
              type: 'object',
              properties: {
                task: {
                  type: 'string',
                  description: 'Description of the analysis task'
                },
                content: {
                  type: 'string',
                  description: 'Content to analyze (optional)'
                },
                mode: {
                  type: 'string',
                  enum: ['plan', 'apply', 'review'],
                  description: 'Collaboration mode',
                  default: 'apply'
                }
              },
              required: ['task']
            }
          }
        ]
      }
    };
    
    console.error('[MCP Proxy] Tools list response:', JSON.stringify(response));
    this.sendResponse(response);
  }

  async handleToolCall(id, params) {
    const { name, arguments: args } = params;
    
    if (name !== 'collaborate') {
      this.sendError(id, -32602, `Unknown tool: ${name}`);
      return;
    }

    const { task, content, mode = 'apply' } = args;
    
    console.error(`[MCP Proxy] Starting collaboration: ${mode} - ${task}`);
    
    try {
      const result = await this.proxyHandler.handleCollaboration(task, content, mode);
      
      this.sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: result
            }
          ]
        }
      });
    } catch (error) {
      console.error('[MCP Proxy] Collaboration error:', error);
      this.sendError(id, -32603, `Collaboration failed: ${error.message}`);
    }
  }

  sendResponse(response) {
    const message = JSON.stringify(response) + '\\n';
    console.error('[MCP Proxy] Sending response:', message.trim());
    process.stdout.write(message);
  }

  sendError(id, code, message) {
    this.sendResponse({
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message
      }
    });
  }
}

// Start the server
const server = new CollaborativeMCPServer();
server.start().catch(error => {
  console.error('[MCP Proxy] Fatal error:', error);
  process.exit(1);
});