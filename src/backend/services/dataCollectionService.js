const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const cron = require('node-cron');

class DataCollectionService {
  constructor(connection) {
    this.connection = connection;
    this.productColumns = null;
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

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
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
    const updates = ['price = ?', 'product_date = ?'];
    const values = [productData.price, productData.product_date];

    if (await this.hasProductColumn('source')) {
      updates.push("source = 'scraper'");
    }

    if (await this.hasProductColumn('approval_status')) {
      updates.push("approval_status = 'approved'");
    }

    if (await this.hasProductColumn('last_checked_at')) {
      updates.push('last_checked_at = NOW()');
    }

    values.push(productId);

    return new Promise((resolve, reject) => {
      const query = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
      this.connection.query(query, values, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  async insertProduct(productData) {
    const columns = ['name', 'quantity', 'unit', 'price', 'supermarket_id', 'product_date'];
    const placeholders = ['?', '?', '?', '?', '?', '?'];
    const values = [
      productData.name,
      1, // default quantity
      productData.unit,
      productData.price,
      productData.supermarket_id,
      productData.product_date
    ];

    if (await this.hasProductColumn('source')) {
      columns.push('source');
      placeholders.push('?');
      values.push('scraper');
    }

    if (await this.hasProductColumn('approval_status')) {
      columns.push('approval_status');
      placeholders.push('?');
      values.push('approved');
    }

    if (await this.hasProductColumn('last_checked_at')) {
      columns.push('last_checked_at');
      placeholders.push('NOW()');
    }

    return new Promise((resolve, reject) => {
      const query = `INSERT INTO products (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
      this.connection.query(query, values, (err, result) => {
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

  async loadProductColumns() {
    if (this.productColumns) {
      return this.productColumns;
    }

    const rows = await new Promise((resolve, reject) => {
      this.connection.query(
        `
          SELECT COLUMN_NAME
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'products'
        `,
        (err, results) => (err ? reject(err) : resolve(results))
      );
    });

    this.productColumns = new Set(rows.map((row) => row.COLUMN_NAME));
    return this.productColumns;
  }

  async hasProductColumn(column) {
    const columns = await this.loadProductColumns();
    return columns.has(column);
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

  // create featured products fucntion to collect data based on discount percentage or featured table in database
  async createFeaturedProducts() {
    const featuredProducts = await new Promise((resolve, reject) => {
      this.connection.query(
        "SELECT * FROM products WHERE featured = 1",
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
    console.log('Featured products found:', featuredProducts.length);

    for (const product of featuredProducts) {
      const productId = product.id;
      const discountPercentage = product.discount_percentage;
      const supermarketId = product.supermarket_id;

      // Check if product exists in supermarket
      const existingProduct = await this.findExistingProduct(product.name, supermarketId);
      if (existingProduct) {
        // Update existing product
        await this.updateProduct(existingProduct.id, product);
      } else {
        // Insert new product
        await this.insertProduct(product);
      }

      // Update collection date
      await this.updateCollectionDate(supermarketId);

      console.log(`Featured product ${productId} collected for supermarket ${supermarketId}`);
    }
  }
}

module.exports = DataCollectionService;
