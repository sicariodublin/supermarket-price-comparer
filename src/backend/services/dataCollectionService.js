const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const cron = require('node-cron');

// Common Puppeteer launch options — helps avoid bot detection on most sites
const PUPPETEER_OPTS = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage',
    '--window-size=1280,800',
  ],
};

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/124.0.0.0 Safari/537.36';

// Pause for a random duration in [min, max] ms — reduces detection risk between pages
const jitter = (min = 1500, max = 3500) =>
  new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));

class DataCollectionService {
  constructor(connection) {
    this.connection = connection;
    this.productColumns = null;

    this.supermarkets = {
      1: {
        name: 'Lidl',
        categoryUrls: [
          'https://www.lidl.ie/c/fresh-fruit-vegetables/c1388',
          'https://www.lidl.ie/c/dairy-eggs/c1390',
          'https://www.lidl.ie/c/meat-fish/c1389',
          'https://www.lidl.ie/c/bakery/c1391',
          'https://www.lidl.ie/c/chilled-convenience/c1393',
        ],
        scrapeMethod: 'lidl',
      },
      2: {
        name: 'SuperValu',
        categoryUrls: [
          'https://shop.supervalu.ie/shopping/fruit-vegetables/c-10001',
          'https://shop.supervalu.ie/shopping/dairy-eggs-chilled/c-10002',
          'https://shop.supervalu.ie/shopping/meat-poultry/c-10003',
          'https://shop.supervalu.ie/shopping/bakery/c-10004',
        ],
        scrapeMethod: 'supervalu',
      },
      3: {
        name: 'TESCO',
        categoryUrls: [
          'https://www.tesco.ie/groceries/en-IE/shop/fresh-food/fresh-fruit',
          'https://www.tesco.ie/groceries/en-IE/shop/fresh-food/fresh-vegetables',
          'https://www.tesco.ie/groceries/en-IE/shop/fresh-food/dairy-eggs-and-chilled',
          'https://www.tesco.ie/groceries/en-IE/shop/bakery/all',
          'https://www.tesco.ie/groceries/en-IE/shop/fresh-food/fresh-meat-and-poultry',
        ],
        scrapeMethod: 'tesco',
      },
      4: {
        name: 'Aldi',
        categoryUrls: [
          'https://groceries.aldi.ie/en-IE/fruit-vegetables',
          'https://groceries.aldi.ie/en-IE/dairy-eggs',
          'https://groceries.aldi.ie/en-IE/meat-fish-poultry',
          'https://groceries.aldi.ie/en-IE/bakery',
          'https://groceries.aldi.ie/en-IE/food-cupboard',
        ],
        scrapeMethod: 'aldi',
      },
      5: {
        name: 'M&S',
        categoryUrls: [
          'https://www.marksandspencer.com/ie/l/food-wine/fruit-vegetables',
          'https://www.marksandspencer.com/ie/l/food-wine/dairy-eggs',
          'https://www.marksandspencer.com/ie/l/food-wine/meat-fish',
          'https://www.marksandspencer.com/ie/l/food-wine/bakery',
          'https://www.marksandspencer.com/ie/l/food-wine/ready-meals',
        ],
        scrapeMethod: 'mands',
      },
      6: {
        name: 'Dunnes Stores',
        categoryUrls: [
          'https://www.dunnesstores.com/c/fruit-vegetables',
          'https://www.dunnesstores.com/c/dairy-eggs-chilled',
          'https://www.dunnesstores.com/c/meat-poultry-fish',
          'https://www.dunnesstores.com/c/bakery',
          'https://www.dunnesstores.com/c/food-cupboard',
        ],
        scrapeMethod: 'dunnes',
      },
    };
  }

  // ─── Puppeteer helpers ──────────────────────────────────────────────────────

  async _launchPage() {
    const browser = await puppeteer.launch(PUPPETEER_OPTS);
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.setViewport({ width: 1280, height: 800 });
    // Hide webdriver property that reveals headless Chrome
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
    return { browser, page };
  }

  // Extract Schema.org Product JSON-LD from page — works on many modern e-commerce sites
  _extractJsonLdProducts($, supermarketId) {
    const products = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html());
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          const entries = item['@type'] === 'ItemList'
            ? (item.itemListElement || []).map((e) => e.item || e)
            : item['@type'] === 'Product' ? [item] : [];

          for (const entry of entries) {
            if (entry['@type'] !== 'Product') continue;
            const name = entry.name?.trim();
            const offer = Array.isArray(entry.offers) ? entry.offers[0] : entry.offers;
            const price = parseFloat(offer?.price);
            if (!name || isNaN(price)) continue;
            products.push({
              name,
              price,
              unit: entry.weight || entry.description?.match(/\d+\s*(g|kg|ml|l|cl)\b/i)?.[0] || 'each',
              supermarket_id: supermarketId,
              product_date: new Date().toISOString().split('T')[0],
            });
          }
        }
      } catch { /* malformed JSON-LD — skip */ }
    });
    return products;
  }

  _parsePrice(text = '') {
    const cleaned = text.replace(/[^\d.,]/g, '').replace(',', '.');
    const price = parseFloat(cleaned);
    return isNaN(price) ? null : price;
  }

  // ─── Per-supermarket scrapers ───────────────────────────────────────────────

  async _scrapeLidl(url) {
    const { browser, page } = await this._launchPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('.product-grid-box, [class*="ProductCard"]', { timeout: 10000 }).catch(() => {});
      const $ = cheerio.load(await page.content());

      // Try JSON-LD first
      const jsonLd = this._extractJsonLdProducts($, 1);
      if (jsonLd.length) return jsonLd;

      const products = [];
      $('.product-grid-box, [class*="ProductCard"]').each((_, el) => {
        const name = $(el).find('[class*="product-title"], [class*="ProductTitle"], h3, h4').first().text().trim();
        const priceText = $(el).find('[class*="price__value"], [class*="Price"], .price').first().text().trim();
        const unit = $(el).find('[class*="price__unit"], [class*="Unit"], .unit').first().text().trim();
        const price = this._parsePrice(priceText);
        if (name && price !== null) {
          products.push({ name, price, unit: unit || 'each', supermarket_id: 1, product_date: new Date().toISOString().split('T')[0] });
        }
      });
      return products;
    } finally {
      await browser.close();
    }
  }

  async _scrapeSupervalu(url) {
    const { browser, page } = await this._launchPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('.product-container, [class*="ProductItem"]', { timeout: 10000 }).catch(() => {});
      const $ = cheerio.load(await page.content());

      const jsonLd = this._extractJsonLdProducts($, 2);
      if (jsonLd.length) return jsonLd;

      const products = [];
      $('.product-container, [class*="ProductItem"], [data-testid="product-item"]').each((_, el) => {
        const name = $(el).find('[class*="product-name"], [class*="ProductName"], h3, h4').first().text().trim();
        const priceText = $(el).find('[class*="price"], [data-testid="price"]').first().text().trim();
        const unit = $(el).find('[class*="unit"], [class*="weight"]').first().text().trim();
        const price = this._parsePrice(priceText);
        if (name && price !== null) {
          products.push({ name, price, unit: unit || 'each', supermarket_id: 2, product_date: new Date().toISOString().split('T')[0] });
        }
      });
      return products;
    } finally {
      await browser.close();
    }
  }

  async _scrapeTesco(url) {
    const { browser, page } = await this._launchPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('[data-auto="product-tile"], .product-list--list-item', { timeout: 10000 }).catch(() => {});
      const $ = cheerio.load(await page.content());

      const jsonLd = this._extractJsonLdProducts($, 3);
      if (jsonLd.length) return jsonLd;

      const products = [];
      $('[data-auto="product-tile"], .product-list--list-item').each((_, el) => {
        const name = $(el).find('[data-auto="product-title"], .product-tile--title, h3').first().text().trim();
        const priceText = $(el).find('[data-auto="price"], .price-control--price, .value').first().text().trim();
        const unit = $(el).find('.price-per-quantity-weight, .weight').first().text().trim();
        const price = this._parsePrice(priceText);
        if (name && price !== null) {
          products.push({ name, price, unit: unit || 'each', supermarket_id: 3, product_date: new Date().toISOString().split('T')[0] });
        }
      });
      return products;
    } finally {
      await browser.close();
    }
  }

  async _scrapeAldi(url) {
    const { browser, page } = await this._launchPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('.product-tile, [class*="ProductTile"]', { timeout: 10000 }).catch(() => {});
      const $ = cheerio.load(await page.content());

      const jsonLd = this._extractJsonLdProducts($, 4);
      if (jsonLd.length) return jsonLd;

      const products = [];
      $('.product-tile, [class*="ProductTile"]').each((_, el) => {
        const name = $(el).find('.product-tile__name, [class*="ProductName"], h3').first().text().trim();
        const priceText = $(el).find('.product-tile__price, [class*="Price"]').first().text().trim();
        const unit = $(el).find('.product-tile__unit, [class*="Unit"]').first().text().trim();
        const price = this._parsePrice(priceText);
        if (name && price !== null) {
          products.push({ name, price, unit: unit || 'each', supermarket_id: 4, product_date: new Date().toISOString().split('T')[0] });
        }
      });
      return products;
    } finally {
      await browser.close();
    }
  }

  // M&S Ireland uses a Next.js frontend; products are rendered as React component trees.
  // Primary strategy: JSON-LD (M&S includes Schema.org Product markup).
  // Fallback: data-testid attributes that have been stable across M&S redesigns.
  async _scrapeMnS(url) {
    const { browser, page } = await this._launchPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // M&S lazy-loads product cards — scroll to trigger renders
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await jitter(1000, 2000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await jitter(1000, 2000);

      await page.waitForSelector(
        '[data-testid="product-grid"] [data-testid="product-tile"], .ProductCardAnchor',
        { timeout: 12000 }
      ).catch(() => {});

      const $ = cheerio.load(await page.content());

      // JSON-LD is the most reliable extraction path for M&S
      const jsonLd = this._extractJsonLdProducts($, 5);
      if (jsonLd.length) return jsonLd;

      // DOM fallback using data-testid attributes
      const products = [];
      const containers = $('[data-testid="product-tile"], .ProductCardAnchor, [class*="ProductCard_"]');
      containers.each((_, el) => {
        const name = $(el)
          .find('[data-testid="product-name"], [class*="ProductCardDescription"], [class*="product-name"]')
          .first().text().trim();

        const priceText = $(el)
          .find('[data-testid="price"], [class*="ProductCardPrice"], [class*="price"]')
          .first().text().trim();

        const unit = $(el)
          .find('[data-testid="weight"], [class*="ProductCardWeight"], [class*="weight"]')
          .first().text().trim();

        const price = this._parsePrice(priceText);
        if (name && price !== null) {
          products.push({
            name,
            price,
            unit: unit || 'each',
            supermarket_id: 5,
            product_date: new Date().toISOString().split('T')[0],
          });
        }
      });
      return products;
    } finally {
      await browser.close();
    }
  }

  // Dunnes Stores uses SAP Commerce Cloud (Hybris). Products are server-side rendered
  // with JavaScript-enhanced pagination. JSON-LD is not always present, so DOM selectors
  // are the primary strategy. Hybris class patterns have been stable for several years.
  async _scrapeDunnes(url) {
    const { browser, page } = await this._launchPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Dismiss cookie banner if present — it can obscure product content
      await page.evaluate(() => {
        const btn = document.querySelector('#accept-recommended-btn-handler, .cc-btn, [id*="cookie"] button');
        if (btn) btn.click();
      }).catch(() => {});

      await jitter(800, 1500);

      await page.waitForSelector(
        '.product-listing-item, .product-tile, [class*="product-item"]',
        { timeout: 12000 }
      ).catch(() => {});

      const $ = cheerio.load(await page.content());

      const jsonLd = this._extractJsonLdProducts($, 6);
      if (jsonLd.length) return jsonLd;

      const products = [];
      // Dunnes Hybris product grid — multiple selector variants cover different page templates
      const containers = $(
        '.product-listing-item, .product-tile, ' +
        '[class*="product-item"]:not([class*="product-item__"]), ' +
        '.js-product-item'
      );

      containers.each((_, el) => {
        const name = $(el)
          .find(
            '.product-name, .product-listing__title, ' +
            '.product-item__name, [class*="product-title"], ' +
            'h2, h3'
          )
          .first().text().trim();

        const priceText = $(el)
          .find(
            '.price, .product-price, .product-listing__price, ' +
            '[class*="price-value"], [data-product-price]'
          )
          .first().text().trim();

        const unit = $(el)
          .find('.product-unit, .product-listing__unit, [class*="unit"], [class*="weight"]')
          .first().text().trim();

        const price = this._parsePrice(priceText);
        if (name && price !== null) {
          products.push({
            name,
            price,
            unit: unit || 'each',
            supermarket_id: 6,
            product_date: new Date().toISOString().split('T')[0],
          });
        }
      });
      return products;
    } finally {
      await browser.close();
    }
  }

  // ─── Dispatch ───────────────────────────────────────────────────────────────

  async scrapeProducts(supermarketId, searchTerm = '') {
    const supermarket = this.supermarkets[supermarketId];
    if (!supermarket) throw new Error(`Supermarket ${supermarketId} not configured`);

    const scrapeUrl = async (url) => {
      try {
        switch (supermarket.scrapeMethod) {
          case 'lidl':      return await this._scrapeLidl(url);
          case 'supervalu': return await this._scrapeSupervalu(url);
          case 'tesco':     return await this._scrapeTesco(url);
          case 'aldi':      return await this._scrapeAldi(url);
          case 'mands':     return await this._scrapeMnS(url);
          case 'dunnes':    return await this._scrapeDunnes(url);
          default:          throw new Error(`Unknown scrape method: ${supermarket.scrapeMethod}`);
        }
      } catch (err) {
        console.error(`[${supermarket.name}] Failed to scrape ${url}:`, err.message);
        return [];
      }
    };

    if (searchTerm) {
      // Search-term override — only Tesco and SuperValu have reliable search URLs
      const searchUrls = {
        2: `https://shop.supervalu.ie/search?q=${encodeURIComponent(searchTerm)}`,
        3: `https://www.tesco.ie/groceries/en-IE/search?query=${encodeURIComponent(searchTerm)}`,
      };
      const url = searchUrls[supermarketId] || supermarket.categoryUrls[0];
      return scrapeUrl(url);
    }

    // Scrape all category URLs, pausing between each to be polite
    const allProducts = [];
    for (const url of supermarket.categoryUrls) {
      const batch = await scrapeUrl(url);
      allProducts.push(...batch);
      console.log(`[${supermarket.name}] ${url} → ${batch.length} products`);
      if (supermarket.categoryUrls.indexOf(url) < supermarket.categoryUrls.length - 1) {
        await jitter(3000, 6000);
      }
    }
    return allProducts;
  }

  // ─── DB operations ──────────────────────────────────────────────────────────

  async updateProductPrices(supermarketId) {
    try {
      console.log(`Starting data collection for supermarket ${supermarketId}`);
      const products = await this.scrapeProducts(supermarketId);

      for (const product of products) {
        const existing = await this.findExistingProduct(product.name, supermarketId);
        if (existing) {
          await this.updateProduct(existing.id, product);
        } else {
          await this.insertProduct(product);
        }
      }

      await this.updateCollectionDate(supermarketId);
      console.log(`Data collection done for supermarket ${supermarketId}. ${products.length} products processed.`);
    } catch (error) {
      console.error(`Error collecting data for supermarket ${supermarketId}:`, error);
    }
  }

  async findExistingProduct(name, supermarketId) {
    return new Promise((resolve, reject) => {
      this.connection.query(
        'SELECT * FROM products WHERE name = ? AND supermarket_id = ?',
        [name, supermarketId],
        (err, results) => (err ? reject(err) : resolve(results[0] || null))
      );
    });
  }

  async updateProduct(productId, productData) {
    const updates = ['price = ?', 'product_date = ?'];
    const values = [productData.price, productData.product_date];

    if (await this.hasProductColumn('source'))        updates.push("source = 'scraper'");
    if (await this.hasProductColumn('approval_status')) updates.push("approval_status = 'approved'");
    if (await this.hasProductColumn('last_checked_at')) updates.push('last_checked_at = NOW()');

    values.push(productId);

    return new Promise((resolve, reject) => {
      this.connection.query(
        `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
        values,
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });
  }

  async insertProduct(productData) {
    const columns = ['name', 'quantity', 'unit', 'price', 'supermarket_id', 'product_date'];
    const placeholders = ['?', '?', '?', '?', '?', '?'];
    const values = [
      productData.name,
      1,
      productData.unit,
      productData.price,
      productData.supermarket_id,
      productData.product_date,
    ];

    if (await this.hasProductColumn('source')) {
      columns.push('source'); placeholders.push('?'); values.push('scraper');
    }
    if (await this.hasProductColumn('approval_status')) {
      columns.push('approval_status'); placeholders.push('?'); values.push('approved');
    }
    if (await this.hasProductColumn('last_checked_at')) {
      columns.push('last_checked_at'); placeholders.push('NOW()');
    }

    return new Promise((resolve, reject) => {
      this.connection.query(
        `INSERT INTO products (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
        values,
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });
  }

  async updateCollectionDate(supermarketId) {
    return new Promise((resolve, reject) => {
      this.connection.query(
        'UPDATE supermarkets SET last_updated = NOW() WHERE id = ?',
        [supermarketId],
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });
  }

  async loadProductColumns() {
    if (this.productColumns) return this.productColumns;

    const rows = await new Promise((resolve, reject) => {
      this.connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'`,
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

  // ─── Scheduler ──────────────────────────────────────────────────────────────

  scheduleDataCollection() {
    // Run daily at 6 AM; stagger supermarkets by 5 minutes each
    cron.schedule('0 6 * * *', async () => {
      console.log('Starting scheduled data collection...');
      for (const supermarketId of Object.keys(this.supermarkets)) {
        await this.updateProductPrices(parseInt(supermarketId));
        await new Promise((r) => setTimeout(r, 5 * 60 * 1000));
      }
      console.log('Scheduled data collection completed.');
    });
  }
}

module.exports = DataCollectionService;
