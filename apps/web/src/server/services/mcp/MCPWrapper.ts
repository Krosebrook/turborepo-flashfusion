// server/services/mcp/MCPWrapper.ts
// Claude-MCP Wrapper for Safe Autonomous Operations

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface MCPCheckpoint {
  id: string;
  timestamp: string;
  action: 'pre_mutation' | 'post_diff' | 'pre_commit' | 'token_threshold';
  description: string;
  files_affected: string[];
  diff_preview?: string;
  rollback_command?: string;
  human_approval_required: boolean;
  approved?: boolean;
  approved_by?: string;
  approved_at?: string;
}

export interface MCPMutation {
  file_path: string;
  operation: 'create' | 'update' | 'delete';
  original_content?: string;
  new_content?: string;
  diff?: string;
  backup_path?: string;
}

export interface MCPAuditEntry {
  timestamp: string;
  action: string;
  description: string;
  token_count: number;
  files_affected: string[];
  checkpoint_id?: string;
  mutations?: MCPMutation[];
  error?: string;
  rollback_performed?: boolean;
}

export class MCPWrapper {
    private static instance: MCPWrapper;
    private auditLog: MCPAuditEntry[] = [];
    private checkpoints: MCPCheckpoint[] = [];
    private tokenUsage: number = 0;
    private readonly tokenLimit: number = 20000;
    private readonly tokenCheckpoint: number = 17000;
    private readonly auditPath: string =
        'C:\\Users\\kyler\\FlashFusion\\mcp_audit\\logbook.json';
    private readonly backupPath: string =
        'C:\\Users\\kyler\\FlashFusion\\mcp_sandbox\\backups';

    private constructor() {
        this.loadAuditLog();
    }

    static getInstance(): MCPWrapper {
        if (!MCPWrapper.instance) {
            MCPWrapper.instance = new MCPWrapper();
        }
        return MCPWrapper.instance;
    }

    /**
   * Create a checkpoint before any mutation
   */
    async createCheckpoint(
        action: MCPCheckpoint['action'],
        description: string,
        files: string[],
        requiresApproval: boolean = true
    ): Promise<MCPCheckpoint> {
        const checkpoint: MCPCheckpoint = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            action,
            description,
            files_affected: files,
            human_approval_required: requiresApproval
        };

        this.checkpoints.push(checkpoint);
        await this.logAuditEntry({
            timestamp: checkpoint.timestamp,
            action: 'CHECKPOINT_CREATED',
            description: `Checkpoint created: ${description}`,
            token_count: this.tokenUsage,
            files_affected: files,
            checkpoint_id: checkpoint.id
        });

        return checkpoint;
    }

    /**
   * Generate diff preview for file mutation
   */
    async generateDiffPreview(
        filePath: string,
        newContent: string
    ): Promise<{ diff: string; backup_path: string }> {
        const originalContent = await this.readFileSafely(filePath);
        const diff = this.createDiff(originalContent, newContent);
        const backupPath = await this.createBackup(filePath, originalContent);

        return { diff, backup_path: backupPath };
    }

    /**
   * Execute mutation with safety checks
   */
    async executeMutation(
        mutation: MCPMutation,
        checkpointId: string
    ): Promise<boolean> {
        const checkpoint = this.checkpoints.find((cp) => cp.id === checkpointId);

        if (!checkpoint) {
            throw new Error('Invalid checkpoint ID');
        }

        if (checkpoint.human_approval_required && !checkpoint.approved) {
            throw new Error('Human approval required but not granted');
        }

        try {
            // Create backup before mutation
            if (mutation.original_content) {
                mutation.backup_path = await this.createBackup(
                    mutation.file_path,
                    mutation.original_content
                );
            }

            // Execute the mutation
            await fs.promises.writeFile(
                mutation.file_path,
                mutation.new_content || ''
            );

            await this.logAuditEntry({
                timestamp: new Date().toISOString(),
                action: 'MUTATION_EXECUTED',
                description: `File ${mutation.operation}: ${mutation.file_path}`,
                token_count: this.tokenUsage,
                files_affected: [mutation.file_path],
                checkpoint_id: checkpointId,
                mutations: [mutation]
            });

            return true;
        } catch (error) {
            await this.rollback(mutation);
            throw error;
        }
    }

    /**
   * Rollback a mutation
   */
    async rollback(mutation: MCPMutation): Promise<void> {
        if (mutation.backup_path && mutation.original_content !== undefined) {
            await fs.promises.writeFile(
                mutation.file_path,
                mutation.original_content
            );

            await this.logAuditEntry({
                timestamp: new Date().toISOString(),
                action: 'ROLLBACK_PERFORMED',
                description: `Rolled back mutation on ${mutation.file_path}`,
                token_count: this.tokenUsage,
                files_affected: [mutation.file_path],
                rollback_performed: true
            });
        }
    }

    /**
   * Update token usage and check limits
   */
    async updateTokenUsage(tokens: number): Promise<void> {
        this.tokenUsage += tokens;

        if (this.tokenUsage >= this.tokenLimit) {
            throw new Error('Token limit exceeded');
        }

        if (this.tokenUsage >= this.tokenCheckpoint) {
            await this.createCheckpoint(
                'token_threshold',
                `Token usage at ${this.tokenUsage}/${this.tokenLimit}`,
                [],
                true
            );
        }
    }

    /**
   * Get checkpoint status
   */
    getCheckpointStatus(checkpointId: string): MCPCheckpoint | undefined {
        return this.checkpoints.find((cp) => cp.id === checkpointId);
    }

    /**
   * Approve checkpoint
   */
    async approveCheckpoint(
        checkpointId: string,
        approvedBy: string = 'human'
    ): Promise<void> {
        const checkpoint = this.checkpoints.find((cp) => cp.id === checkpointId);

        if (!checkpoint) {
            throw new Error('Checkpoint not found');
        }

        checkpoint.approved = true;
        checkpoint.approved_by = approvedBy;
        checkpoint.approved_at = new Date().toISOString();

        await this.logAuditEntry({
            timestamp: checkpoint.approved_at,
            action: 'CHECKPOINT_APPROVED',
            description: `Checkpoint ${checkpointId} approved by ${approvedBy}`,
            token_count: this.tokenUsage,
            files_affected: checkpoint.files_affected,
            checkpoint_id: checkpointId
        });
    }

    /**
   * Private helper methods
   */
    private async readFileSafely(filePath: string): Promise<string> {
        try {
            return await fs.promises.readFile(filePath, 'utf-8');
        } catch {
            return '';
        }
    }

    private createDiff(original: string, updated: string): string {
    // Simple diff representation (in production, use a proper diff library)
        const originalLines = original.split('\\n');
        const updatedLines = updated.split('\\n');
        let diff = '';

        const maxLines = Math.max(originalLines.length, updatedLines.length);

        for (let i = 0; i < maxLines; i++) {
            if (originalLines[i] !== updatedLines[i]) {
                if (originalLines[i]) {diff += `- ${originalLines[i]}\\n`;}
                if (updatedLines[i]) {diff += `+ ${updatedLines[i]}\\n`;}
            }
        }

        return diff || 'No changes';
    }

    private async createBackup(
        filePath: string,
        content: string
    ): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = path.basename(filePath);
        const backupFileName = `${timestamp}_${fileName}`;
        const backupFilePath = path.join(this.backupPath, backupFileName);

        await fs.promises.writeFile(backupFilePath, content);
        return backupFilePath;
    }

    private async logAuditEntry(entry: MCPAuditEntry): Promise<void> {
        this.auditLog.push(entry);
        await this.saveAuditLog();
    }

    private async loadAuditLog(): Promise<void> {
        try {
            const logContent = await fs.promises.readFile(this.auditPath, 'utf-8');
            const logData = JSON.parse(logContent);
            this.auditLog = logData.audit_entries || [];
            this.tokenUsage = logData.audit_entries?.slice(-1)[0]?.token_count || 0;
        } catch {
            // Initialize if not exists
            this.auditLog = [];
        }
    }

    private async saveAuditLog(): Promise<void> {
        const logData = JSON.parse(
            await fs.promises.readFile(this.auditPath, 'utf-8')
        );
        logData.audit_entries = this.auditLog;
        await fs.promises.writeFile(
            this.auditPath,
            JSON.stringify(logData, null, 2)
        );
    }

    /**
   * Get current status
   */
    getStatus(): {
    tokenUsage: number;
    tokenLimit: number;
    checkpointCount: number;
    pendingApprovals: number;
    } {
        return {
            tokenUsage: this.tokenUsage,
            tokenLimit: this.tokenLimit,
            checkpointCount: this.checkpoints.length,
            pendingApprovals: this.checkpoints.filter(
                (cp) => cp.human_approval_required && !cp.approved
            ).length
        };
    }
}