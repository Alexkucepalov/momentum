const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const sharedSrc = path.join(workspaceRoot, 'src');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [sharedSrc];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// NodeNext-style ".js" specifiers in shared src → resolve to .ts for Metro.
const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith('.js')) {
    const asTs = moduleName.replace(/\.js$/, '');
    try {
      return context.resolveRequest(context, asTs, platform);
    } catch {
      // fall through
    }
  }
  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
