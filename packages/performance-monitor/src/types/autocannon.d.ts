declare module 'autocannon' {
  interface AutocannonOptions {
    url: string;
    connections?: number;
    duration?: number;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: string;
    workers?: number;
    title?: string;
  }

  interface AutocannonResult {
    latency?: {
      mean?: number;
      p50?: number;
      p75?: number;
      p90?: number;
      p95?: number;
      p99?: number;
      max?: number;
      min?: number;
    };
    requests?: {
      total?: number;
      sent?: number;
      average?: number;
      min?: number;
      max?: number;
    };
    errors?: number;
    duration?: number;
    connections?: number;
  }

  function autocannon(options: AutocannonOptions): Promise<AutocannonResult>;
  export = autocannon;
}