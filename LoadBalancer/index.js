// https://github.com/chimurai/http-proxy-middleware/blob/master/recipes/router.md


const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express()

const wsProxy = createProxyMiddleware({ target: 'http://localhost:3000', changeOrigin: true });
app.use(wsProxy);

const server = app.listen(3030);
server.on('upgrade', wsProxy.upgrade); // <-- subscribe to http 'upgrade'