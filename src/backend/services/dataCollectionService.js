const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const cron = require('node-cron');

class DataCollectionService {
  constructor(connection) {
    this.connection = connection;
    this.supermarkets = {
      1: { // Lidl
        name: 'Lidl',
        baseUrl: 'https://www.lidl.ie',
        searchUrl: 'https://www.lidl.ie/search?q=',
        selectors: {
          productName: '.product-title',
          price: '.price',
          unit: '.unit'
        }
      },
      2: { // SuperValu
        name: 'SuperValu',
        baseUrl: 'https://shop.supervalu.ie',
        searchUrl: 'https://shop.supervalu.ie/search?q=',
        selectors: {
          productName: '.product-name',
          price: '.price-current',
          unit: '.product-unit'
        }
      },
      3: { // Tesco
        name: 'TESCO',
        baseUrl: 'https://www.tesco.ie',
        searchUrl: 'https://www.tesco.ie/groceries/en-IE/search?query=',
        selectors: {
          productName: '.product-title',
          price: '.price',
          unit: '.weight'
        }
      },
      4: { // Aldi
        name: 'Aldi',
        baseUrl: 'https://groceries.aldi.ie',
        searchUrl: 'https://groceries.aldi.ie/search?q=',
        selectors: {
          productName: '.product-name',
          price: '.price-value',
          unit: '.product-unit'
        }
      }
    };
  }

  async scrapeProducts(supermarketId, searchTerm = '') {
    const supermarket = this.supermarkets[supermarketId];
    if (!supermarket) throw new Error('Supermarket not found');

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
      const url = searchTerm ? 
        `${supermarket.searchUrl}${encodeURIComponent(searchTerm)}` : 
        supermarket.baseUrl;
      
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      const content = await page.content();
      const $ = cheerio.load(content);
      
      const products = [];
      
      $('.product-item').each((index, element) => {
        const name = $(element).find(supermarket.selectors.productName).text().trim();
        const priceText = $(element).find(supermarket.selectors.price).text().trim();
        const unit = $(element).find(supermarket.selectors.unit).text().trim();
        
        // Extract price number
        const price = parseFloat(priceText.replace(/[^\d.]/g, ''));
        
        if (name && !isNaN(price)) {
          products.push({
            name,
            price,
            unit: unit || 'each',
            supermarket_id: supermarketId,
            product_date: new Date().toISOString().split('T')[0]
          });
        }
      });
      
      return products;
    } finally {
      await browser.close();
    }
  }

  async updateProductPrices(supermarketId) {
    try {
      console.log(`Starting data collection for supermarket ${supermarketId}`);
      
      const products = await this.scrapeProducts(supermarketId);
      
      for (const product of products) {
        // Check if product exists
        const existingProduct = await this.findExistingProduct(product.name, supermarketId);
        
        if (existingProduct) {
          // Update existing product
          await this.updateProduct(existingProduct.id, product);
        } else {
          // Insert new product
          await this.insertProduct(product);
        }
      }
      
      // Update collection date
      await this.updateCollectionDate(supermarketId);
      
      console.log(`Data collection completed for supermarket ${supermarketId}. Updated ${products.length} products.`);
      
    } catch (error) {
      console.error(`Error collecting data for supermarket ${supermarketId}:`, error);
    }
  }

  async findExistingProduct(name, supermarketId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM products WHERE name = ? AND supermarket_id = ?';
      this.connection.query(query, [name, supermarketId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || null);
      });
    });
  }

  async updateProduct(productId, productData) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE products SET price = ?, product_date = ? WHERE id = ?';
      this.connection.query(query, [productData.price, productData.product_date, productId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  async insertProduct(productData) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO products (name, quantity, unit, price, supermarket_id, product_date) VALUES (?, ?, ?, ?, ?, ?)';
      this.connection.query(query, [
        productData.name,
        1, // default quantity
        productData.unit,
        productData.price,
        productData.supermarket_id,
        productData.product_date
      ], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  async updateCollectionDate(supermarketId) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE supermarkets SET last_updated = NOW() WHERE id = ?';
      this.connection.query(query, [supermarketId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Schedule automatic data collection
  scheduleDataCollection() {
    // Run every day at 6 AM
    cron.schedule('0 6 * * *', async () => {
      console.log('Starting scheduled data collection...');
      
      for (const supermarketId of Object.keys(this.supermarkets)) {
        await this.updateProductPrices(parseInt(supermarketId));
        // Wait 5 minutes between supermarkets to avoid overwhelming servers
        await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
      }
      
      console.log('Scheduled data collection completed.');
    });
  }
}

module.exports = DataCollectionService;