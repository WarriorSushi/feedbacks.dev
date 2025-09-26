#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI colors for better output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.blue) {
  console.log(`${color}${message}${colors.reset}`);
}

class VersionManager {
  constructor() {
    this.packagePath = path.join(__dirname, 'package.json');
    this.packageJson = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
    this.currentVersion = this.packageJson.version;
  }

  // Parse semantic version
  parseVersion(version) {
    const parts = version.split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0
    };
  }

  // Create new version based on bump type
  bumpVersion(type) {
    const current = this.parseVersion(this.currentVersion);
    let newVersion;

    switch (type) {
      case 'major':
        newVersion = `${current.major + 1}.0.0`;
        break;
      case 'minor':
        newVersion = `${current.major}.${current.minor + 1}.0`;
        break;
      case 'patch':
        newVersion = `${current.major}.${current.minor}.${current.patch + 1}`;
        break;
      default:
        throw new Error(`Invalid version type: ${type}. Use 'major', 'minor', or 'patch'.`);
    }

    return newVersion;
  }

  // Update package.json with new version
  updatePackageVersion(newVersion) {
    this.packageJson.version = newVersion;
    fs.writeFileSync(this.packagePath, JSON.stringify(this.packageJson, null, 2) + '\n');
    log(`${colors.green}✅ Updated package.json: ${this.currentVersion} → ${newVersion}${colors.reset}`);
    this.currentVersion = newVersion;
  }

  // Update dashboard references to use new version
  updateDashboardVersion(version) {
    try {
      // Update widget installation component
      const installationPath = path.join(__dirname, '../dashboard/src/components/widget-installation/widget-installation.tsx');

      if (fs.existsSync(installationPath)) {
        let content = fs.readFileSync(installationPath, 'utf8');

        // Update DEFAULT_WIDGET_VERSION constant
        const oldPattern = /const DEFAULT_WIDGET_VERSION = '[^']+'/;
        const newValue = `const DEFAULT_WIDGET_VERSION = '${version}'`;

        if (content.match(oldPattern)) {
          content = content.replace(oldPattern, newValue);
          fs.writeFileSync(installationPath, content);
          log(`${colors.green}✅ Updated dashboard default version to ${version}${colors.reset}`);
        } else {
          log(`${colors.yellow}⚠️  Could not find DEFAULT_WIDGET_VERSION in dashboard${colors.reset}`);
        }
      }
    } catch (error) {
      log(`${colors.red}❌ Error updating dashboard: ${error.message}${colors.reset}`);
    }
  }

  // Get version aliases that should be created
  getVersionAliases(version) {
    const parsed = this.parseVersion(version);
    return [
      {
        alias: version,
        description: 'Exact version (locked forever)'
      },
      {
        alias: `${parsed.major}.${parsed.minor}`,
        description: 'Minor version (gets patch updates)'
      },
      {
        alias: `${parsed.major}`,
        description: 'Major version (gets feature & patch updates)'
      },
      {
        alias: 'latest',
        description: 'Always newest (cutting edge)'
      }
    ];
  }

  // Show current version info
  showVersionInfo() {
    log(`${colors.bold}📦 Current Widget Version Info${colors.reset}`);
    log(`Current version: ${colors.green}${this.currentVersion}${colors.reset}`);

    const aliases = this.getVersionAliases(this.currentVersion);
    log('\nVersion aliases that will be created:');
    aliases.forEach(alias => {
      log(`  ${colors.blue}${alias.alias}${colors.reset} - ${alias.description}`);
    });

    // Show what files would be created
    log('\nCDN files that will be available:');
    aliases.forEach(alias => {
      log(`  https://app.feedbacks.dev/cdn/widget/${alias.alias}.js`);
      log(`  https://app.feedbacks.dev/cdn/widget/${alias.alias}.css`);
    });
  }

  // Preview what would happen with a version bump
  previewBump(type) {
    const newVersion = this.bumpVersion(type);
    const aliases = this.getVersionAliases(newVersion);

    log(`${colors.bold}📋 Preview ${type.toUpperCase()} version bump${colors.reset}`);
    log(`${this.currentVersion} → ${colors.green}${newVersion}${colors.reset}`);

    log('\nFiles that would be created:');
    aliases.forEach(alias => {
      log(`  ${colors.blue}${alias.alias}.js/css${colors.reset} - ${alias.description}`);
    });

    log(`\n${colors.yellow}This is a preview only. No changes made.${colors.reset}`);
  }

  // Execute a version bump
  executeBump(type, options = {}) {
    const { dryRun = false, skipGit = false } = options;
    const newVersion = this.bumpVersion(type);

    if (dryRun) {
      this.previewBump(type);
      return;
    }

    log(`${colors.bold}🚀 Executing ${type.toUpperCase()} version bump${colors.reset}`);
    log(`${this.currentVersion} → ${colors.green}${newVersion}${colors.reset}`);

    // Update package.json
    this.updatePackageVersion(newVersion);

    // Update dashboard references
    this.updateDashboardVersion(newVersion);

    // Create git tag if not skipping git
    if (!skipGit) {
      try {
        execSync(`git tag v${newVersion}`, { stdio: 'pipe' });
        log(`${colors.green}✅ Created git tag v${newVersion}${colors.reset}`);
      } catch (error) {
        log(`${colors.yellow}⚠️  Could not create git tag: ${error.message}${colors.reset}`);
      }
    }

    log(`${colors.green}${colors.bold}🎉 Version bump complete!${colors.reset}`);
    log(`\nNext steps:`);
    log(`1. Run: ${colors.blue}node auto-build.js${colors.reset} (or it will run automatically on git push)`);
    log(`2. Test the new version locally`);
    log(`3. Commit and push when ready`);

    return newVersion;
  }

  // List all available versions
  listVersions() {
    try {
      const cdnDir = path.join(__dirname, '../dashboard/public/cdn/widget');
      if (!fs.existsSync(cdnDir)) {
        log(`${colors.yellow}⚠️  CDN directory not found: ${cdnDir}${colors.reset}`);
        return;
      }

      const files = fs.readdirSync(cdnDir)
        .filter(file => file.endsWith('.js'))
        .map(file => file.replace('.js', ''))
        .sort();

      log(`${colors.bold}📋 Available Widget Versions${colors.reset}`);
      files.forEach(version => {
        const isExact = /^\d+\.\d+\.\d+$/.test(version);
        const isMinor = /^\d+\.\d+$/.test(version);
        const isMajor = /^\d+$/.test(version);

        let type = '';
        if (version === 'latest') type = '(cutting edge)';
        else if (isExact) type = '(exact/locked)';
        else if (isMinor) type = '(minor alias)';
        else if (isMajor) type = '(major alias)';

        log(`  ${colors.blue}${version}${colors.reset} ${type}`);
      });
    } catch (error) {
      log(`${colors.red}❌ Error listing versions: ${error.message}${colors.reset}`);
    }
  }
}

// CLI interface
function showHelp() {
  console.log(`
${colors.bold}📦 Widget Version Manager${colors.reset}

Usage: node version-manager.js <command> [options]

Commands:
  ${colors.blue}info${colors.reset}                    Show current version information
  ${colors.blue}list${colors.reset}                    List all available versions
  ${colors.blue}preview <type>${colors.reset}          Preview version bump (major|minor|patch)
  ${colors.blue}bump <type>${colors.reset}             Execute version bump (major|minor|patch)
  ${colors.blue}help${colors.reset}                    Show this help message

Examples:
  ${colors.blue}node version-manager.js info${colors.reset}
  ${colors.blue}node version-manager.js preview minor${colors.reset}
  ${colors.blue}node version-manager.js bump patch${colors.reset}
  ${colors.blue}node version-manager.js list${colors.reset}

Version Types:
  ${colors.yellow}patch${colors.reset}  - Bug fixes, small improvements (1.0.0 → 1.0.1)
  ${colors.yellow}minor${colors.reset}  - New features, backward compatible (1.0.0 → 1.1.0)
  ${colors.yellow}major${colors.reset}  - Breaking changes (1.0.0 → 2.0.0)
`);
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const type = args[1];

  const versionManager = new VersionManager();

  switch (command) {
    case 'info':
      versionManager.showVersionInfo();
      break;

    case 'list':
      versionManager.listVersions();
      break;

    case 'preview':
      if (!type || !['major', 'minor', 'patch'].includes(type)) {
        log(`${colors.red}❌ Please specify version type: major, minor, or patch${colors.reset}`);
        process.exit(1);
      }
      versionManager.previewBump(type);
      break;

    case 'bump':
      if (!type || !['major', 'minor', 'patch'].includes(type)) {
        log(`${colors.red}❌ Please specify version type: major, minor, or patch${colors.reset}`);
        process.exit(1);
      }
      versionManager.executeBump(type, {
        dryRun: args.includes('--dry-run'),
        skipGit: args.includes('--skip-git')
      });
      break;

    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;

    default:
      if (!command) {
        versionManager.showVersionInfo();
      } else {
        log(`${colors.red}❌ Unknown command: ${command}${colors.reset}`);
        showHelp();
        process.exit(1);
      }
  }
}

module.exports = VersionManager;