// // api.js
// import axios from 'axios';

// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/';

// // Fetch products based on a search query
// export const getProducts = async (query) => {
//   try {
//     const response = await axios.get(`${API_URL}/products/search?name=${query}`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching products:', error);
//     throw error;
//   }
// };

// // Function to add a new product
// export const addProduct = async (productData) => {
//   try {
//     const response = await axios.post(`${API_URL}/products`, productData);
//     return response.data;
//   } catch (error) {
//     console.error('Error adding product:', error);
//     throw error;
//   }
// };

// // Function to update a product
// export const updateProduct = async (productId, productData) => {
//   try {
//     const response = await axios.put(`${API_URL}/products/${productId}`, productData);
//     return response.data;
//   } catch (error) {
//     console.error('Error updating product:', error);
//     throw error;
//   }
// };

// // Function to delete a product
// export const deleteProduct = async (productId) => {
//   try {
//     const response = await axios.delete(`${API_URL}/products/${productId}`);
//     return response.data;
//   } catch (error) {
//     console.error('Error deleting product:', error);
//     throw error;
//   }
// };

// // Add this function
// export const getCollectionDates = async () => {
//   try {
//     const response = await axios.get(`${API_URL}/collection-dates`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching collection dates:', error);
//     throw error;
//   }
// };

// // Add manual data collection trigger
// export const triggerDataCollection = async (supermarketId) => {
//   try {
//     const response = await axios.post(`${API_URL}/admin/collect-data/${supermarketId}`);
//     return response.data;
//   } catch (error) {
//     console.error('Error triggering data collection:', error);
//     throw error;
//   }
// };

// // NEW API FUNCTIONS FOR QUIDU-STYLE COMPONENTS

// // Fetch new or back in stock products
// export const getNewOrBackInStockProducts = async () => {
//   try {
//     const response = await axios.get(`${API_URL}/products/new-or-back`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching new/back in stock products:', error);
//     throw error;
//   }
// };

// // Fetch cost comparison data
// export const getCostComparisons = async (limit = 4) => {
//   try {
//     const response = await axios.get(`${API_URL}/products/cost-comparison?limit=${limit}`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching cost comparisons:', error);
//     throw error;
//   }
// };

// // Fetch weekly sales/promotions
// export const getWeeklySales = async () => {
//   try {
//     const response = await axios.get(`${API_URL}/products/weekly-sales`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching weekly sales:', error);
//     throw error;
//   }
// };

// // Fetch product pricing history
// export const getProductPricingHistory = async (productId) => {
//   try {
//     const response = await axios.get(`${API_URL}/products/${productId}/pricing-history`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching product pricing history:', error);
//     throw error;
//   }
// };

// // Fetch detailed product information
// export const getProductDetails = async (productId) => {
//   try {
//     const response = await axios.get(`${API_URL}/products/${productId}/details`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching product details:', error);
//     throw error;
//   }
// };

// // Fetch featured products for home page
// // export const getFeaturedProducts = async (limit = 6) => {
// //   try {
// //     const response = await axios.get(`${API_URL}/products/featured?limit=${limit}`);
// //     return response.data;
// //   } catch (error) {
// //     console.error('Error fetching featured products:', error);
// //     throw error;
// //   }
// // };
// // src/services/api.js
// const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001";

// export async function getFeaturedProducts(limit = 6) {
//   const url = `${API_BASE}/api/products/featured?limit=${encodeURIComponent(limit)}`;
//   const res = await fetch(url);

//   const ct = res.headers.get("content-type") || "";
//   if (!res.ok) {
//     const text = await res.text();
//     throw new Error(`HTTP ${res.status} – ${text.slice(0, 200)}`);
//   }
//   if (!ct.includes("application/json")) {
//     const text = await res.text();
//     throw new Error(`Non-JSON from ${url}: ${text.slice(0, 200)}`);
//   }
//   return res.json();
// }

// src/services/api.js
import axios from "axios";

// Safe base URL resolution without assuming 'process' exists in the browser
const RAW_BASE =
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL)
    ? process.env.REACT_APP_API_URL
    : (typeof window !== "undefined" ? window.location.origin : "http://localhost:5001");

const HOST = RAW_BASE.replace(/\/+$/, "").replace(/\/api$/, "");

export const http = axios.create({
  baseURL: `${HOST}/api`,
});

// -------- Products --------

export const getProducts = async (query = "") => {
  const { data } = await http.get(`/products/search`, {
    params: { name: query },
  });
  return data;
};

export const addProduct = async (productData) => {
  const { data } = await http.post(`/products`, productData);
  return data;
};

export const updateProduct = async (productId, productData) => {
  const { data } = await http.put(`/products/${productId}`, productData);
  return data;
};

export const deleteProduct = async (productId) => {
  const { data } = await http.delete(`/products/${productId}`);
  return data;
};

// -------- Featured / Home widgets --------

export const getFeaturedProducts = async (limit = 6) => {
  const { data, headers } = await http.get(`/products/featured`, {
    params: { limit },
  });
  // Optional guard if backend misroutes to index.html
  const ct = headers["content-type"] || "";
  if (!ct.includes("application/json") && typeof data === "string") {
    throw new Error(`Non-JSON from ${HOST}/api/products/featured`);
  }
  return data;
};

export const getNewOrBackInStockProducts = async () => {
  const { data } = await http.get(`/products/new-or-back`);
  return data;
};

export const getCostComparisons = async (limit = 4) => {
  const { data } = await http.get(`/products/cost-comparison`, {
    params: { limit },
  });
  return data;
};

export const getWeeklySales = async () => {
  const { data } = await http.get(`/products/weekly-sales`);
  return data;
};

export const getProductPricingHistory = async (productId) => {
  const { data } = await http.get(`/products/${productId}/pricing-history`);
  return data;
};

export const getProductDetails = async (productId) => {
  const { data } = await http.get(`/products/${productId}/details`);
  return data;
};

// -------- Dashboard / Admin --------

export const getCollectionDates = async () => {
  const { data } = await http.get(`/collection-dates`);
  return data;
};

export const triggerDataCollection = async (supermarketId) => {
  const { data } = await http.post(`/admin/collect-data/${supermarketId}`);
  return data;
};
