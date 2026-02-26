// Central API configuration
// Uses VITE_API_URL from environment variables (set in Vercel for production)
// Falls back to localhost:3000 for local development
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default API_BASE;
