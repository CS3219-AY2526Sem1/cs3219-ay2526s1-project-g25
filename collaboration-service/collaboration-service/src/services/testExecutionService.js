import { judge0Run } from './judge0Provider.js';

/**
 * Enhanced test case execution service for Kattis-style stdin/stdout testing
 * Supports multiple test cases with proper input/output validation
 */

export class TestExecutionService {
  constructor() {
    this.supportedLanguages = {
      'python': 71,      // Python 3.8.1
      'javascript': 63,  // JavaScript (Node.js 12.14.0)
      'typescript': 74,  // TypeScript 3.7.4
      'java': 62,        // Java (OpenJDK 13.0.1)
      'cpp': 52,         // C++ (GCC 7.4.0)
      'c': 48,           // C (GCC 7.4.0)
      'csharp': 51,      // C# (Mono 6.6.0.161)
      'go': 60,          // Go 1.13.5
      'rust': 73,        // Rust 1.40.0
      'php': 68,         // PHP 7.4.1
      'ruby': 72,        // Ruby 2.7.0
      'swift': 83,       // Swift 5.2.3
      'kotlin': 78,      // Kotlin 1.3.70
      'scala': 81,       // Scala 2.13.2
      'perl': 85,        // Perl 5.28.1
      'r': 80,           // R 4.0.0
      'dart': 84,        // Dart 2.7.2
      'lua': 64,         // Lua 5.3.5
      'haskell': 61,     // Haskell (GHC 8.8.1)
      'clojure': 86,     // Clojure 1.10.1
      'elixir': 57,      // Elixir 1.9.4
      'erlang': 58,      // Erlang (OTP 22.2)
      'julia': 82,       // Julia 1.0.5
      'ocaml': 65,       // OCaml 4.09.0
      'fsharp': 87,      // F# 4.7
      'vbnet': 88,       // VB.NET 4.0.1
      'assembly': 45,    // Assembly (NASM 2.14.02)
      'bash': 46,        // Bash 5.0.0
      'basic': 47,       // Basic (FBC 1.07.1)
      'fortran': 59,     // Fortran (GFortran 9.2.0)
      'pascal': 67,      // Pascal (FPC 3.0.4)
      'prolog': 69,      // Prolog (GNU Prolog 1.4.5)
      'sql': 89,         // SQL (SQLite 3.27.2)
    };
  }

  /**
   * Execute code against all test cases
   * @param {string} code - User's code
   * @param {string} language - Programming language
   * @param {Array} testCases - Array of test cases with input/output
   * @param {Object} options - Execution options
   * @returns {Object} Execution results
   */
  async executeTestCases(code, language, testCases, options = {}) {
    const {
      timeoutMs = 5000,
      memoryLimit = 128000, // 128MB
      maxOutputLength = 10000
    } = options;

    if (!this.supportedLanguages[language]) {
      throw new Error(`Unsupported language: ${language}`);
    }

    if (!Array.isArray(testCases) || testCases.length === 0) {
      throw new Error('No test cases provided');
    }

    const results = {
      totalTests: testCases.length,
      passedTests: 0,
      failedTests: 0,
      testResults: [],
      executionTime: 0,
      language,
      timestamp: Date.now()
    };

    const startTime = Date.now();

    // Execute each test case
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const testResult = await this.executeSingleTestCase(
        code, 
        language, 
        testCase, 
        i + 1,
        { timeoutMs, memoryLimit, maxOutputLength }
      );
      
      results.testResults.push(testResult);
      
      if (testResult.status === 'passed') {
        results.passedTests++;
      } else {
        results.failedTests++;
      }
    }

    results.executionTime = Date.now() - startTime;
    return results;
  }

  /**
   * Execute code against a single test case
   * @param {string} code - User's code
   * @param {string} language - Programming language
   * @param {Object} testCase - Single test case
   * @param {number} testNumber - Test case number
   * @param {Object} options - Execution options
   * @returns {Object} Test result
   */
  async executeSingleTestCase(code, language, testCase, testNumber, options = {}) {
    const { timeoutMs, memoryLimit, maxOutputLength } = options;
    
    try {
      // Prepare input for stdin
      const stdin = this.prepareStdin(testCase.input);
      
      // Execute code with Judge0
      const execution = await judge0Run({
        code,
        language,
        stdin,
        timeoutMs
      });

      // Process the result
      const result = this.processExecutionResult(execution, testCase, testNumber, {
        maxOutputLength
      });

      return result;

    } catch (error) {
      return {
        testNumber,
        status: 'error',
        input: testCase.input,
        expectedOutput: testCase.output || testCase.expected,
        actualOutput: '',
        error: error.message,
        executionTime: 0,
        memory: 0,
        verdict: 'Execution Error'
      };
    }
  }

  /**
   * Prepare stdin input from test case
   * @param {string|Array} input - Test case input
   * @returns {string} Formatted stdin input
   */
  prepareStdin(input) {
    if (Array.isArray(input)) {
      return input.join('\n');
    }
    return String(input || '');
  }

  /**
   * Process Judge0 execution result and compare with expected output
   * @param {Object} execution - Judge0 execution result
   * @param {Object} testCase - Original test case
   * @param {number} testNumber - Test case number
   * @param {Object} options - Processing options
   * @returns {Object} Processed test result
   */
  processExecutionResult(execution, testCase, testNumber, options = {}) {
    const { maxOutputLength } = options;
    const expectedOutput = testCase.output || testCase.expected || '';
    
    // Normalize outputs for comparison
    const actualOutput = this.normalizeOutput(execution.stdout || '');
    const normalizedExpected = this.normalizeOutput(expectedOutput);
    
    // Determine test status
    let status = 'failed';
    let verdict = 'Wrong Answer';
    
    if (execution.status === 'error') {
      if (execution.stderr) {
        status = 'error';
        verdict = 'Runtime Error';
      } else {
        status = 'error';
        verdict = 'Compilation Error';
      }
    } else if (execution.status === 'timeout') {
      status = 'error';
      verdict = 'Time Limit Exceeded';
    } else if (execution.status === 'finished') {
      if (actualOutput === normalizedExpected) {
        status = 'passed';
        verdict = 'Accepted';
      } else {
        status = 'failed';
        verdict = 'Wrong Answer';
      }
    }

    return {
      testNumber,
      status,
      input: testCase.input,
      expectedOutput: expectedOutput,
      actualOutput: actualOutput.length > maxOutputLength 
        ? actualOutput.substring(0, maxOutputLength) + '...' 
        : actualOutput,
      error: execution.stderr || '',
      executionTime: execution.time || 0,
      memory: execution.memory || 0,
      verdict,
      exitCode: execution.exitCode,
      meta: execution.meta
    };
  }

  /**
   * Normalize output for comparison (trim whitespace, handle line endings)
   * @param {string} output - Raw output
   * @returns {string} Normalized output
   */
  normalizeOutput(output) {
    if (typeof output !== 'string') {
      return '';
    }
    
    return output
      .trim()                    // Remove leading/trailing whitespace
      .replace(/\r\n/g, '\n')    // Normalize line endings
      .replace(/\r/g, '\n')      // Handle old Mac line endings
      .split('\n')               // Split into lines
      .map(line => line.trim())  // Trim each line
      .filter(line => line !== '') // Remove empty lines
      .join('\n');               // Join back with newlines
  }

  /**
   * Get supported languages
   * @returns {Array} List of supported languages
   */
  getSupportedLanguages() {
    return Object.keys(this.supportedLanguages);
  }

  /**
   * Validate test case format
   * @param {Object} testCase - Test case to validate
   * @returns {Object} Validation result
   */
  validateTestCase(testCase) {
    const errors = [];
    
    if (!testCase) {
      errors.push('Test case is required');
      return { valid: false, errors };
    }
    
    if (testCase.input === undefined && testCase.input === null) {
      errors.push('Test case input is required');
    }
    
    if (testCase.output === undefined && testCase.expected === undefined) {
      errors.push('Test case output or expected is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

}

// Export singleton instance
export const testExecutionService = new TestExecutionService();
