const fs = require('fs');
const path = require('path');

const webpackConfigPath = path.resolve(__dirname, '../node_modules/react-scripts/config/webpack.config.js');

if (fs.existsSync(webpackConfigPath)) {
  let content = fs.readFileSync(webpackConfigPath, 'utf8');
  if (!content.includes('sideEffects: isEnvProduction ? true : false')) {
    content = content.replace(
      'minimize: isEnvProduction,',
      'minimize: isEnvProduction,\n      sideEffects: isEnvProduction ? true : false,'
    );
    fs.writeFileSync(webpackConfigPath, content, 'utf8');
    console.log('[patch-webpack] Successfully patched react-scripts webpack.config.js for Chakra UI dev mode');
  } else {
    console.log('[patch-webpack] react-scripts webpack.config.js is already patched');
  }
}
