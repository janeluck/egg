/**
 * meta middleware, should be the first middleware
 */

'use strict';

const semver = require('semver');

module.exports = options => {
  // Node.js >=14.8.0 will set Keep-Alive Header, see https://github.com/nodejs/node/pull/34561
  const shouldPatchKeepAliveHeader = semver.lt(process.version, '14.8.0');

  return async function meta(ctx, next) {
    if (options.logging) {
      ctx.coreLogger.info('[meta] request started, host: %s, user-agent: %s', ctx.host, ctx.header['user-agent']);
    }
    await next();
    // total response time header
    ctx.set('x-readtime', Date.now() - ctx.starttime);

    // try to support Keep-Alive Header when < 14.8.0
    const server = ctx.app.server;
    if (shouldPatchKeepAliveHeader && server && server.keepAliveTimeout && server.keepAliveTimeout >= 1000 && ctx.header.connection !== 'close') {
      /**
       * use Math.floor instead of parseInt. More: https://github.com/eggjs/egg/pull/2702
       */
      const timeout = Math.floor(server.keepAliveTimeout / 1000);
      ctx.set('keep-alive', `timeout=${timeout}`);
    }
  };
};
