# upgrade-packages

- make a backup of `package.json` into `package.json.bak` (overwrite if it already exists)
- upgrade all packages in package.json one by one
- after successful upgrade of each package write new version to package.json
- finally, format package.json if module `prettier-package-json` is (globally) installed

## Install

Install `prettier-package-json` globally :

`$ yarn global add prettier-package-json`

copy `upgrade.js` into the directory where `package.json` is

## Run

`$ node upgrade.js`