#!/usr/bin/env node

/**
 * FlashFusion Compliance CLI
 * Command-line interface for GDPR/CCPA compliance checking
 */

const path = require('path');
const { ComplianceChecker } = require('./index');

const args = process.argv.slice(2);
const commands = {
    check: 'Run full compliance check',
    'data-map': 'Generate data mapping only',
    'gdpr-only': 'Run GDPR compliance check only',
    'ccpa-only': 'Run CCPA compliance check only',
    help: 'Show this help message'
};

function showHelp() {
    console.log('FlashFusion Compliance Suite CLI\n');
    console.log('Usage: node cli.js <command> [options]\n');
    console.log('Commands:');
    Object.entries(commands).forEach(([cmd, desc]) => {
        console.log(`  ${cmd.padEnd(12)} ${desc}`);
    });
    console.log('\nOptions:');
    console.log('  --root <path>      Root directory to scan (default: current directory)');
    console.log('  --config <path>    Path to compliance config file');
    console.log('  --output <path>    Output file path for report');
    console.log('  --format <type>    Output format: json, txt, html (default: json)');
    console.log('\nExamples:');
    console.log('  node cli.js check');
    console.log('  node cli.js check --root /path/to/project --output compliance-report.json');
    console.log('  node cli.js gdpr-only --config custom-config.json');
}

function parseArgs(args) {
    const options = {
        command: args[0] || 'help',
        rootPath: process.cwd(),
        configPath: null,
        outputPath: null,
        format: 'json'
    };

    for (let i = 1; i < args.length; i += 2) {
        const flag = args[i];
        const value = args[i + 1];

        switch (flag) {
            case '--root':
                options.rootPath = path.resolve(value);
                break;
            case '--config':
                options.configPath = path.resolve(value);
                break;
            case '--output':
                options.outputPath = path.resolve(value);
                break;
            case '--format':
                options.format = value;
                break;
        }
    }

    return options;
}

async function main() {
    const options = parseArgs(args);

    if (options.command === 'help' || !commands[options.command]) {
        showHelp();
        return;
    }

    console.log(`🔍 Running FlashFusion Compliance Check: ${options.command}`);
    console.log(`📁 Scanning: ${options.rootPath}`);

    try {
        const checker = new ComplianceChecker({
            rootPath: options.rootPath,
            configPath: options.configPath,
            outputPath: options.outputPath
        });

        let result;

        switch (options.command) {
            case 'check':
                result = await checker.run();
                break;
            case 'data-map':
                const dataMap = await checker.mapDataSources();
                console.log('\n📊 Data Mapping Complete');
                console.log(`   Databases: ${dataMap.databases.length}`);
                console.log(`   Files: ${dataMap.files.length}`);
                console.log(`   API Endpoints: ${dataMap.apiEndpoints.length}`);
                console.log(`   Third-party Integrations: ${dataMap.thirdPartyIntegrations.length}`);
                return;
            case 'gdpr-only':
                // Run GDPR check only
                const gdprDataMap = await checker.mapDataSources();
                const gdprResult = await checker.checkGDPRCompliance(gdprDataMap, await checker.loadConfig());
                console.log('\n🇪🇺 GDPR Compliance Check Complete');
                console.log(`   Violations: ${gdprResult.violations.length}`);
                console.log(`   Warnings: ${gdprResult.warnings.length}`);
                console.log(`   Compliant: ${gdprResult.compliant.length}`);
                return;
            case 'ccpa-only':
                // Run CCPA check only
                const ccpaDataMap = await checker.mapDataSources();
                const ccpaResult = await checker.checkCCPACompliance(ccpaDataMap, await checker.loadConfig());
                console.log('\n🇺🇸 CCPA Compliance Check Complete');
                console.log(`   Violations: ${ccpaResult.violations.length}`);
                console.log(`   Warnings: ${ccpaResult.warnings.length}`);
                console.log(`   Compliant: ${ccpaResult.compliant.length}`);
                return;
        }

        if (result) {
            console.log('\n✅ Compliance check completed successfully');
            console.log(`📄 Report saved to: ${options.outputPath || 'compliance-report.json'}`);
        }

    } catch (error) {
        console.error('❌ Compliance check failed:', error.message);
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main, parseArgs, showHelp };