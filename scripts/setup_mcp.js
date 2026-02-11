import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Define __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const TARGET_ROOT = 'C:\\AI-MCP';
const TARGET_DIR = path.join(TARGET_ROOT, 'mssql_mcp_server');
const SOURCE_DIR = path.resolve(__dirname, '../mssql_mcp_server');
const SERVER_ENV_PATH = path.resolve(__dirname, '../server/.env');

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        if (path.basename(src) === 'node_modules' || path.basename(src) === '.git') {
            return;
        }

        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }

        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

function setupMcp() {
    console.log('\n--- Checking MCP Server setup ---');
    console.log(`Target Directory: ${TARGET_DIR}`);

    // 1. Create Target Root if needed
    if (!fs.existsSync(TARGET_ROOT)) {
        console.log(`Creating directory: ${TARGET_ROOT}`);
        try {
            fs.mkdirSync(TARGET_ROOT, { recursive: true });
        } catch (err) {
            console.error(`Failed to create directory ${TARGET_ROOT}. Please run as Administrator or create it manually.`);
            process.exit(1);
        }
    }

    // 2. Install (Copy) MCP Server if not present
    if (!fs.existsSync(TARGET_DIR)) {
        console.log(`MCP Server not found at ${TARGET_DIR}.`);
        console.log('Installing MCP Server from local project files...');

        if (!fs.existsSync(SOURCE_DIR)) {
            console.error(`Error: Source directory not found at ${SOURCE_DIR}`);
            console.error('Cannot install MCP Server. Please ensure the mssql_mcp_server folder exists in the project root.');
            process.exit(1);
        }

        try {
            copyRecursiveSync(SOURCE_DIR, TARGET_DIR);
            console.log('MCP Server files copied successfully.');
        } catch (err) {
            console.error('Failed to copy MCP Server files:', err);
            process.exit(1);
        }
    } else {
        console.log('MCP Server directory exists.');
    }

    // 3. Install Dependencies
    const nodeModules = path.join(TARGET_DIR, 'node_modules');
    if (!fs.existsSync(nodeModules)) {
        console.log('Installing dependencies for MCP Server...');
        try {
            execSync('npm install', { cwd: TARGET_DIR, stdio: 'inherit' });
            console.log('Dependencies installed.');
        } catch (err) {
            console.error('Failed to install dependencies for MCP Server.');
            process.exit(1);
        }
    }

    // 4. Check for .env file in MCP Server
    const envFile = path.join(TARGET_DIR, '.env');
    const envExample = path.join(TARGET_DIR, '.env.example');

    if (!fs.existsSync(envFile)) {
        if (fs.existsSync(envExample)) {
            console.log('Creating MCP .env file from .env.example...');
            try {
                fs.copyFileSync(envExample, envFile);
                console.log('WARNING: A new .env file was created at ' + envFile);
                console.log('PLEASE EDIT THIS FILE WITH YOUR SQL SERVER CREDENTIALS BEFORE PROCEEDING.');
            } catch (err) {
                console.error('Failed to create .env file:', err);
            }
        } else {
            console.log('WARNING: No .env or .env.example found in MCP server directory.');
        }
    }
    console.log('MCP Server setup verification complete.\n');
}

async function setupAIKey() {
    console.log('--- AI API Key Setup ---');

    let existingEnv = '';
    if (fs.existsSync(SERVER_ENV_PATH)) {
        existingEnv = fs.readFileSync(SERVER_ENV_PATH, 'utf8');
    }

    // Check if any AI key is already configured
    if (existingEnv.includes('GEMINI_API_KEY') || existingEnv.includes('DEEPSEEK_API_KEY') || existingEnv.includes('OPENAI_API_KEY')) {
        console.log('AI API Key is already configured in server/.env.');
        console.log('Skipping AI Key setup. Edit server/.env manually if you wish to change it.\n');
        return;
    }

    console.log('No AI API Key found. You need to configure one for the Dashboard App.');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

    try {
        console.log('Select your AI Provider:');
        console.log('1. Gemini (Google)');
        console.log('2. DeepSeek');
        console.log('3. OpenAI (GPT-4)');
        console.log('4. Skip (Configure later)');

        const choice = await askQuestion('Enter number (1-4): ');

        let keyName = '';

        switch (choice.trim()) {
            case '1':
                keyName = 'GEMINI_API_KEY';
                break;
            case '2':
                keyName = 'DEEPSEEK_API_KEY';
                break;
            case '3':
                keyName = 'OPENAI_API_KEY';
                break;
            case '4':
                console.log('Skipping AI setup. You can configure it manually in server/.env');
                rl.close();
                return;
            default:
                console.log('Invalid choice. Skipping.');
                rl.close();
                return;
        }

        const apiKey = await askQuestion(`Enter your ${keyName}: `);

        if (apiKey.trim()) {
            // Check if server/.env directory exists
            const serverDir = path.dirname(SERVER_ENV_PATH);
            if (!fs.existsSync(serverDir)) {
                fs.mkdirSync(serverDir, { recursive: true });
            }

            // Append or create .env
            let newContent = existingEnv;
            if (newContent && !newContent.endsWith('\n')) newContent += '\n';
            newContent += `${keyName}=${apiKey.trim()}\n`;

            // Ensure PORT is there too if creating fresh
            if (!newContent.includes('PORT=')) {
                newContent += 'PORT=3030\n';
            }

            fs.writeFileSync(SERVER_ENV_PATH, newContent);
            console.log(`Successfully saved ${keyName} to server/.env`);
        } else {
            console.log('No API Key entered. Setup skipped.');
        }

    } catch (err) {
        console.error('Error during AI setup:', err);
    } finally {
        rl.close();
    }
    console.log('AI Setup complete.\n');
}

async function main() {
    setupMcp();
    await setupAIKey();
}

main();
