#!/usr/bin/env node

const { Command } = require('commander');
const StaticAnalyzer = require('./index');
const chalk = require('chalk');
const path = require('path');

const program = new Command();

program
  .name('ff-analyze')
  .description('FlashFusion Static Analysis Tool for Security and Quality')
  .version('1.0.0');

program
  .command('scan')
  .description('Scan codebase for security and quality issues')
  .option('-p, --path <path>', 'Path to scan', process.cwd())
  .option('-o, --output <file>', 'Output report file')
  .option('-f, --format <format>', 'Output format (json, text, html)', 'text')
  .option('--severity <level>', 'Minimum severity level (low, medium, high, critical)', 'low')
  .option('--include-quality', 'Include quality checks', false)
  .option('--include-security', 'Include security checks', true)
  .option('--exclude <patterns>', 'Exclude patterns (comma-separated)')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔍 FlashFusion Static Analysis Tool'));
      console.log(chalk.gray(`Scanning: ${options.path}`));
      
      const analyzer = new StaticAnalyzer({
        includeSecurity: options.includeSecurity,
        includeQuality: options.includeQuality,
        minSeverity: options.severity,
        excludePatterns: options.exclude ? options.exclude.split(',') : []
      });
      
      const results = await analyzer.scan(options.path);
      
      if (options.output) {
        await analyzer.exportResults(results, options.output, options.format);
        console.log(chalk.green(`Report saved to: ${options.output}`));
      } else {
        analyzer.printResults(results);
      }
      
      // Exit with appropriate code
      const hasHighSeverity = results.findings.some(f => 
        f.severity === 'critical' || f.severity === 'high'
      );
      process.exit(hasHighSeverity ? 1 : 0);
      
    } catch (error) {
      console.error(chalk.red('❌ Analysis failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('rules')
  .description('List all available analysis rules')
  .action(() => {
    const analyzer = new StaticAnalyzer();
    analyzer.listRules();
  });

program.parse();