// Top-level axios client setup
import axios from "axios";

const env = typeof process !== "undefined" && process.env ? process.env : {};

const API_BASE =
  env.REACT_APP_API_URL ||
  (typeof window !== "undefined" && window.__API_URL) ||
  "http://localhost:5001";

export const http = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
});

// Attach Basic Auth only if no Authorization header is already set (preserve Bearer)
const BASIC_USER =
  env.REACT_APP_BASIC_USER ||
  (typeof window !== "undefined" && window.__BASIC_USER) ||
  "";
const BASIC_PASS =
  env.REACT_APP_BASIC_PASS ||
  (typeof window !== "undefined" && window.__BASIC_PASS) ||
  "";

if (BASIC_USER && BASIC_PASS) {
  http.interceptors.request.use((config) => {
    config.headers = config.headers || {};
    const hasAuth =
      typeof config.headers["Authorization"] === "string" &&
      config.headers["Authorization"].length > 0;

    if (!hasAuth) {
      const token = btoa(`${BASIC_USER}:${BASIC_PASS}`);
      config.headers["Authorization"] = `Basic ${token}`;
    }
    return config;
  });
}

// Featured products
export async function getFeaturedProducts(limit = 6) {
  const { data } = await http.get("/products/featured", { params: { limit } });
  return data;
}

export async function searchProductsByName(name) {
  const { data } = await http.get("/products/search", {
    params: { name },
  });
  return data;
}

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
