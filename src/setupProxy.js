// Dev only: forward /api/* from the React dev server (:3000) to wrangler pages dev (:8788).
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use('/api', createProxyMiddleware({ target: 'http://localhost:8788', changeOrigin: true }));
};
