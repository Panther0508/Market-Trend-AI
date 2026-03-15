import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory storage for demo purposes
// In production, use a database like Vercel Postgres, Redis, or similar
interface Product {
  id: number;
  name: string;
  category: string;
  demandScore: number;
  trendPercentage: string;
  searchVolume: number;
  lastUpdated: Date;
}

let products: Product[] = [
  { id: 1, name: "AI Smart Glasses", category: "Wearables", demandScore: 95, trendPercentage: "45.2", searchVolume: 1250000, lastUpdated: new Date() },
  { id: 2, name: "Sustainable Running Shoes", category: "Apparel", demandScore: 88, trendPercentage: "12.4", searchVolume: 850000, lastUpdated: new Date() },
  { id: 3, name: "Ergonomic Desk Chair", category: "Furniture", demandScore: 82, trendPercentage: "5.1", searchVolume: 620000, lastUpdated: new Date() },
  { id: 4, name: "Smart Ring Tracker", category: "Wearables", demandScore: 79, trendPercentage: "22.8", searchVolume: 410000, lastUpdated: new Date() },
  { id: 5, name: "Portable Solar Panels", category: "Electronics", demandScore: 75, trendPercentage: "18.5", searchVolume: 380000, lastUpdated: new Date() },
  { id: 6, name: "Noise Cancelling Earbuds", category: "Electronics", demandScore: 92, trendPercentage: "8.3", searchVolume: 1100000, lastUpdated: new Date() },
  { id: 7, name: "Foldable Keyboard", category: "Accessories", demandScore: 65, trendPercentage: "-2.1", searchVolume: 150000, lastUpdated: new Date() },
];

export default function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return response.status(204).end();
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    return response.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Sort by demand score descending
    const sortedProducts = [...products].sort((a, b) => b.demandScore - a.demandScore);
    
    // Return top 20 products
    return response.status(200).json(sortedProducts.slice(0, 20));
  } catch (error) {
    console.error('Error fetching products:', error);
    return response.status(500).json({ message: 'Internal server error' });
  }
}
