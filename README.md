# upgrade-packages

- upgrades all packages in package.json
- writes new version to package.json
- will format package.json if module `prettier-package-json` is (globally) installed

## Install
Install `prettier-package-json` globally :

`$ yarn global add prettier-package-json`

copy `upgrade.js` into the directory where `package.json` is

## Run
`$ node upgrade.js`