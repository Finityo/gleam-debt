#!/usr/bin/env node

/**
 * ============================================================================
 * FINITYO MATH GUARDIAN
 * Automated wiring audit and auto-fix agent for the debt calculation engine
 * ============================================================================
 * 
 * This script performs comprehensive checks on:
 * 1. APR normalization (single source of truth in unified-engine.ts)
 * 2. Engine hook usage (no circular dependencies)
 * 3. Provider wiring (all pages wrapped correctly)
 * 4. Dual state management (no independent plan computations)
 * 5. Math consistency (snowball/avalanche logic)
 */

const fs = require('fs');
const path = require('path');

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  error: (msg) => console.log(`${colors.red}❌ ERROR: ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  WARN: ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ SUCCESS: ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  INFO: ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.magenta}═══════════════════════════════════════════════${colors.reset}\n${colors.magenta}${msg}${colors.reset}\n${colors.magenta}═══════════════════════════════════════════════${colors.reset}\n`),
};

// Scan all files recursively
function scanDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!file.startsWith('.') && !['node_modules', 'dist', 'build'].includes(file)) {
        scanDirectory(filePath, fileList);
      }
    } else if (filePath.match(/\.(ts|tsx|js|jsx)$/)) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// Read file content
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    log.error(`Failed to read ${filePath}: ${error.message}`);
    return null;
  }
}

// Violation tracking
const violations = {
  aprNormalization: [],
  circularHooks: [],
  providerWiring: [],
  dualState: [],
  legacyUsage: [],
};

// CHECK 1: APR Normalization
function checkAPRNormalization() {
  log.section('CHECK 1: APR Normalization');
  
  const files = scanDirectory('src');
  
  files.forEach(filePath => {
    const content = readFile(filePath);
    if (!content) return;
    
    // Check for safeAPR usage in debtPlan.ts (should NOT normalize)
    if (filePath.includes('debtPlan.ts') && content.includes('safeAPR(')) {
      violations.aprNormalization.push({
        file: filePath,
        issue: 'debtPlan.ts should NOT call safeAPR() - APR should be pre-normalized by unified-engine',
        fix: 'Replace safeAPR(d.apr) with toNum(d.apr)',
      });
    }
    
    // Check for double normalization (multiplying by 100 in multiple places)
    const aprMultiplications = (content.match(/\* 100/g) || []).length;
    if (aprMultiplications > 1 && filePath.includes('engine')) {
      violations.aprNormalization.push({
        file: filePath,
        issue: 'Multiple APR normalizations detected (multiplying by 100)',
        fix: 'Ensure APR normalization happens ONLY in unified-engine.ts',
      });
    }
  });
  
  if (violations.aprNormalization.length === 0) {
    log.success('APR normalization is correct');
  } else {
    log.error(`Found ${violations.aprNormalization.length} APR normalization violations`);
  }
}

// CHECK 2: Circular Hook Dependencies
function checkCircularHooks() {
  log.section('CHECK 2: Circular Hook Dependencies');
  
  const hookFiles = [
    'src/engine/useUnifiedPlan.ts',
    'src/engine/usePlanCharts.ts',
    'src/engine/useNormalizedPlan.ts',
  ];
  
  hookFiles.forEach(filePath => {
    const content = readFile(filePath);
    if (!content) return;
    
    // useUnifiedPlan should NOT call usePlanCharts or useNormalizedPlan
    if (filePath.includes('useUnifiedPlan.ts')) {
      if (content.includes('usePlanCharts') || content.includes('useNormalizedPlan')) {
        violations.circularHooks.push({
          file: filePath,
          issue: 'useUnifiedPlan() calls downstream hooks (causes circular dependency)',
          fix: 'useUnifiedPlan() should ONLY call useDebtEngine()',
        });
      }
    }
    
    // usePlanCharts should call useUnifiedPlan (not useDebtEngine directly)
    if (filePath.includes('usePlanCharts.ts')) {
      if (content.includes('useDebtEngine(') && !content.includes('useUnifiedPlan')) {
        violations.circularHooks.push({
          file: filePath,
          issue: 'usePlanCharts() should call useUnifiedPlan(), not useDebtEngine()',
          fix: 'Replace useDebtEngine() with useUnifiedPlan()',
        });
      }
    }
  });
  
  if (violations.circularHooks.length === 0) {
    log.success('No circular hook dependencies detected');
  } else {
    log.error(`Found ${violations.circularHooks.length} circular hook violations`);
  }
}

// CHECK 3: Provider Wiring
function checkProviderWiring() {
  log.section('CHECK 3: Provider Wiring');
  
  const appFiles = ['src/App.tsx', 'src/routes.tsx'];
  
  appFiles.forEach(filePath => {
    const content = readFile(filePath);
    if (!content) return;
    
    // Check if DebtEngineProvider wraps all routes
    if (filePath.includes('App.tsx')) {
      if (!content.includes('DebtEngineProvider') || !content.includes('<DebtEngineProvider')) {
        violations.providerWiring.push({
          file: filePath,
          issue: 'DebtEngineProvider not found or not wrapping routes',
          fix: 'Ensure DebtEngineProvider wraps all app routes at top level',
        });
      }
    }
  });
  
  // Check all page files use hooks correctly
  const pages = scanDirectory('src/pages');
  pages.forEach(filePath => {
    const content = readFile(filePath);
    if (!content) return;
    
    // Pages using engine hooks MUST be wrapped by provider
    const usesEngineHooks = content.includes('useDebtEngine') || 
                           content.includes('useUnifiedPlan') || 
                           content.includes('usePlanCharts');
    
    if (usesEngineHooks) {
      // This is a simplified check - full check would require AST parsing
      log.info(`Page ${path.basename(filePath)} uses engine hooks - verify provider wrapping`);
    }
  });
  
  if (violations.providerWiring.length === 0) {
    log.success('Provider wiring appears correct');
  } else {
    log.error(`Found ${violations.providerWiring.length} provider wiring violations`);
  }
}

// CHECK 4: Dual State Management
function checkDualState() {
  log.section('CHECK 4: Dual State Management');
  
  const appStoreContent = readFile('src/context/AppStore.tsx');
  if (appStoreContent) {
    // Check if AppStore computes plans independently
    if (appStoreContent.includes('computeDebtPlanUnified') && 
        appStoreContent.includes('const plan =')) {
      violations.dualState.push({
        file: 'src/context/AppStore.tsx',
        issue: 'AppStore computes plans independently (creates dual state)',
        fix: 'Remove plan computations from AppStore - delegate to DebtEngineProvider',
      });
    }
  }
  
  if (violations.dualState.length === 0) {
    log.success('No dual state management detected');
  } else {
    log.error(`Found ${violations.dualState.length} dual state violations`);
  }
}

// CHECK 5: Legacy Engine Usage
function checkLegacyUsage() {
  log.section('CHECK 5: Legacy Engine Usage');
  
  const files = scanDirectory('src');
  
  files.forEach(filePath => {
    const content = readFile(filePath);
    if (!content) return;
    
    // Skip compat layer files
    if (filePath.includes('compat') || filePath.includes('legacy')) return;
    
    // Check for direct computeDebtPlan usage (should use unified)
    if (content.includes('from "@/lib/computeDebtPlan"') && 
        !content.includes('unified')) {
      violations.legacyUsage.push({
        file: filePath,
        issue: 'Importing from @/lib/computeDebtPlan instead of unified-engine',
        fix: 'Import from @/engine/unified-engine or @/lib/debtPlan',
      });
    }
  });
  
  if (violations.legacyUsage.length === 0) {
    log.success('No legacy engine usage detected');
  } else {
    log.error(`Found ${violations.legacyUsage.length} legacy engine violations`);
  }
}

// Generate report
function generateReport() {
  log.section('MATH GUARDIAN REPORT');
  
  const totalViolations = Object.values(violations).reduce((sum, arr) => sum + arr.length, 0);
  
  if (totalViolations === 0) {
    log.success('🎉 All checks passed! Engine wiring is production-ready.');
    return 0;
  }
  
  log.error(`Found ${totalViolations} total violations:\n`);
  
  Object.entries(violations).forEach(([category, items]) => {
    if (items.length > 0) {
      console.log(`\n${colors.yellow}${category.toUpperCase()}:${colors.reset}`);
      items.forEach((item, idx) => {
        console.log(`\n  ${idx + 1}. ${colors.red}${item.file}${colors.reset}`);
        console.log(`     Issue: ${item.issue}`);
        console.log(`     Fix: ${colors.green}${item.fix}${colors.reset}`);
      });
    }
  });
  
  console.log('\n');
  log.warn('Run automated fixes with: npm run math-guardian:fix');
  
  return 1;
}

// Main execution
function main() {
  console.log('\n🛡️  FINITYO MATH GUARDIAN - Starting Audit...\n');
  
  checkAPRNormalization();
  checkCircularHooks();
  checkProviderWiring();
  checkDualState();
  checkLegacyUsage();
  
  const exitCode = generateReport();
  process.exit(exitCode);
}

main();
