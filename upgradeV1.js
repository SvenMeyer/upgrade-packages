const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

async function upgradePackages() {
  // Read package.json
  const packageJson = await readFile('package.json', 'utf8');
  const { dependencies, devDependencies, ...otherProps } = JSON.parse(packageJson);

  // Make a copy of package.json
  try {
    await fs.promises.copyFile('package.json', 'package.json.bak');
  } catch (error) {
    if (error.code === 'EEXIST') {
      await fs.promises.unlink('package.json.bak');
      await fs.promises.copyFile('package.json', 'package.json.bak');
    }
  }

  // Upgrade each dependency one at a time
  for (const [name, version] of Object.entries({ ...dependencies, ...devDependencies })) {
    console.log(`Upgrading ${name}...`);

    try {
      // Run `yarn upgrade` command
      await promisify(exec)(`yarn upgrade ${name}`);

      // Get updated version
      const updatedVersion = await getCurrentVersion(name);

      // Update version in package.json
      if (dependencies[name]) {
        dependencies[name] = updatedVersion;
      } else if (devDependencies[name]) {
        devDependencies[name] = updatedVersion;
      }
      await writeFile('package.json', JSON.stringify({ dependencies, devDependencies, ...otherProps }, null, 2));

      console.log(`  Updated from ${version} to ${updatedVersion}`);
    } catch (error) {
      console.error(`  ERROR: ${error.message}`);
    }
  }
}

async function getCurrentVersion(packageName) {
  const { stdout } = await promisify(exec)(`yarn list --pattern '${packageName}' --depth=0 --json`);
  const data = JSON.parse(stdout);
  const name = data.data.trees[0].name;
  const version = name.split('@').pop();
  return version;
}

upgradePackages().catch(console.error);
