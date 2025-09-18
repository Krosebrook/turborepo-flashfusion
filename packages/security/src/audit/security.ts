export type SecurityEventType = 
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'password_change'
  | 'api_key_created'
  | 'api_key_revoked'
  | 'unauthorized_access'
  | 'rate_limit_exceeded';

export function logSecurityEvent(
  type: SecurityEventType,
  userId?: string,
  details: Record<string, any> = {},
  ip?: string
): void {
  const event = {
    timestamp: new Date().toISOString(),
    type,
    userId,
    details,
    ip,
    severity: getSeverity(type)
  };

  console.log('SECURITY EVENT:', JSON.stringify(event));
  
  // In a real implementation, this would send to a security monitoring system
}

function getSeverity(type: SecurityEventType): 'low' | 'medium' | 'high' | 'critical' {
  switch (type) {
    case 'login_success':
      return 'low';
    case 'login_attempt':
    case 'password_change':
    case 'api_key_created':
      return 'medium';
    case 'login_failure':
    case 'api_key_revoked':
    case 'rate_limit_exceeded':
      return 'high';
    case 'unauthorized_access':
      return 'critical';
    default:
      return 'medium';
  }
}