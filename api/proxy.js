// Vercel API proxy to forward requests to the backend
export default async function handler(req, res) {
  const { method, body, query } = req;
  const path = req.url.replace('/api/proxy', '');
  
  const backendUrl = `https://enamel-backend.onrender.com/api${path}`;
  
  console.log(`Proxying ${method} request to: ${backendUrl}`);
  
  try {
    const response = await fetch(backendUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: method !== 'GET' ? JSON.stringify(body) : undefined,
    });
    
    const data = await response.json();
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Proxy error',
      error: error.message 
    });
  }
}
