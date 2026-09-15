import { sanitizeSymbol, sanitizeInterval, sanitizeWorkers } from '../../../../lib/utils/stockSanitizer';

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`[FAIL] ${message} - Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`);
  }
}

console.log('Running security sanitization unit tests...');

// 1. Symbol Sanitization & Injection Prevention Tests
assertEqual(sanitizeSymbol('AAPL'), 'AAPL', 'Valid symbol AAPL');
assertEqual(sanitizeSymbol('PTT.BK'), 'PTT.BK', 'Valid symbol PTT.BK');
assertEqual(sanitizeSymbol('BRK.A'), 'BRK.A', 'Valid symbol BRK.A');
assertEqual(sanitizeSymbol('  tsla  '), 'TSLA', 'Trims and upper-cases tsla');

// Shell Command Injections should return null (rejected)
assertEqual(sanitizeSymbol('AAPL; cat /etc/passwd'), null, 'Rejects command injection with semicolon');
assertEqual(sanitizeSymbol('AAPL | whoami'), null, 'Rejects command injection with pipe');
assertEqual(sanitizeSymbol('`id`'), null, 'Rejects command injection with backticks');
assertEqual(sanitizeSymbol('$(calc)'), null, 'Rejects command injection with subshell syntax');
assertEqual(sanitizeSymbol('AAPL & calc'), null, 'Rejects command injection with ampersand');
assertEqual(sanitizeSymbol('AAPL" && dir'), null, 'Rejects double quotes and ampersands');
assertEqual(sanitizeSymbol("AAPL' OR '1'='1"), null, 'Rejects single quote injection');
assertEqual(sanitizeSymbol(''), null, 'Rejects empty string');
assertEqual(sanitizeSymbol(123), null, 'Rejects non-string input');

// 2. Interval Sanitization Tests
assertEqual(sanitizeInterval('1d'), '1d', 'Valid interval 1d');
assertEqual(sanitizeInterval('1h'), '1h', 'Valid interval 1h');
assertEqual(sanitizeInterval('5m'), '5m', 'Valid interval 5m');
assertEqual(sanitizeInterval('1mo'), '1mo', 'Valid interval 1mo');
assertEqual(sanitizeInterval('invalid_interval'), '1d', 'Fallback invalid interval to 1d');
assertEqual(sanitizeInterval('1d; rm -rf /'), '1d', 'Fallback malicious interval to 1d');

// 3. Workers Sanitization Tests
assertEqual(sanitizeWorkers(8), 8, 'Valid workers number 8');
assertEqual(sanitizeWorkers('16'), 16, 'Valid workers string "16"');
assertEqual(sanitizeWorkers(-5), 8, 'Negative workers fallback to 8');
assertEqual(sanitizeWorkers(0), 8, 'Zero workers fallback to 8');
assertEqual(sanitizeWorkers(100), 32, 'Upper clamp workers to 32');
assertEqual(sanitizeWorkers('invalid; echo 1'), 8, 'Nan workers string fallback to 8');

console.log('✅ All security sanitization unit tests passed successfully!');
