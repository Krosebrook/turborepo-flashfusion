/**
 * ETL & Data Quality Agent Service
 * Main orchestration service for ETL operations and data quality monitoring
 */

import { 
  ETLJobManager, 
  DataQualityChecker, 
  ETL_JOB_STATUS, 
  DATA_QUALITY_METRICS 
} from '../shared/utils/etl-data-quality.js';
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

/**
 * ETL & Data Quality Agent
 * Central service for managing ETL jobs and monitoring data quality
 */
export class ETLDataQualityAgent extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.jobManager = new ETLJobManager({
      maxConcurrentJobs: options.maxConcurrentJobs || 3,
      dataPath: options.dataPath || path.join(process.cwd(), 'data', 'etl')
    });
    
    this.qualityChecker = new DataQualityChecker({
      completenessThreshold: options.completenessThreshold || 0.95,
      uniquenessThreshold: options.uniquenessThreshold || 0.99,
      validityThreshold: options.validityThreshold || 0.98,
      ...options.qualityThresholds
    });
    
    this.reportsPath = options.reportsPath || path.join(process.cwd(), 'data', 'quality-reports');
    this.monitoringEnabled = options.monitoringEnabled !== false;
    this.monitoringInterval = options.monitoringInterval || 300000; // 5 minutes
    this.monitoringTimer = null;
    
    this.setupEventHandlers();
  }

  /**
   * Initialize the ETL & Data Quality Agent
   */
  async initialize() {
    try {
      console.log('🤖 Initializing ETL & Data Quality Agent...');
      
      // Initialize components
      await this.jobManager.initialize();
      await fs.mkdir(this.reportsPath, { recursive: true });
      
      // Start monitoring if enabled
      if (this.monitoringEnabled) {
        await this.startMonitoring();
      }
      
      console.log('✅ ETL & Data Quality Agent initialized successfully');
      this.emit('agent:initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize ETL & Data Quality Agent:', error);
      throw error;
    }
  }

  /**
   * Setup event handlers for job and quality events
   */
  setupEventHandlers() {
    // ETL Job events
    this.jobManager.on('job:created', (job) => {
      console.log(`📝 ETL Job created: ${job.name}`);
      this.emit('etl:job-created', job);
    });

    this.jobManager.on('job:started', (job) => {
      console.log(`🚀 ETL Job started: ${job.name}`);
      this.emit('etl:job-started', job);
    });

    this.jobManager.on('job:completed', async (job) => {
      console.log(`✅ ETL Job completed: ${job.name}`);
      
      // Generate and save quality report
      if (job.result && job.result.qualityReport) {
        await this.saveQualityReport(job.result.qualityReport, job.id);
      }
      
      this.emit('etl:job-completed', job);
    });

    this.jobManager.on('job:failed', (job) => {
      console.error(`❌ ETL Job failed: ${job.name} - ${job.error}`);
      this.emit('etl:job-failed', job);
    });

    // Data Quality events
    this.qualityChecker.on('quality:report', (report) => {
      this.emit('quality:report-generated', report);
    });

    this.qualityChecker.on('schema:inconsistency', (event) => {
      console.warn('⚠️ Schema inconsistency detected:', event.issues);
      this.emit('quality:schema-inconsistency', event);
    });
  }

  /**
   * Create and schedule a new ETL job
   */
  async createETLJob(jobDefinition) {
    try {
      const job = await this.jobManager.createJob(jobDefinition);
      
      // Auto-execute if specified
      if (jobDefinition.autoExecute) {
        setTimeout(() => {
          this.executeETLJob(job.id).catch(error => {
            console.error(`Auto-execution failed for job ${job.id}:`, error);
          });
        }, 1000);
      }
      
      return job;
    } catch (error) {
      console.error('Failed to create ETL job:', error);
      throw error;
    }
  }

  /**
   * Execute an ETL job with comprehensive monitoring
   */
  async executeETLJob(jobId) {
    try {
      const startTime = Date.now();
      
      console.log(`🔄 Executing ETL job: ${jobId}`);
      
      const job = await this.jobManager.executeJob(jobId);
      
      const duration = Date.now() - startTime;
      console.log(`⏱️ ETL job completed in ${duration}ms`);
      
      // Perform additional quality analysis
      if (job.result && job.result.qualityReport) {
        await this.analyzeQualityTrends(job.result.qualityReport, jobId);
      }
      
      return job;
    } catch (error) {
      console.error(`ETL job execution failed for ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Run standalone data quality assessment
   */
  async assessDataQuality(data, rules = {}) {
    try {
      console.log(`🔍 Assessing data quality for ${data.length} records...`);
      
      const report = await this.qualityChecker.performQualityChecks(data, rules);
      
      // Save the report
      const reportId = `quality_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await this.saveQualityReport(report, reportId);
      
      console.log(`📊 Data quality assessment completed. Score: ${(report.overallScore * 100).toFixed(1)}%`);
      
      return report;
    } catch (error) {
      console.error('Data quality assessment failed:', error);
      throw error;
    }
  }

  /**
   * Validate schema consistency for a dataset
   */
  async validateSchema(data, expectedSchema) {
    try {
      const result = await this.qualityChecker.validateSchemaConsistency(data, expectedSchema);
      
      if (!result.consistent) {
        console.warn('⚠️ Schema validation failed:', result.issues);
        
        // Emit schema inconsistency event
        this.emit('quality:schema-validation-failed', {
          issues: result.issues,
          dataSize: data.length,
          expectedSchema
        });
      } else {
        console.log('✅ Schema validation passed');
      }
      
      return result;
    } catch (error) {
      console.error('Schema validation failed:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive status of all ETL operations
   */
  getETLStatus() {
    const jobs = this.jobManager.listJobs();
    
    const status = {
      totalJobs: jobs.length,
      runningJobs: jobs.filter(job => job.status === ETL_JOB_STATUS.RUNNING).length,
      completedJobs: jobs.filter(job => job.status === ETL_JOB_STATUS.COMPLETED).length,
      failedJobs: jobs.filter(job => job.status === ETL_JOB_STATUS.FAILED).length,
      pendingJobs: jobs.filter(job => job.status === ETL_JOB_STATUS.PENDING).length,
      recentJobs: jobs.slice(0, 10), // Most recent 10 jobs
      timestamp: new Date().toISOString()
    };
    
    return status;
  }

  /**
   * Get data quality metrics summary
   */
  async getQualityMetrics() {
    try {
      const reportFiles = await fs.readdir(this.reportsPath);
      const qualityReports = reportFiles.filter(file => file.startsWith('quality_') && file.endsWith('.json'));
      
      let totalReports = 0;
      let totalScore = 0;
      const metricsTrends = {
        completeness: [],
        uniqueness: [],
        validity: [],
        consistency: []
      };
      
      // Analyze recent reports (last 10)
      const recentReports = qualityReports.slice(-10);
      
      for (const reportFile of recentReports) {
        try {
          const reportPath = path.join(this.reportsPath, reportFile);
          const reportData = await fs.readFile(reportPath, 'utf8');
          const report = JSON.parse(reportData);
          
          totalReports++;
          totalScore += report.overallScore;
          
          // Collect metrics trends
          Object.keys(metricsTrends).forEach(metric => {
            if (report.metrics[metric] && report.metrics[metric].score !== undefined) {
              metricsTrends[metric].push({
                timestamp: report.timestamp,
                score: report.metrics[metric].score
              });
            }
          });
          
        } catch (error) {
          console.error(`Failed to read report ${reportFile}:`, error);
        }
      }
      
      const averageScore = totalReports > 0 ? totalScore / totalReports : 0;
      
      return {
        totalReports,
        averageQualityScore: averageScore,
        trends: metricsTrends,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Failed to get quality metrics:', error);
      return {
        totalReports: 0,
        averageQualityScore: 0,
        trends: {},
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate comprehensive data quality report
   */
  async generateComprehensiveReport() {
    try {
      const etlStatus = this.getETLStatus();
      const qualityMetrics = await this.getQualityMetrics();
      
      const report = {
        generatedAt: new Date().toISOString(),
        summary: {
          totalETLJobs: etlStatus.totalJobs,
          successfulJobs: etlStatus.completedJobs,
          failedJobs: etlStatus.failedJobs,
          averageQualityScore: qualityMetrics.averageQualityScore,
          totalQualityReports: qualityMetrics.totalReports
        },
        etlStatus,
        qualityMetrics,
        recommendations: await this.generateSystemRecommendations(etlStatus, qualityMetrics)
      };
      
      // Save comprehensive report
      const reportPath = path.join(this.reportsPath, `comprehensive_report_${Date.now()}.json`);
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      
      console.log('📊 Comprehensive data quality report generated');
      this.emit('report:comprehensive-generated', report);
      
      return report;
    } catch (error) {
      console.error('Failed to generate comprehensive report:', error);
      throw error;
    }
  }

  /**
   * Start monitoring data quality and ETL operations
   */
  async startMonitoring() {
    if (this.monitoringTimer) {
      return; // Already monitoring
    }
    
    console.log('🔍 Starting data quality monitoring...');
    
    this.monitoringTimer = setInterval(async () => {
      try {
        await this.performMonitoringCheck();
      } catch (error) {
        console.error('Monitoring check failed:', error);
      }
    }, this.monitoringInterval);
    
    // Perform initial check
    await this.performMonitoringCheck();
    
    this.emit('monitoring:started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
      console.log('🔍 Data quality monitoring stopped');
      this.emit('monitoring:stopped');
    }
  }

  /**
   * Perform periodic monitoring check
   */
  async performMonitoringCheck() {
    try {
      const etlStatus = this.getETLStatus();
      const qualityMetrics = await this.getQualityMetrics();
      
      // Check for alerts
      const alerts = [];
      
      // ETL job failures
      if (etlStatus.failedJobs > 0) {
        alerts.push({
          type: 'etl_failures',
          severity: 'high',
          message: `${etlStatus.failedJobs} ETL jobs have failed`,
          details: etlStatus
        });
      }
      
      // Low quality scores
      if (qualityMetrics.averageQualityScore < 0.8) {
        alerts.push({
          type: 'low_quality_score',
          severity: 'medium',
          message: `Average data quality score is ${(qualityMetrics.averageQualityScore * 100).toFixed(1)}%`,
          details: qualityMetrics
        });
      }
      
      // Long-running jobs
      const longRunningJobs = etlStatus.recentJobs.filter(job => {
        if (job.status === ETL_JOB_STATUS.RUNNING && job.metrics.startTime) {
          const runtime = Date.now() - new Date(job.metrics.startTime).getTime();
          return runtime > 3600000; // 1 hour
        }
        return false;
      });
      
      if (longRunningJobs.length > 0) {
        alerts.push({
          type: 'long_running_jobs',
          severity: 'medium',
          message: `${longRunningJobs.length} jobs have been running for over 1 hour`,
          details: longRunningJobs
        });
      }
      
      // Emit alerts
      alerts.forEach(alert => {
        console.warn(`⚠️ Data Quality Alert [${alert.severity}]: ${alert.message}`);
        this.emit('alert:triggered', alert);
      });
      
      // Emit monitoring update
      this.emit('monitoring:update', {
        timestamp: new Date().toISOString(),
        etlStatus,
        qualityMetrics,
        alerts
      });
      
    } catch (error) {
      console.error('Monitoring check failed:', error);
    }
  }

  /**
   * Save data quality report to file
   */
  async saveQualityReport(report, jobId) {
    try {
      const filename = `quality_report_${jobId}_${Date.now()}.json`;
      const filepath = path.join(this.reportsPath, filename);
      
      await fs.writeFile(filepath, JSON.stringify(report, null, 2));
      
      console.log(`💾 Quality report saved: ${filename}`);
      this.emit('report:saved', { filepath, report });
      
    } catch (error) {
      console.error('Failed to save quality report:', error);
    }
  }

  /**
   * Analyze quality trends over time
   */
  async analyzeQualityTrends(currentReport, jobId) {
    try {
      // This would implement trend analysis logic
      // For now, just log key metrics
      const score = currentReport.overallScore;
      
      if (score < 0.7) {
        console.warn(`⚠️ Low data quality score detected: ${(score * 100).toFixed(1)}%`);
        
        this.emit('quality:low-score-alert', {
          jobId,
          score,
          report: currentReport
        });
      }
      
      if (currentReport.anomalies && currentReport.anomalies.length > 0) {
        console.warn(`🔍 ${currentReport.anomalies.length} data anomalies detected`);
        
        this.emit('quality:anomalies-detected', {
          jobId,
          anomalies: currentReport.anomalies
        });
      }
      
    } catch (error) {
      console.error('Failed to analyze quality trends:', error);
    }
  }

  /**
   * Generate system-level recommendations
   */
  async generateSystemRecommendations(etlStatus, qualityMetrics) {
    const recommendations = [];
    
    // ETL performance recommendations
    if (etlStatus.failedJobs > etlStatus.completedJobs * 0.1) {
      recommendations.push({
        category: 'ETL Performance',
        priority: 'high',
        message: 'High ETL job failure rate detected',
        actions: [
          'Review failed job logs for common issues',
          'Implement better error handling and retry logic',
          'Consider resource allocation adjustments'
        ]
      });
    }
    
    // Data quality recommendations
    if (qualityMetrics.averageQualityScore < 0.85) {
      recommendations.push({
        category: 'Data Quality',
        priority: 'high',
        message: 'Data quality scores below recommended threshold',
        actions: [
          'Implement stricter data validation rules',
          'Review data sources for quality issues',
          'Set up automated data quality monitoring'
        ]
      });
    }
    
    // Monitoring recommendations
    if (qualityMetrics.totalReports < 10) {
      recommendations.push({
        category: 'Monitoring',
        priority: 'medium',
        message: 'Limited data quality monitoring history',
        actions: [
          'Increase frequency of quality assessments',
          'Implement real-time quality monitoring',
          'Set up quality metric alerting'
        ]
      });
    }
    
    return recommendations;
  }

  /**
   * Get agent status and health
   */
  getAgentStatus() {
    return {
      initialized: true,
      monitoring: this.monitoringEnabled && this.monitoringTimer !== null,
      monitoringInterval: this.monitoringInterval,
      jobManagerStatus: this.jobManager ? 'active' : 'inactive',
      qualityCheckerStatus: this.qualityChecker ? 'active' : 'inactive',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cleanup and shutdown the agent
   */
  async shutdown() {
    try {
      console.log('🛑 Shutting down ETL & Data Quality Agent...');
      
      this.stopMonitoring();
      
      // Cancel any running jobs
      const runningJobs = this.jobManager.listJobs({ status: ETL_JOB_STATUS.RUNNING });
      for (const job of runningJobs) {
        try {
          await this.jobManager.cancelJob(job.id);
        } catch (error) {
          console.error(`Failed to cancel job ${job.id}:`, error);
        }
      }
      
      this.emit('agent:shutdown');
      console.log('✅ ETL & Data Quality Agent shutdown complete');
      
    } catch (error) {
      console.error('Error during agent shutdown:', error);
      throw error;
    }
  }
}

export default ETLDataQualityAgent;