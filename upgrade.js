/**
 * upgrades all packages in package.json
 * writes new version to package.json
 * will format package.json if module 'prettier-package-json' is globally installed
 * (`$ yarn global add prettier-package-json`)
 * 
 * authors : GPT-4 , Sven Meyer
 */

const { exec } = require('child_process');
const { execSync } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

async function getCurrentVersionInstalled(packageName) {
  const { stdout } = await promisify(exec)(`yarn list --pattern '${packageName}' --depth=0 --json`);
  const data = JSON.parse(stdout);
  const name = data.data.trees[0].name;
  const version = name.split('@').pop();
  return version;
}

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
    process.stdout.write(`Upgrading ${name}...`);

    // Get current version from package.json
    const currentVersionJson = dependencies[name] || devDependencies[name];
    process.stdout.write(` ${currentVersionJson} -> `);

    // Get currently installed version
    const currentVersionInstalled = await getCurrentVersionInstalled(name);
    process.stdout.write(`${currentVersionInstalled}...`);

    try {
      // Run `yarn upgrade` command
      await promisify(exec)(`yarn upgrade ${name}`);

      // Get installed version
      const newVersionInstalled = await getCurrentVersionInstalled(name);
      console.log(` ${newVersionInstalled}`);

      // Update version in package.json
      if (dependencies[name]) {
        dependencies[name] = newVersionInstalled;
      } else if (devDependencies[name]) {
        devDependencies[name] = newVersionInstalled;
      }
      await writeFile('package.json', JSON.stringify({ dependencies, devDependencies, ...otherProps }, null, 2));
    } catch (error) {
      console.error(`\n  ERROR: ${error.message}`);
    }
  }

  console.log("Formatting package.json with prettier-package-json, which must be installed (globally)");

  // Run prettier-package-json to format the file
  execSync('prettier-package-json --write package.json');

}

upgradePackages().catch(console.error);
