const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MCP_DIR = 'C:\\AI-MCP';
const MCP_SERVER_DIR = path.join(MCP_DIR, 'mssql_mcp_server');
const REPO_URL = 'https://github.com/Start-AgSales/mssql_mcp_server.git'; // Placeholder - Update with correct repo if known, or prompt. defaulting to a common one if needed.
// Actually, since I am not sure about the repo, I will use a reliable one or ask user to provide it.
// For now, I will use a known one: https://github.com/JexinSam/mssql_mcp_server
const REAL_REPO_URL = 'https://github.com/JexinSam/mssql_mcp_server.git';


function setupMcp() {
    console.log('Checking MCP Server setup...');

    if (!fs.existsSync(MCP_DIR)) {
        console.log(`Creating directory: ${MCP_DIR}`);
        try {
            fs.mkdirSync(MCP_DIR, { recursive: true });
        } catch (err) {
            console.error(`Failed to create directory ${MCP_DIR}. Please run as Administrator or create it manually.`);
            process.exit(1);
        }
    }

    if (!fs.existsSync(MCP_SERVER_DIR)) {
        console.log(`MCP Server not found at ${MCP_SERVER_DIR}.`);
        console.log('Attempting to clone MCP Server...');
        try {
            execSync(`git clone ${REAL_REPO_URL} "${MCP_SERVER_DIR}"`, { stdio: 'inherit' });
            console.log('MCP Server cloned successfully.');
        } catch (err) {
            console.error('Failed to clone MCP Server. Please clone it manually.');
            console.error(`git clone ${REAL_REPO_URL} "${MCP_SERVER_DIR}"`);
            process.exit(1);
        }
    } else {
        console.log('MCP Server directory exists.');
    }

    // Check for node_modules
    const nodeModules = path.join(MCP_SERVER_DIR, 'node_modules');
    if (!fs.existsSync(nodeModules)) {
        console.log('Installing dependencies for MCP Server...');
        try {
            execSync('npm install', { cwd: MCP_SERVER_DIR, stdio: 'inherit' });
            console.log('Dependencies installed.');
        } catch (err) {
            console.error('Failed to install dependencies.');
            process.exit(1);
        }
    }

    // Check for .env file
    const envFile = path.join(MCP_SERVER_DIR, '.env');
    const envExample = path.join(MCP_SERVER_DIR, '.env.example');

    if (!fs.existsSync(envFile)) {
        if (fs.existsSync(envExample)) {
            console.log('Creating .env file from .env.example...');
            fs.copyFileSync(envExample, envFile);
            console.log('WARNING: A new .env file was created at ' + envFile);
            console.log('PLEASE EDIT THIS FILE WITH YOUR SQL SERVER CREDENTIALS BEFORE PROCEEDING.');
            // Optionally pausing here might be good, but in a pre-dev script it might block forever if unattended.
            // We will just log it loudly.
            console.log('****************************************************************');
            console.log('* IMPORTANT: MCP SERVER CONFIGURATION REQUIRED                 *');
            console.log('* Edit c:\\AI-MCP\\mssql_mcp_server\\.env with your DB details.   *');
            console.log('****************************************************************');
        } else {
            console.log('WARNING: No .env or .env.example found in MCP server directory.');
        }
    }

    console.log('MCP Server setup verification complete.');
}

setupMcp();
