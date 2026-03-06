#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = join(__dirname, 'dist');

function fixImportsInFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  
  // Fix import statements that don't have .js extension
  content = content.replace(
    /from\s+["'](\.+\/[^"']+)["']/g,
    (match, importPath) => {
      // Don't modify if already has extension or is node module
      if (importPath.endsWith('.js') || importPath.startsWith('http') || !importPath.startsWith('.')) {
        return match;
      }
      
      // Check if the path refers to a directory (needs /index.js)
      const basePath = join(dirname(filePath), importPath + '.js');
      const indexBasePath = join(dirname(filePath), importPath, 'index.js');
      
      if (existsSync(basePath)) {
        return `from "${importPath}.js"`;
      } else if (existsSync(indexBasePath)) {
        return `from "${importPath}/index.js"`;
      } else {
        // Default to .js extension
        return `from "${importPath}.js"`;
      }
    }
  );
  
  writeFileSync(filePath, content);
}

function processDirectory(dir) {
  const files = readdirSync(dir);
  
  for (const file of files) {
    const filePath = join(dir, file);
    const stats = statSync(filePath);
    
    if (stats.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.js')) {
      fixImportsInFile(filePath);
    }
  }
}

// Fix shebang and imports
const indexPath = join(distDir, 'index.js');
let indexContent = readFileSync(indexPath, 'utf-8');

// Fix shebang from bun to node
indexContent = indexContent.replace(/^#!\/usr\/bin\/env bun/, '#!/usr/bin/env node');

writeFileSync(indexPath, indexContent);

// Fix all imports
processDirectory(distDir);

console.log('Fixed imports in dist directory');