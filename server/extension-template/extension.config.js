const os   = require('os');
const path = require('path');

const home = os.homedir();

module.exports = {
  browser: {
    chrome: {
      browserFlags: [
        //`--load-extension=${path.join(home, 'ex10-companion-extension')}`, // dont use this it overwrites the default extension paths
        `--user-data-dir=${path.join(home, 'chrome-profile')}`,
      ],
    },
  },
};