export const systemLogs: string[] = [];
const MAX_LOGS = 200;

export function initLogger() {
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);

  function captureLog(chunk: any) {
    if (typeof chunk === 'string') {
      // Strip ANSI escape codes
      const cleanChunk = chunk.replace(/\x1B\[\d+m/g, '');
      const lines = cleanChunk.split('\n').filter(line => line.trim() !== '');
      
      lines.forEach(line => {
        // Filter out polling logs
        if (line.includes('/api/admin/system-logs') || line.includes('/api/admin/audit-logs')) {
          return;
        }
        
        systemLogs.push(`[${new Date().toISOString()}] ${line}`);
        if (systemLogs.length > MAX_LOGS) {
          systemLogs.shift();
        }
      });
    }
  }

  process.stdout.write = (chunk: any, encoding?: any, callback?: any) => {
    captureLog(chunk);
    return originalStdoutWrite(chunk, encoding, callback);
  };

  process.stderr.write = (chunk: any, encoding?: any, callback?: any) => {
    captureLog(chunk);
    return originalStderrWrite(chunk, encoding, callback);
  };
}
