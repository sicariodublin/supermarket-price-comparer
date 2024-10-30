import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getProducts = async (query) => {
  try {
    const response = await axios.get(`${API_URL}/products/search?name=${query}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};
