#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const WIDGET_DIR = __dirname;
const DASHBOARD_CDN_DIR = path.join(__dirname, '../dashboard/public/cdn/widget');
const PACKAGE_JSON_PATH = path.join(WIDGET_DIR, 'package.json');

// ANSI colors for better logging
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

function error(message) {
  console.log(`${colors.red}❌ ERROR: ${message}${colors.reset}`);
}

function success(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function warning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

class AutoBuilder {
  constructor() {
    this.packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    this.currentVersion = this.packageJson.version;
  }

  // Detect what type of version bump is needed based on git commits
  detectVersionBumpType() {
    try {
      // Get commit messages since last tag (or all if no tags)
      let gitCommand = 'git log --oneline --no-merges';
      try {
        // Try to get commits since last tag
        execSync('git describe --tags --abbrev=0', { stdio: 'pipe' });
        gitCommand = 'git log $(git describe --tags --abbrev=0)..HEAD --oneline --no-merges';
      } catch {
        // No tags exist yet, get last 10 commits
        gitCommand = 'git log --oneline --no-merges -n 10';
      }

      const commits = execSync(gitCommand, { encoding: 'utf8' }).trim();

      if (!commits) {
        log('No new commits found, skipping version bump');
        return null;
      }

      log(`Analyzing commits:\n${commits}`);

      // Analyze commit messages for conventional commit patterns
      const commitLines = commits.split('\n');
      let hasMajor = false;
      let hasMinor = false;
      let hasPatch = false;

      for (const commit of commitLines) {
        const message = commit.toLowerCase();

        // Major version indicators (breaking changes)
        if (message.includes('breaking') || message.includes('!:') || message.match(/^[a-f0-9]+\s+[a-z]+!:/)) {
          hasMajor = true;
        }
        // Minor version indicators (new features)
        else if (message.includes('feat:') || message.includes('feature:') || message.includes('add ')) {
          hasMinor = true;
        }
        // Patch version indicators (bug fixes, improvements)
        else if (message.includes('fix:') || message.includes('bug') || message.includes('patch') || message.includes('update')) {
          hasPatch = true;
        }
      }

      if (hasMajor) return 'major';
      if (hasMinor) return 'minor';
      if (hasPatch) return 'patch';

      // Default to patch for any other changes
      return 'patch';
    } catch (err) {
      warning(`Could not analyze git commits: ${err.message}`);
      return 'patch'; // Default to patch version
    }
  }

  // Bump version in package.json
  bumpVersion(type) {
    const [major, minor, patch] = this.currentVersion.split('.').map(Number);
    let newVersion;

    switch (type) {
      case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
      case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case 'patch':
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
      default:
        throw new Error(`Invalid version type: ${type}`);
    }

    // Update package.json
    this.packageJson.version = newVersion;
    fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(this.packageJson, null, 2) + '\n');

    success(`Version bumped: ${this.currentVersion} → ${newVersion}`);
    this.currentVersion = newVersion;
    return newVersion;
  }

  // Build the widget
  buildWidget() {
    log('Building widget...');
    try {
      execSync('npm run build', { cwd: WIDGET_DIR, stdio: 'inherit' });
      success('Widget built successfully');
    } catch (err) {
      error(`Build failed: ${err.message}`);
      process.exit(1);
    }
  }

  // Copy files to dashboard and create version aliases
  deployFiles() {
    const version = this.currentVersion;
    const [major, minor] = version.split('.');

    const sourceJs = path.join(WIDGET_DIR, 'dist', `widget-${version}.js`);
    const sourceCss = path.join(WIDGET_DIR, 'dist', `widget-${version}.css`);

    // Ensure source files exist
    if (!fs.existsSync(sourceJs)) {
      error(`Source file not found: ${sourceJs}`);
      return false;
    }
    if (!fs.existsSync(sourceCss)) {
      error(`Source file not found: ${sourceCss}`);
      return false;
    }

    // Ensure destination directory exists
    if (!fs.existsSync(DASHBOARD_CDN_DIR)) {
      fs.mkdirSync(DASHBOARD_CDN_DIR, { recursive: true });
    }

    log(`Deploying files to CDN directory...`);

    // Copy files with different version aliases
    const aliases = [
      { name: `${version}`, desc: 'Exact version (locked)' },
      { name: `${major}.${minor}`, desc: 'Minor version (gets patches)' },
      { name: `${major}`, desc: 'Major version (gets features & patches)' },
      { name: 'latest', desc: 'Always newest (cutting edge)' }
    ];

    for (const alias of aliases) {
      const destJs = path.join(DASHBOARD_CDN_DIR, `${alias.name}.js`);
      const destCss = path.join(DASHBOARD_CDN_DIR, `${alias.name}.css`);

      fs.copyFileSync(sourceJs, destJs);
      fs.copyFileSync(sourceCss, destCss);

      log(`  ✓ ${alias.name}.js/css - ${alias.desc}`);
    }

    success('All files deployed successfully');
    return true;
  }

  // Update dashboard version references
  updateDashboardReferences() {
    const version = this.currentVersion;

    try {
      // Update widget installation component
      const installationPath = path.join(__dirname, '../dashboard/src/components/widget-installation/widget-installation.tsx');
      if (fs.existsSync(installationPath)) {
        let content = fs.readFileSync(installationPath, 'utf8');

        // Update DEFAULT_WIDGET_VERSION constant
        content = content.replace(
          /const DEFAULT_WIDGET_VERSION = '[^']+'/,
          `const DEFAULT_WIDGET_VERSION = '${version}'`
        );

        fs.writeFileSync(installationPath, content);
        success(`Updated dashboard to use version ${version}`);
      }
    } catch (err) {
      warning(`Could not update dashboard references: ${err.message}`);
    }
  }

  // Create git commit for version bump
  commitVersionBump() {
    const version = this.currentVersion;

    try {
      // Add the changed files
      execSync('git add package.json', { cwd: WIDGET_DIR });
      execSync('git add ../dashboard/src/components/widget-installation/widget-installation.tsx', { cwd: WIDGET_DIR });
      execSync('git add ../dashboard/public/cdn/widget/', { cwd: WIDGET_DIR });

      // Commit the version bump
      execSync(`git commit -m "chore: release widget v${version}"`, { cwd: WIDGET_DIR });

      success(`Committed version bump v${version}`);
    } catch (err) {
      warning(`Could not commit version bump: ${err.message}`);
    }
  }

  // Main execution function
  run(options = {}) {
    const { skipVersionBump = false, skipBuild = false, skipDeploy = false, versionType = null } = options;

    log(`${colors.bold}🚀 Auto-build starting...${colors.reset}`);
    log(`Current version: ${this.currentVersion}`);

    let newVersion = this.currentVersion;

    // Step 1: Version bump (if not skipped)
    if (!skipVersionBump) {
      const bumpType = versionType || this.detectVersionBumpType();
      if (bumpType) {
        newVersion = this.bumpVersion(bumpType);
      } else {
        log('No version bump needed');
      }
    }

    // Step 2: Build widget (if not skipped)
    if (!skipBuild) {
      this.buildWidget();
    }

    // Step 3: Deploy files (if not skipped)
    if (!skipDeploy) {
      if (this.deployFiles()) {
        this.updateDashboardReferences();

        // Commit changes if this was automated
        if (!skipVersionBump && process.argv.includes('--auto-commit')) {
          this.commitVersionBump();
        }
      }
    }

    success(`${colors.bold}🎉 Auto-build complete! Widget v${newVersion} ready.${colors.reset}`);
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const autoBuilder = new AutoBuilder();

  // Parse command line arguments
  const options = {
    skipVersionBump: args.includes('--skip-version'),
    skipBuild: args.includes('--skip-build'),
    skipDeploy: args.includes('--skip-deploy'),
    versionType: args.find(arg => ['patch', 'minor', 'major'].includes(arg)) || null
  };

  autoBuilder.run(options);
}

module.exports = AutoBuilder;