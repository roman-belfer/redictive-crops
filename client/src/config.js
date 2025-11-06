const config = {
  apiUrl: import.meta.env.VITE_API_URL || 
          (import.meta.env.PROD 
            ? 'https://predictive-crops-production.up.railway.app' 
            : 'http://localhost:3002')
};

export default config;
