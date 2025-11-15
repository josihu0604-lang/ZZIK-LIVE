module.exports = {
  rules: {
    'no-raw-geo-logs': {
      meta: { 
        type: 'problem',
        docs: {
          description: 'Prevent logging of raw latitude/longitude coordinates',
          category: 'Security',
          recommended: true
        },
        messages: {
          noRawGeoLogs: 'Logging raw lat/lng coordinates is forbidden. Use geohash (5-6 chars) only for privacy.'
        }
      },
      create(context) {
        // Pattern to match coordinate-related keys
        const coordinatePattern = /(latitude|longitude|\blat\b|\blng\b|\bcoords?\b)/i;
        
        return {
          CallExpression(node) {
            const callee = node.callee;
            
            // Check console.* methods
            if (
              callee.type === 'MemberExpression' &&
              callee.object.name === 'console' &&
              ['log', 'info', 'warn', 'error', 'debug', 'trace'].includes(callee.property.name)
            ) {
              const sourceCode = context.getSourceCode();
              const nodeText = sourceCode.getText(node);
              
              if (coordinatePattern.test(nodeText)) {
                context.report({ 
                  node, 
                  messageId: 'noRawGeoLogs'
                });
              }
            }
            
            // Check common logger patterns
            if (
              callee.type === 'MemberExpression' &&
              ['logger', 'log', 'winston', 'bunyan', 'pino'].includes(callee.object.name) &&
              ['log', 'info', 'warn', 'error', 'debug', 'trace'].includes(callee.property.name)
            ) {
              const sourceCode = context.getSourceCode();
              const nodeText = sourceCode.getText(node);
              
              if (coordinatePattern.test(nodeText)) {
                context.report({ 
                  node, 
                  messageId: 'noRawGeoLogs'
                });
              }
            }
          }
        };
      }
    },
    
    'no-pii-logs': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent logging of PII (Personally Identifiable Information)',
          category: 'Security',
          recommended: true
        },
        messages: {
          noPiiLogs: 'Logging PII data ({{piiType}}) is forbidden. Sanitize or redact sensitive information.'
        }
      },
      create(context) {
        // Pattern to match PII-related keys
        const piiPatterns = {
          email: /\bemail\b/i,
          phone: /\bphone\b/i,
          ssn: /\bssn\b|\bsocial.?security/i,
          password: /\bpassword\b|\bpasswd\b|\bpwd\b/i,
          creditCard: /\bcredit.?card\b|\bcard.?number\b/i
        };
        
        return {
          CallExpression(node) {
            const callee = node.callee;
            
            // Check console.* and logger.* methods
            if (
              callee.type === 'MemberExpression' &&
              (callee.object.name === 'console' || 
               ['logger', 'log', 'winston', 'bunyan', 'pino'].includes(callee.object.name)) &&
              ['log', 'info', 'warn', 'error', 'debug', 'trace'].includes(callee.property.name)
            ) {
              const sourceCode = context.getSourceCode();
              const nodeText = sourceCode.getText(node);
              
              for (const [piiType, pattern] of Object.entries(piiPatterns)) {
                if (pattern.test(nodeText)) {
                  context.report({ 
                    node, 
                    messageId: 'noPiiLogs',
                    data: { piiType }
                  });
                  break; // Report only first match
                }
              }
            }
          }
        };
      }
    }
  }
};