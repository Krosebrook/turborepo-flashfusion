import { AuditLogEntry } from '../types';

export interface AuditEvent {
  action: string;
  resource: string;
  userId?: string;
  details: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

export function createAuditLogger() {
  const logs: AuditLogEntry[] = [];

  return {
    log: (event: AuditEvent, success: boolean = true) => {
      const entry: AuditLogEntry = {
        timestamp: new Date().toISOString(),
        userId: event.userId,
        action: event.action,
        resource: event.resource,
        details: event.details,
        ip: event.ip,
        userAgent: event.userAgent,
        success
      };
      
      logs.push(entry);
      console.log('AUDIT:', JSON.stringify(entry));
    },
    
    getLogs: () => [...logs],
    
    clearLogs: () => {
      logs.length = 0;
    }
  };
}