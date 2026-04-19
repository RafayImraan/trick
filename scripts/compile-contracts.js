const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONTRACTS_DIR = path.join(__dirname, '..', 'contracts');
const OUTPUT_DIR = path.join(__dirname, '..', 'artifacts');

function compile() {
    console.log('Compiling Solidity contracts...');

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    try {
        const output = execSync('npx hardhat compile', {
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit'
        });
        console.log('Compilation successful!');
    } catch (error) {
        console.error('Compilation failed:', error.message);
        process.exit(1);
    }
}

function generateABI() {
    console.log('Generating ABI for frontend...');

    const artifactsDir = path.join(__dirname, '..', 'artifacts', 'contracts');

    if (!fs.existsSync(artifactsDir)) {
        console.log('No artifacts found. Run compile first.');
        return;
    }

    const abis = {};

    const files = fs.readdirSync(artifactsDir);
    for (const file of files) {
        const filePath = path.join(artifactsDir, file);
        if (fs.statSync(filePath).isDirectory()) {
            const jsonFiles = fs.readdirSync(filePath);
            for (const jsonFile of jsonFiles) {
                if (jsonFile.endsWith('.json')) {
                    const artifact = JSON.parse(
                        fs.readFileSync(path.join(filePath, jsonFile), 'utf8')
                    );
                    const contractName = jsonFile.replace('.json', '');
                    abis[contractName] = artifact.abi;
                }
            }
        }
    }

    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'abis.json'),
        JSON.stringify(abis, null, 2)
    );
    console.log('ABIs written to artifacts/abis.json');
}

const args = process.argv.slice(2);
if (args.includes('--compile')) {
    compile();
}
if (args.includes('--abi')) {
    generateABI();
}
if (args.length === 0) {
    compile();
    generateABI();
}