# 🤖 Collaborative MCP Proxy Server

Multi-AI collaborative analysis system for Claude Desktop and Claude Code using existing login-based MCP servers.

## ✨ Features

- **Multi-AI Collaboration**: Integrates Ollama, Gemini CLI, Codex CLI, and Serena MCP
- **ARM64 Mac Optimized**: Native Apple Silicon performance
- **Login-Based Authentication**: Uses existing CLI configurations (no API keys needed)
- **Privacy-Focused**: Local processing with Ollama for sensitive data
- **Pressure Vessel Analysis**: Specialized engineering analysis capabilities
- **Claude Integration**: Works with both Claude Desktop and Claude Code

## Installation

### Prerequisites

- Node.js 18+ 
- Existing Gemini CLI MCP and Codex CLI MCP installed and logged in
- Claude Desktop or Claude Code

### Setup

1. **Clone/Create the project:**
```bash
mkdir collaborative-mcp-proxy
cd collaborative-mcp-proxy
# Copy the files: package.json, index.js, proxy-handler.js
```

2. **Install dependencies:**
```bash
npm install
```

3. **Make executable:**
```bash
chmod +x index.js
```

## Configuration

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "collaborative-proxy": {
      "command": "node",
      "args": ["/path/to/collaborative-mcp-proxy/index.js"]
    }
  }
}
```

### Claude Code Configuration

Add to your MCP configuration:

```json
{
  "collaborative-proxy": {
    "command": "node",
    "args": ["/path/to/collaborative-mcp-proxy/index.js"]
  }
}
```

## Usage

Once configured, you can use the collaborative analysis in Claude:

### Basic Analysis
```
Use the collaborate tool to analyze this pressure vessel specification...
```

### Planning Mode
```json
{
  "tool": "collaborate",
  "arguments": {
    "task": "Create analysis plan for pressure vessel design",
    "mode": "plan"
  }
}
```

### Full Analysis Mode  
```json
{
  "tool": "collaborate", 
  "arguments": {
    "task": "Analyze pressure vessel compliance with ASME standards",
    "content": "Vessel specifications...",
    "mode": "apply"
  }
}
```

### Review Mode
```json
{
  "tool": "collaborate",
  "arguments": {
    "task": "Review completed analysis",
    "content": "Previous analysis results...", 
    "mode": "review"
  }
}
```

## Collaboration Modes

### 1. Plan Mode (`mode: "plan"`)
- Creates detailed analysis plan using Gemini
- Identifies objectives, focus areas, and deliverables
- Best for complex tasks requiring upfront planning

### 2. Apply Mode (`mode: "apply"`) - Default
- Performs full collaborative analysis
- Gemini: Comprehensive analysis and risk assessment
- Codex: Technical implementation and compliance analysis  
- Generates synthesized consensus
- Most comprehensive option

### 3. Review Mode (`mode: "review"`)
- Reviews and validates existing analysis
- Provides quality assessment and improvements
- Best for validation of completed work

## How It Works

### Architecture
```
Claude Desktop/Code
       ↓
Collaborative MCP Proxy
       ↓
┌─────────────┬─────────────┐
│ Gemini CLI  │ Codex CLI   │
│ MCP         │ MCP         │
│ (logged in) │ (logged in) │
└─────────────┴─────────────┘
```

### Workflow
1. **Request**: Claude sends collaboration request to proxy
2. **Distribution**: Proxy calls individual MCPs via subprocess
3. **Collection**: Proxy gathers results from each MCP
4. **Synthesis**: Proxy generates consensus using Gemini
5. **Response**: Combined analysis returned to Claude

### Agent Specializations
- **Gemini**: System-level analysis, risk assessment, comprehensive evaluation
- **Codex**: Technical implementation, code quality, standards compliance  
- **Consensus**: Synthesis of all perspectives with unified recommendations

## Implementation Details

### Subprocess Calling
The proxy server calls existing MCPs as subprocesses, preserving their login sessions:

```javascript
const geminiProcess = spawn('gemini-cli-command', args);
const codexProcess = spawn('codex-cli-command', args);
```

### Error Handling
- Timeout protection (2 minutes per MCP call)
- Graceful degradation if one MCP fails
- Detailed error logging for debugging

### Mock Implementation
Current implementation includes mock responses for demonstration. To connect to real MCPs:

1. Update `callGeminiMCP()` to spawn actual Gemini CLI process
2. Update `callCodexMCP()` to spawn actual Codex CLI process  
3. Ensure proper JSON-RPC message formatting

## Development

### Testing
```bash
# Start the server in development mode
npm run dev

# Test with manual JSON-RPC calls
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node index.js
```

### Debugging
The server logs to stderr, so you can monitor activity:
```bash
node index.js 2> debug.log
```

### Extending
To add new MCPs or capabilities:
1. Add new methods to `ProxyHandler`
2. Update tool schema in `handleToolsList()`
3. Implement subprocess calling logic

## Troubleshooting

### Common Issues

**1. MCP Not Recognized**
- Verify `claude_desktop_config.json` path is correct
- Restart Claude Desktop after configuration changes
- Check file permissions on `index.js`

**2. Subprocess Errors**  
- Ensure Gemini CLI and Codex CLI are installed and logged in
- Verify MCP command paths are correct
- Check Node.js version (18+ required)

**3. Timeout Issues**
- Increase timeout in `proxy-handler.js` if needed
- Check network connectivity for external MCP calls
- Monitor stderr logs for detailed error information

### Logging
All server activity is logged to stderr:
```bash
# View logs while running
node index.js 2>&1 | grep "MCP Proxy"
```

## License

MIT License - See LICENSE file for details

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request

## Roadmap

- [ ] Real MCP subprocess integration
- [ ] Configuration file support  
- [ ] Advanced workflow orchestration
- [ ] Result caching and persistence
- [ ] Web UI for collaboration management
- [ ] Integration with more AI models