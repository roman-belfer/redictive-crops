const config = {
  apiUrl: import.meta.env.MODE === 'production'
    ? 'https://predictive-crops-production.up.railway.app'
    : 'http://localhost:3002'
};

console.log('🔧 Config loaded:', {
  mode: import.meta.env.MODE,
  apiUrl: config.apiUrl,
  isProd: import.meta.env.PROD
});

export default config;
