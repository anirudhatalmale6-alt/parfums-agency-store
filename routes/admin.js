const express = require('express');
const router = express.Router();
const { db } = require('../database');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAdmin } = require('../middleware/auth');

// ============================================================
// MULTER CONFIGURATIONS
// ============================================================

// Product file upload
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads', 'products')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + Date.now() + '-' + Math.random().toString(36).substring(7) + ext);
  }
});
const productUpload = multer({ storage: productStorage, limits: { fileSize: 50 * 1024 * 1024 } });
const productFields = productUpload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'main_image', maxCount: 1 },
  { name: 'gallery_images', maxCount: 20 },
  { name: 'description_images', maxCount: 10 },
  { name: 'audio', maxCount: 1 }
]);

// Variation image upload
const variationStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads', 'variations')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'variation-' + Date.now() + '-' + Math.random().toString(36).substring(7) + ext);
  }
});
const variationUpload = multer({ storage: variationStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// Slider image upload
const sliderStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads', 'sliders')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'slider-' + Date.now() + '-' + Math.random().toString(36).substring(7) + ext);
  }
});
const sliderUpload = multer({ storage: sliderStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// Gift image upload
const giftStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads', 'gifts')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'gift-' + Date.now() + '-' + Math.random().toString(36).substring(7) + ext);
  }
});
const giftUpload = multer({ storage: giftStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// Footer icon upload
const footerIconStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'public', 'uploads', 'footer-icons');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'footer-icon-' + Date.now() + '-' + Math.random().toString(36).substring(7) + ext);
  }
});
const footerIconUpload = multer({ storage: footerIconStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// Category image upload
const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads', 'categories')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'category-' + Date.now() + '-' + Math.random().toString(36).substring(7) + ext);
  }
});
const categoryUpload = multer({ storage: categoryStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// Settings uploads (OG image, favicon)
const settingsStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads', 'settings')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + Date.now() + ext);
  }
});
const settingsUpload = multer({ storage: settingsStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// Landing page media upload
const landingStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads', 'landing-pages')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'landing-' + Date.now() + '-' + Math.random().toString(36).substring(7) + ext);
  }
});
const landingUpload = multer({ storage: landingStorage, limits: { fileSize: 50 * 1024 * 1024 } });

// Admin review upload (image + audio)
const adminReviewStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads', 'reviews')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'review-' + Date.now() + '-' + Math.random().toString(36).substring(7) + ext);
  }
});
const adminReviewUpload = multer({ storage: adminReviewStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// Banner image upload
const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'public', 'uploads', 'banners');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'banner-' + Date.now() + '-' + Math.random().toString(36).substring(7) + ext);
  }
});
const bannerUpload = multer({ storage: bannerStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// ============================================================
// AUTH ROUTES
// ============================================================

// Login page
router.get('/login', (req, res) => {
  if (req.session.admin) return res.redirect('/admin');
  res.render('admin/login', { error: null });
});

// Login POST
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);

  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.render('admin/login', { error: 'اسم المستخدم أو كلمة المرور خاطئة' });
  }

  req.session.admin = { id: admin.id, username: admin.username };
  res.redirect('/admin');
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// ============================================================
// DASHBOARD
// ============================================================

router.get('/', requireAdmin, (req, res) => {
  const stats = {
    totalProducts: db.prepare('SELECT COUNT(*) as c FROM products').get().c,
    totalOrders: db.prepare('SELECT COUNT(*) as c FROM orders').get().c,
    pendingOrders: db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'").get().c,
    pendingReviews: db.prepare("SELECT COUNT(*) as c FROM reviews WHERE status = 'pending'").get().c,
    totalRevenue: db.prepare('SELECT COALESCE(SUM(payment_amount), 0) as total FROM orders').get().total
  };

  const recentOrders = db.prepare(`
    SELECT o.*, p.title as product_title
    FROM orders o LEFT JOIN products p ON o.product_id = p.id
    ORDER BY o.created_at DESC LIMIT 5
  `).all();

  const pendingReviews = db.prepare(`
    SELECT r.*, p.title as product_title
    FROM reviews r LEFT JOIN products p ON r.product_id = p.id
    WHERE r.status = 'pending'
    ORDER BY r.created_at DESC LIMIT 5
  `).all();

  res.render('admin/dashboard', { stats, recentOrders, pendingReviews });
});

// ============================================================
// PRODUCTS
// ============================================================

// Products list
router.get('/products', requireAdmin, (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.render('admin/products', { products });
});

// New product form
router.get('/products/new', requireAdmin, (req, res) => {
  const categories = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order').all();
  res.render('admin/product-form', { product: null, categories });
});

// Create product
router.post('/products', requireAdmin, productFields, (req, res) => {
  const { title, description, price, old_price, discount, slug, deposit_amount, features, show_gallery, show_reviews, whatsapp_number, delivery_fee, weight, cod_enabled, bank_full_enabled, bank_deposit_enabled, audio_autoplay, category_id, stock_quantity, availability_status, meta_title, meta_description } = req.body;
  const videoFilename = req.files && req.files.video ? req.files.video[0].filename : '';
  const mainImageFilename = req.files && req.files.main_image ? req.files.main_image[0].filename : '';
  const audioFilename = req.files && req.files.audio ? req.files.audio[0].filename : '';

  // Description images as JSON array of filenames
  let descriptionImagesJson = '[]';
  if (req.files && req.files.description_images) {
    descriptionImagesJson = JSON.stringify(req.files.description_images.map(f => f.filename));
  }

  // Generate slug if empty
  const finalSlug = slug || title.toLowerCase().replace(/[^\w\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '') || 'product-' + Date.now();

  try {
    const result = db.prepare(`
      INSERT INTO products (title, description, price, old_price, discount, slug, deposit_amount, video_filename, features, main_image, show_gallery, show_reviews, description_images, whatsapp_number, delivery_fee, weight, audio_filename, audio_autoplay, cod_enabled, bank_full_enabled, bank_deposit_enabled, category_id, stock_quantity, availability_status, meta_title, meta_description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description || '', parseFloat(price) || 200, parseFloat(old_price) || 0, discount || '', finalSlug, parseFloat(deposit_amount) || 50, videoFilename, features || '[]', mainImageFilename, show_gallery === 'on' || show_gallery === '1' ? 1 : 0, show_reviews === 'on' || show_reviews === '1' ? 1 : 0, descriptionImagesJson, whatsapp_number || '', parseFloat(delivery_fee) || 50, parseFloat(weight) || 0, audioFilename, audio_autoplay === '1' ? 1 : 0, cod_enabled === '1' ? 1 : 0, bank_full_enabled === '1' ? 1 : 0, bank_deposit_enabled === '1' ? 1 : 0, category_id ? parseInt(category_id) : null, stock_quantity !== undefined && stock_quantity !== '' ? parseInt(stock_quantity) : -1, availability_status || 'in_stock', meta_title || '', meta_description || '');

    // Insert gallery images into product_images table
    if (req.files && req.files.gallery_images) {
      const productId = result.lastInsertRowid;
      req.files.gallery_images.forEach((file, index) => {
        db.prepare('INSERT INTO product_images (product_id, filename, sort_order) VALUES (?, ?, ?)').run(productId, file.filename, index);
      });
    }

    res.redirect('/admin/products');
  } catch (err) {
    console.error('Create product error:', err);
    res.redirect('/admin/products/new');
  }
});

// Edit product form
router.get('/products/:id/edit', requireAdmin, (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.redirect('/admin/products');
  const galleryImages = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order').all(product.id);
  product.gallery_images = galleryImages;
  const faqs = db.prepare('SELECT * FROM product_faqs WHERE product_id = ? ORDER BY sort_order').all(product.id);
  product.faqs = faqs;
  const variations = db.prepare('SELECT * FROM product_variations WHERE product_id = ? ORDER BY type, sort_order').all(product.id);
  product.variations = variations;
  const categories = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order').all();
  res.render('admin/product-form', { product, categories, success: req.query.success, error: req.query.error });
});

// Update product
router.post('/products/:id', requireAdmin, productFields, (req, res) => {
  try {
    const { title, description, price, old_price, discount, slug, deposit_amount, features, is_active, show_gallery, show_reviews, whatsapp_number, delivery_fee, weight, cod_enabled, bank_full_enabled, bank_deposit_enabled, audio_autoplay, category_id, stock_quantity, availability_status, meta_title, meta_description } = req.body;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.redirect('/admin/products');

    const videoFilename = req.files && req.files.video ? req.files.video[0].filename : product.video_filename;
    const mainImageFilename = req.files && req.files.main_image ? req.files.main_image[0].filename : (product.main_image || '');
    const audioFilename = req.files && req.files.audio ? req.files.audio[0].filename : (product.audio_filename || '');

    // Handle description images: merge existing with new uploads
    let existingDescImages = [];
    try { existingDescImages = JSON.parse(product.description_images || '[]'); } catch(e) {}
    if (req.files && req.files.description_images) {
      const newDescImages = req.files.description_images.map(f => f.filename);
      existingDescImages = existingDescImages.concat(newDescImages);
    }
    const descriptionImagesJson = JSON.stringify(existingDescImages);

    // Robust is_active handling: checkbox sends '1' or 'on' when checked, nothing when unchecked
    const activeVal = (is_active === '1' || is_active === 'on' || is_active === 1) ? 1 : 0;

    db.prepare(`
      UPDATE products SET title=?, description=?, price=?, old_price=?, discount=?, slug=?, deposit_amount=?, video_filename=?, features=?, is_active=?, main_image=?, show_gallery=?, show_reviews=?, description_images=?, whatsapp_number=?, delivery_fee=?, weight=?, audio_filename=?, audio_autoplay=?, cod_enabled=?, bank_full_enabled=?, bank_deposit_enabled=?, category_id=?, stock_quantity=?, availability_status=?, meta_title=?, meta_description=?, updated_at=datetime('now')
      WHERE id=?
    `).run(title, description || '', parseFloat(price) || 200, parseFloat(old_price) || 0, discount || '', slug, parseFloat(deposit_amount) || 50, videoFilename, features || '[]', activeVal, mainImageFilename, show_gallery === 'on' || show_gallery === '1' ? 1 : 0, show_reviews === 'on' || show_reviews === '1' ? 1 : 0, descriptionImagesJson, whatsapp_number || '', parseFloat(delivery_fee) || 50, parseFloat(weight) || 0, audioFilename, audio_autoplay === '1' ? 1 : 0, cod_enabled === '1' ? 1 : 0, bank_full_enabled === '1' ? 1 : 0, bank_deposit_enabled === '1' ? 1 : 0, category_id ? parseInt(category_id) : null, stock_quantity !== undefined && stock_quantity !== '' ? parseInt(stock_quantity) : -1, availability_status || 'in_stock', meta_title || '', meta_description || '', req.params.id);

    // Insert new gallery images into product_images table
    if (req.files && req.files.gallery_images) {
      // Get current max sort_order
      const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as max_order FROM product_images WHERE product_id = ?').get(req.params.id);
      let sortOrder = (maxOrder ? maxOrder.max_order : -1) + 1;
      req.files.gallery_images.forEach((file) => {
        db.prepare('INSERT INTO product_images (product_id, filename, sort_order) VALUES (?, ?, ?)').run(req.params.id, file.filename, sortOrder++);
      });
    }

    res.redirect('/admin/products/' + req.params.id + '/edit?success=1');
  } catch (err) {
    console.error('Update product error:', err);
    res.redirect('/admin/products/' + req.params.id + '/edit?error=1');
  }
});

// Delete a gallery image (product_images entry)
router.post('/products/:id/delete-image', requireAdmin, (req, res) => {
  const { image_id } = req.body;
  const image = db.prepare('SELECT * FROM product_images WHERE id = ? AND product_id = ?').get(image_id, req.params.id);
  if (image) {
    // Delete file from disk
    const filePath = path.join(__dirname, '..', 'public', 'uploads', 'products', image.filename);
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch(e) {}
    db.prepare('DELETE FROM product_images WHERE id = ?').run(image_id);
  }
  res.redirect('/admin/products/' + req.params.id + '/edit');
});

// Delete a description image
router.post('/products/:id/delete-desc-image', requireAdmin, (req, res) => {
  const { filename } = req.body;
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (product) {
    let descImages = [];
    try { descImages = JSON.parse(product.description_images || '[]'); } catch(e) {}
    descImages = descImages.filter(img => img !== filename);
    db.prepare('UPDATE products SET description_images = ? WHERE id = ?').run(JSON.stringify(descImages), req.params.id);
    // Delete file from disk
    const filePath = path.join(__dirname, '..', 'public', 'uploads', 'products', filename);
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch(e) {}
  }
  res.redirect('/admin/products/' + req.params.id + '/edit');
});

// Add FAQ to product
router.post('/products/:id/faq', requireAdmin, (req, res) => {
  const { question, answer } = req.body;
  if (question && answer) {
    const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as max_order FROM product_faqs WHERE product_id = ?').get(req.params.id);
    const sortOrder = (maxOrder ? maxOrder.max_order : -1) + 1;
    db.prepare('INSERT INTO product_faqs (product_id, question, answer, sort_order) VALUES (?, ?, ?, ?)').run(req.params.id, question, answer, sortOrder);
  }
  res.redirect('/admin/products/' + req.params.id + '/edit');
});

// Update FAQ
router.post('/products/:id/faq/:faqId', requireAdmin, (req, res) => {
  const { question, answer } = req.body;
  db.prepare('UPDATE product_faqs SET question = ?, answer = ? WHERE id = ? AND product_id = ?').run(question, answer, req.params.faqId, req.params.id);
  res.redirect('/admin/products/' + req.params.id + '/edit');
});

// Delete FAQ
router.post('/products/:id/faq/:faqId/delete', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM product_faqs WHERE id = ? AND product_id = ?').run(req.params.faqId, req.params.id);
  res.redirect('/admin/products/' + req.params.id + '/edit');
});

// Add feature to product
router.post('/products/:id/feature', requireAdmin, (req, res) => {
  const { icon, featureTitle, desc } = req.body;
  if (featureTitle) {
    const product = db.prepare('SELECT features FROM products WHERE id = ?').get(req.params.id);
    let features = [];
    try { features = JSON.parse(product.features || '[]'); } catch(e) {}
    features.push({ icon: icon || '', title: featureTitle, desc: desc || '' });
    db.prepare('UPDATE products SET features = ? WHERE id = ?').run(JSON.stringify(features), req.params.id);
  }
  res.redirect('/admin/products/' + req.params.id + '/edit');
});

// Delete feature from product
router.post('/products/:id/feature/:index/delete', requireAdmin, (req, res) => {
  const product = db.prepare('SELECT features FROM products WHERE id = ?').get(req.params.id);
  let features = [];
  try { features = JSON.parse(product.features || '[]'); } catch(e) {}
  const idx = parseInt(req.params.index);
  if (idx >= 0 && idx < features.length) {
    features.splice(idx, 1);
    db.prepare('UPDATE products SET features = ? WHERE id = ?').run(JSON.stringify(features), req.params.id);
  }
  res.redirect('/admin/products/' + req.params.id + '/edit');
});

// Add variation to product
router.post('/products/:id/variation', requireAdmin, variationUpload.single('variation_image'), (req, res) => {
  const { type, label, value, price_adjustment } = req.body;
  if (label) {
    const imageFilename = req.file ? req.file.filename : '';
    const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as max_order FROM product_variations WHERE product_id = ? AND type = ?').get(req.params.id, type);
    const sortOrder = (maxOrder ? maxOrder.max_order : -1) + 1;
    db.prepare('INSERT INTO product_variations (product_id, type, label, value, image_filename, price_adjustment, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)').run(req.params.id, type, label, value || '', imageFilename, parseFloat(price_adjustment) || 0, sortOrder);
  }
  res.redirect('/admin/products/' + req.params.id + '/edit');
});

// Delete variation from product
router.post('/products/:id/variation/:varId/delete', requireAdmin, (req, res) => {
  const variation = db.prepare('SELECT * FROM product_variations WHERE id = ? AND product_id = ?').get(req.params.varId, req.params.id);
  if (variation) {
    if (variation.image_filename) {
      const filePath = path.join(__dirname, '..', 'public', 'uploads', 'variations', variation.image_filename);
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch(e) {}
    }
    db.prepare('DELETE FROM product_variations WHERE id = ?').run(req.params.varId);
  }
  res.redirect('/admin/products/' + req.params.id + '/edit');
});

// Delete product
// Duplicate product
router.post('/products/:id/duplicate', requireAdmin, (req, res) => {
  try {
    const src = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!src) return res.redirect('/admin/products');

    const newSlug = src.slug + '-copy-' + Date.now();
    const newTitle = src.title + ' (نسخة)';

    const result = db.prepare(`
      INSERT INTO products (title, description, price, old_price, discount, slug, deposit_amount, video_filename, features, main_image, show_gallery, description_images, whatsapp_number, delivery_fee, weight, audio_filename, audio_autoplay, cod_enabled, bank_full_enabled, bank_deposit_enabled, category_id, stock_quantity, availability_status, meta_title, meta_description, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(newTitle, src.description, src.price, src.old_price, src.discount, newSlug, src.deposit_amount, src.video_filename, src.features, src.main_image, src.show_gallery, src.description_images, src.whatsapp_number, src.delivery_fee, src.weight, src.audio_filename, src.audio_autoplay, src.cod_enabled, src.bank_full_enabled, src.bank_deposit_enabled, src.category_id, src.stock_quantity, src.availability_status, src.meta_title, src.meta_description);

    const newId = result.lastInsertRowid;

    // Duplicate gallery images
    const images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order').all(req.params.id);
    images.forEach(img => {
      db.prepare('INSERT INTO product_images (product_id, filename, sort_order) VALUES (?, ?, ?)').run(newId, img.filename, img.sort_order);
    });

    // Duplicate FAQs
    const faqs = db.prepare('SELECT * FROM product_faqs WHERE product_id = ? ORDER BY sort_order').all(req.params.id);
    faqs.forEach(faq => {
      db.prepare('INSERT INTO product_faqs (product_id, question, answer, sort_order) VALUES (?, ?, ?, ?)').run(newId, faq.question, faq.answer, faq.sort_order);
    });

    // Duplicate variations
    const vars = db.prepare('SELECT * FROM product_variations WHERE product_id = ? ORDER BY sort_order').all(req.params.id);
    vars.forEach(v => {
      db.prepare('INSERT INTO product_variations (product_id, type, label, value, image_filename, price_adjustment, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(newId, v.type, v.label, v.value, v.image_filename, v.price_adjustment, v.sort_order, v.is_active);
    });

    res.redirect('/admin/products/' + newId + '/edit?success=1');
  } catch (err) {
    console.error('Duplicate product error:', err);
    res.redirect('/admin/products');
  }
});

router.post('/products/:id/delete', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.redirect('/admin/products');
});

// ============================================================
// ORDERS
// ============================================================

// Orders list
router.get('/orders', requireAdmin, (req, res) => {
  const status = req.query.status || '';
  let query = `SELECT o.*, p.title as product_title FROM orders o LEFT JOIN products p ON o.product_id = p.id`;
  const params = [];

  if (status) {
    query += ' WHERE o.status = ?';
    params.push(status);
  }
  query += ' ORDER BY o.created_at DESC';

  const orders = db.prepare(query).all(...params);
  res.render('admin/orders', { orders, currentStatus: status });
});

// Order detail
router.get('/orders/:id', requireAdmin, (req, res) => {
  const order = db.prepare(`
    SELECT o.*, p.title as product_title
    FROM orders o LEFT JOIN products p ON o.product_id = p.id
    WHERE o.id = ?
  `).get(req.params.id);
  if (!order) return res.redirect('/admin/orders');
  res.render('admin/order-detail', { order });
});

// Update order status
router.post('/orders/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);

  // Update referral commissions when order is delivered
  if (status === 'delivered') {
    db.prepare("UPDATE referral_commissions SET status = 'confirmed' WHERE order_id = ?").run(req.params.id);
  }
  // If order is cancelled, cancel commissions and reverse affiliate balance
  if (status === 'cancelled') {
    try {
      const commissions = db.prepare("SELECT * FROM referral_commissions WHERE order_id = ? AND status = 'pending'").all(req.params.id);
      commissions.forEach(c => {
        db.prepare('UPDATE users SET total_earned = total_earned - ?, available_balance = available_balance - ? WHERE id = ?').run(c.commission_amount, c.commission_amount, c.user_id);
      });
    } catch(e) {
      console.error('Commission reversal error:', e);
    }
    db.prepare("UPDATE referral_commissions SET status = 'cancelled' WHERE order_id = ?").run(req.params.id);
  }

  res.redirect('/admin/orders/' + req.params.id);
});

// Delete order
router.post('/orders/:id/delete', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  res.redirect('/admin/orders');
});

// ============================================================
// REVIEWS
// ============================================================

// Reviews list
router.get('/reviews', requireAdmin, (req, res) => {
  const status = req.query.status || '';
  let query = `SELECT r.*, p.title as product_title FROM reviews r LEFT JOIN products p ON r.product_id = p.id`;
  const params = [];

  if (status) {
    query += ' WHERE r.status = ?';
    params.push(status);
  }
  query += ' ORDER BY r.created_at DESC';

  const reviews = db.prepare(query).all(...params);
  const products = db.prepare('SELECT id, title FROM products ORDER BY title').all();
  res.render('admin/reviews', { reviews, currentStatus: status, products });
});

// Admin: Create review manually (all fields optional)
router.post('/reviews', requireAdmin, adminReviewUpload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]), (req, res) => {
  const { product_id, name, phone, rating, message } = req.body;
  if (!product_id) return res.redirect('/admin/reviews');
  const imageFile = req.files && req.files.image ? req.files.image[0].filename : '';
  const audioFile = req.files && req.files.audio ? req.files.audio[0].filename : '';
  db.prepare('INSERT INTO reviews (product_id, name, phone, rating, message, image_filename, audio_filename, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    parseInt(product_id), name || '', phone || '', parseInt(rating) || 5, message || '', imageFile, audioFile, 'approved'
  );
  res.redirect('/admin/reviews');
});

// Approve review
router.post('/reviews/:id/approve', requireAdmin, (req, res) => {
  db.prepare("UPDATE reviews SET status = 'approved' WHERE id = ?").run(req.params.id);
  res.redirect('/admin/reviews?status=pending');
});

// Reject review
router.post('/reviews/:id/reject', requireAdmin, (req, res) => {
  db.prepare("UPDATE reviews SET status = 'rejected' WHERE id = ?").run(req.params.id);
  res.redirect('/admin/reviews?status=pending');
});

// Delete review
router.post('/reviews/:id/delete', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
  res.redirect('/admin/reviews');
});

// ============================================================
// BANK TRANSFER SETTINGS
// ============================================================

router.get('/settings/bank', requireAdmin, (req, res) => {
  const banks = db.prepare('SELECT * FROM bank_transfer_settings ORDER BY sort_order, id').all();
  res.render('admin/bank-settings', { banks });
});

router.post('/settings/bank', requireAdmin, (req, res) => {
  const { bank_name, account_holder, rib } = req.body;
  if (bank_name && account_holder && rib) {
    const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as max_order FROM bank_transfer_settings').get();
    const sortOrder = (maxOrder ? maxOrder.max_order : -1) + 1;
    db.prepare('INSERT INTO bank_transfer_settings (bank_name, account_holder, rib, sort_order) VALUES (?, ?, ?, ?)').run(bank_name, account_holder, rib, sortOrder);
  }
  res.redirect('/admin/settings/bank');
});

router.post('/settings/bank/:id/update', requireAdmin, (req, res) => {
  const { bank_name, account_holder, rib, is_active } = req.body;
  db.prepare('UPDATE bank_transfer_settings SET bank_name=?, account_holder=?, rib=?, is_active=? WHERE id=?').run(bank_name, account_holder, rib, is_active === '1' ? 1 : 0, req.params.id);
  res.redirect('/admin/settings/bank');
});

router.post('/settings/bank/:id/delete', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM bank_transfer_settings WHERE id = ?').run(req.params.id);
  res.redirect('/admin/settings/bank');
});

// ============================================================
// GIFT PRODUCTS
// ============================================================

router.get('/gifts', requireAdmin, (req, res) => {
  const gifts = db.prepare('SELECT * FROM gift_products ORDER BY sort_order, id').all();
  res.render('admin/gifts', { gifts });
});

router.post('/gifts', requireAdmin, giftUpload.single('image'), (req, res) => {
  const { name, description, min_order_amount, min_quantity, is_active } = req.body;
  const imageFilename = req.file ? req.file.filename : '';
  if (name) {
    const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as max_order FROM gift_products').get();
    const sortOrder = (maxOrder ? maxOrder.max_order : -1) + 1;
    db.prepare('INSERT INTO gift_products (name, description, image_filename, min_order_amount, min_quantity, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)').run(name, description || '', imageFilename, parseFloat(min_order_amount) || 0, parseInt(min_quantity) || 0, is_active === '1' ? 1 : 0, sortOrder);
  }
  res.redirect('/admin/gifts');
});

router.post('/gifts/:id/update', requireAdmin, giftUpload.single('image'), (req, res) => {
  const { name, description, min_order_amount, min_quantity, is_active } = req.body;
  const gift = db.prepare('SELECT * FROM gift_products WHERE id = ?').get(req.params.id);
  if (!gift) return res.redirect('/admin/gifts');
  const imageFilename = req.file ? req.file.filename : gift.image_filename;
  db.prepare('UPDATE gift_products SET name=?, description=?, image_filename=?, min_order_amount=?, min_quantity=?, is_active=? WHERE id=?').run(name, description || '', imageFilename, parseFloat(min_order_amount) || 0, parseInt(min_quantity) || 0, is_active === '1' ? 1 : 0, req.params.id);
  res.redirect('/admin/gifts');
});

router.post('/gifts/:id/delete', requireAdmin, (req, res) => {
  const gift = db.prepare('SELECT * FROM gift_products WHERE id = ?').get(req.params.id);
  if (gift && gift.image_filename) {
    const filePath = path.join(__dirname, '..', 'public', 'uploads', 'gifts', gift.image_filename);
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch(e) {}
  }
  db.prepare('DELETE FROM gift_products WHERE id = ?').run(req.params.id);
  res.redirect('/admin/gifts');
});

// ============================================================
// HOME SLIDERS
// ============================================================

router.get('/sliders', requireAdmin, (req, res) => {
  const sliders = db.prepare('SELECT * FROM home_sliders ORDER BY sort_order, id').all();
  res.render('admin/sliders', { sliders });
});

router.post('/sliders', requireAdmin, sliderUpload.single('image'), (req, res) => {
  const { title, link_url, is_active, sort_order } = req.body;
  const imageFilename = req.file ? req.file.filename : '';
  if (imageFilename) {
    db.prepare('INSERT INTO home_sliders (title, image_filename, link_url, is_active, sort_order) VALUES (?, ?, ?, ?, ?)').run(title || '', imageFilename, link_url || '', is_active === '1' ? 1 : 0, parseInt(sort_order) || 0);
  }
  res.redirect('/admin/sliders');
});

router.post('/sliders/:id/update', requireAdmin, sliderUpload.single('image'), (req, res) => {
  const { title, link_url, is_active, sort_order } = req.body;
  const slider = db.prepare('SELECT * FROM home_sliders WHERE id = ?').get(req.params.id);
  if (!slider) return res.redirect('/admin/sliders');
  const imageFilename = req.file ? req.file.filename : slider.image_filename;
  db.prepare('UPDATE home_sliders SET title=?, image_filename=?, link_url=?, is_active=?, sort_order=? WHERE id=?').run(title || '', imageFilename, link_url || '', is_active === '1' ? 1 : 0, parseInt(sort_order) || 0, req.params.id);
  res.redirect('/admin/sliders');
});

router.post('/sliders/:id/delete', requireAdmin, (req, res) => {
  const slider = db.prepare('SELECT * FROM home_sliders WHERE id = ?').get(req.params.id);
  if (slider && slider.image_filename) {
    const filePath = path.join(__dirname, '..', 'public', 'uploads', 'sliders', slider.image_filename);
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch(e) {}
  }
  db.prepare('DELETE FROM home_sliders WHERE id = ?').run(req.params.id);
  res.redirect('/admin/sliders');
});

// ============================================================
// LANDING PAGES
// ============================================================

// List landing pages
router.get('/landing-pages', requireAdmin, (req, res) => {
  const pages = db.prepare(`
    SELECT lp.*, p.title as product_title,
      (SELECT COUNT(*) FROM orders o WHERE o.product_id = lp.product_id) as order_count
    FROM landing_pages lp LEFT JOIN products p ON lp.product_id = p.id
    ORDER BY lp.created_at DESC
  `).all();
  res.render('admin/landing-pages', { pages });
});

// New landing page form
router.get('/landing-pages/new', requireAdmin, (req, res) => {
  const products = db.prepare('SELECT id, title FROM products ORDER BY title').all();
  res.render('admin/landing-page-form', { page: null, sections: [], products });
});

// Create landing page
router.post('/landing-pages', requireAdmin, (req, res) => {
  const { title, slug, product_id, payment_type, is_published, hide_header, show_reviews } = req.body;
  const finalSlug = slug || title.toLowerCase().replace(/[^\w\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '') || 'page-' + Date.now();
  try {
    db.prepare('INSERT INTO landing_pages (title, slug, product_id, payment_type, is_published, hide_header, show_reviews) VALUES (?, ?, ?, ?, ?, ?, ?)').run(title, finalSlug, product_id ? parseInt(product_id) : null, payment_type || 'bank', is_published === '1' ? 1 : 0, hide_header === '1' ? 1 : 0, show_reviews === '1' ? 1 : 0);
    res.redirect('/admin/landing-pages');
  } catch(err) {
    console.error('Create landing page error:', err);
    res.redirect('/admin/landing-pages/new');
  }
});

// Edit landing page form
router.get('/landing-pages/:id/edit', requireAdmin, (req, res) => {
  const page = db.prepare('SELECT * FROM landing_pages WHERE id = ?').get(req.params.id);
  if (!page) return res.redirect('/admin/landing-pages');
  const sections = db.prepare('SELECT * FROM landing_page_sections WHERE landing_page_id = ? ORDER BY sort_order').all(page.id);
  const products = db.prepare('SELECT id, title FROM products ORDER BY title').all();
  res.render('admin/landing-page-form', { page, sections, products });
});

// Update landing page
router.post('/landing-pages/:id', requireAdmin, (req, res) => {
  const { title, slug, product_id, payment_type, is_published, hide_header, show_reviews } = req.body;
  db.prepare('UPDATE landing_pages SET title=?, slug=?, product_id=?, payment_type=?, is_published=?, hide_header=?, show_reviews=?, updated_at=datetime(\'now\') WHERE id=?').run(title, slug, product_id ? parseInt(product_id) : null, payment_type || 'bank', is_published === '1' ? 1 : 0, hide_header === '1' ? 1 : 0, show_reviews === '1' ? 1 : 0, req.params.id);
  res.redirect('/admin/landing-pages/' + req.params.id + '/edit');
});

// Add section to landing page
router.post('/landing-pages/:id/section', requireAdmin, landingUpload.single('media'), (req, res) => {
  const { section_type, title, content, button_type, button_color, button_size, video_url, autoplay, loop_video, muted, full_width } = req.body;
  const mediaFilename = req.file ? req.file.filename : '';
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as max_order FROM landing_page_sections WHERE landing_page_id = ?').get(req.params.id);
  const sortOrder = (maxOrder ? maxOrder.max_order : -1) + 1;
  db.prepare('INSERT INTO landing_page_sections (landing_page_id, section_type, title, content, media_filename, sort_order, button_type, button_color, button_size, video_url, autoplay, loop_video, muted, full_width) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    req.params.id, section_type || 'text', title || '', content || '', mediaFilename, sortOrder,
    button_type || '', button_color || '', button_size || 'medium', video_url || '',
    autoplay === '1' ? 1 : 0, loop_video === '1' ? 1 : 0, muted === '1' ? 1 : 0, full_width === '1' ? 1 : 0
  );
  res.redirect('/admin/landing-pages/' + req.params.id + '/edit');
});

// Update section order
router.post('/landing-pages/:id/section/:sectionId/move', requireAdmin, (req, res) => {
  const { direction } = req.body;
  const sections = db.prepare('SELECT * FROM landing_page_sections WHERE landing_page_id = ? ORDER BY sort_order').all(req.params.id);
  const idx = sections.findIndex(s => s.id == req.params.sectionId);
  if (idx >= 0) {
    if (direction === 'up' && idx > 0) {
      db.prepare('UPDATE landing_page_sections SET sort_order = ? WHERE id = ?').run(sections[idx - 1].sort_order, sections[idx].id);
      db.prepare('UPDATE landing_page_sections SET sort_order = ? WHERE id = ?').run(sections[idx].sort_order, sections[idx - 1].id);
    } else if (direction === 'down' && idx < sections.length - 1) {
      db.prepare('UPDATE landing_page_sections SET sort_order = ? WHERE id = ?').run(sections[idx + 1].sort_order, sections[idx].id);
      db.prepare('UPDATE landing_page_sections SET sort_order = ? WHERE id = ?').run(sections[idx].sort_order, sections[idx + 1].id);
    }
  }
  res.redirect('/admin/landing-pages/' + req.params.id + '/edit');
});

// API: Reorder sections via drag & drop (JSON body)
router.post('/landing-pages/:id/sections/reorder', requireAdmin, (req, res) => {
  try {
    const { order } = req.body; // array of section IDs in new order
    if (Array.isArray(order)) {
      order.forEach((sectionId, idx) => {
        db.prepare('UPDATE landing_page_sections SET sort_order = ? WHERE id = ? AND landing_page_id = ?').run(idx, sectionId, req.params.id);
      });
    }
    res.json({ success: true });
  } catch(err) {
    console.error('Reorder error:', err);
    res.json({ success: false, error: err.message });
  }
});

// Edit section
router.post('/landing-pages/:id/section/:sectionId/edit', requireAdmin, landingUpload.single('media'), (req, res) => {
  const { title, content, button_type, button_color, button_size, video_url, autoplay, loop_video, muted, full_width } = req.body;
  const section = db.prepare('SELECT * FROM landing_page_sections WHERE id = ? AND landing_page_id = ?').get(req.params.sectionId, req.params.id);
  if (!section) return res.redirect('/admin/landing-pages/' + req.params.id + '/edit');

  const mediaFilename = req.file ? req.file.filename : section.media_filename;
  // If new media uploaded, delete old one
  if (req.file && section.media_filename) {
    const oldPath = path.join(__dirname, '..', 'public', 'uploads', 'landing-pages', section.media_filename);
    try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch(e) {}
  }

  db.prepare('UPDATE landing_page_sections SET title=?, content=?, media_filename=?, button_type=?, button_color=?, button_size=?, video_url=?, autoplay=?, loop_video=?, muted=?, full_width=? WHERE id=? AND landing_page_id=?').run(
    title || '', content || '', mediaFilename, button_type || '', button_color || '', button_size || 'medium', video_url || '',
    autoplay === '1' ? 1 : 0, loop_video === '1' ? 1 : 0, muted === '1' ? 1 : 0, full_width === '1' ? 1 : 0,
    req.params.sectionId, req.params.id
  );
  res.redirect('/admin/landing-pages/' + req.params.id + '/edit');
});

// Upload background audio for landing page
router.post('/landing-pages/:id/bg-audio', requireAdmin, landingUpload.single('media'), (req, res) => {
  const { bg_audio_enabled } = req.body;
  const page = db.prepare('SELECT * FROM landing_pages WHERE id = ?').get(req.params.id);
  if (!page) return res.redirect('/admin/landing-pages');

  if (req.file) {
    // Delete old audio if exists
    if (page.bg_audio_filename) {
      const oldPath = path.join(__dirname, '..', 'public', 'uploads', 'landing-pages', page.bg_audio_filename);
      try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch(e) {}
    }
    db.prepare('UPDATE landing_pages SET bg_audio_filename=?, bg_audio_enabled=? WHERE id=?').run(req.file.filename, bg_audio_enabled === '1' ? 1 : 0, req.params.id);
  } else {
    db.prepare('UPDATE landing_pages SET bg_audio_enabled=? WHERE id=?').run(bg_audio_enabled === '1' ? 1 : 0, req.params.id);
  }
  res.redirect('/admin/landing-pages/' + req.params.id + '/edit');
});

// Delete section
router.post('/landing-pages/:id/section/:sectionId/delete', requireAdmin, (req, res) => {
  const section = db.prepare('SELECT * FROM landing_page_sections WHERE id = ? AND landing_page_id = ?').get(req.params.sectionId, req.params.id);
  if (section && section.media_filename) {
    const filePath = path.join(__dirname, '..', 'public', 'uploads', 'landing-pages', section.media_filename);
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch(e) {}
  }
  db.prepare('DELETE FROM landing_page_sections WHERE id = ? AND landing_page_id = ?').run(req.params.sectionId, req.params.id);
  res.redirect('/admin/landing-pages/' + req.params.id + '/edit');
});

// Delete landing page
router.post('/landing-pages/:id/delete', requireAdmin, (req, res) => {
  // Delete associated section files
  const sections = db.prepare('SELECT * FROM landing_page_sections WHERE landing_page_id = ?').all(req.params.id);
  sections.forEach(s => {
    if (s.media_filename) {
      const filePath = path.join(__dirname, '..', 'public', 'uploads', 'landing-pages', s.media_filename);
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch(e) {}
    }
  });
  db.prepare('DELETE FROM landing_pages WHERE id = ?').run(req.params.id);
  res.redirect('/admin/landing-pages');
});

// ============================================================
// USERS / AFFILIATES
// ============================================================

router.get('/users', requireAdmin, (req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  res.render('admin/users', { users });
});

router.get('/users/new', requireAdmin, (req, res) => {
  res.render('admin/user-form', { user: null });
});

router.post('/users', requireAdmin, (req, res) => {
  const { full_name, username, phone, password, commission_rate } = req.body;
  if (!full_name || !username || !password) return res.redirect('/admin/users/new');
  const hash = bcrypt.hashSync(password, 10);
  const referralCode = username.toUpperCase().substring(0, 4) + Math.random().toString(36).substring(2, 6).toUpperCase();
  try {
    db.prepare('INSERT INTO users (full_name, username, phone, password_hash, referral_code, commission_rate) VALUES (?, ?, ?, ?, ?, ?)').run(full_name, username, phone || '', hash, referralCode, parseFloat(commission_rate) || 10);
    res.redirect('/admin/users');
  } catch(err) {
    console.error('Create user error:', err);
    res.redirect('/admin/users/new');
  }
});

router.get('/users/:id/edit', requireAdmin, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.redirect('/admin/users');
  res.render('admin/user-form', { user });
});

router.post('/users/:id', requireAdmin, (req, res) => {
  const { full_name, phone, commission_rate, is_active, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.redirect('/admin/users');

  if (password && password.trim()) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET full_name=?, phone=?, commission_rate=?, is_active=?, password_hash=?, updated_at=datetime(\'now\') WHERE id=?').run(full_name, phone || '', parseFloat(commission_rate) || 10, is_active === '1' ? 1 : 0, hash, req.params.id);
  } else {
    db.prepare('UPDATE users SET full_name=?, phone=?, commission_rate=?, is_active=?, updated_at=datetime(\'now\') WHERE id=?').run(full_name, phone || '', parseFloat(commission_rate) || 10, is_active === '1' ? 1 : 0, req.params.id);
  }
  res.redirect('/admin/users');
});

router.get('/users/:id/stats', requireAdmin, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.redirect('/admin/users');
  const commissions = db.prepare(`
    SELECT rc.*, o.order_ref, o.full_name as customer_name
    FROM referral_commissions rc
    LEFT JOIN orders o ON rc.order_id = o.id
    WHERE rc.user_id = ?
    ORDER BY rc.created_at DESC
  `).all(req.params.id);
  const totalEarned = db.prepare('SELECT COALESCE(SUM(commission_amount), 0) as total FROM referral_commissions WHERE user_id = ?').get(req.params.id).total;
  const totalOrders = db.prepare('SELECT COUNT(*) as c FROM referral_commissions WHERE user_id = ?').get(req.params.id).c;
  res.render('admin/user-form', { user, commissions, totalEarned, totalOrders, viewStats: true });
});

router.post('/users/:id/delete', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.redirect('/admin/users');
});

// ============================================================
// WITHDRAWAL REQUESTS
// ============================================================

router.get('/withdrawals', requireAdmin, (req, res) => {
  const status = req.query.status || '';
  let query = `SELECT w.*, u.full_name, u.username, u.phone as user_phone FROM withdrawal_requests w LEFT JOIN users u ON w.user_id = u.id`;
  const params = [];
  if (status) {
    query += ' WHERE w.status = ?';
    params.push(status);
  }
  query += ' ORDER BY w.created_at DESC';
  const withdrawals = db.prepare(query).all(...params);
  res.render('admin/withdrawals', { withdrawals, currentStatus: status });
});

router.post('/withdrawals/:id/approve', requireAdmin, (req, res) => {
  const withdrawal = db.prepare('SELECT * FROM withdrawal_requests WHERE id = ?').get(req.params.id);
  if (withdrawal && withdrawal.status === 'pending') {
    db.prepare("UPDATE withdrawal_requests SET status = 'approved', processed_at = datetime('now') WHERE id = ?").run(req.params.id);
    // Update user balance
    db.prepare('UPDATE users SET total_withdrawn = total_withdrawn + ?, available_balance = available_balance - ? WHERE id = ?').run(withdrawal.amount, withdrawal.amount, withdrawal.user_id);
  }
  res.redirect('/admin/withdrawals');
});

router.post('/withdrawals/:id/reject', requireAdmin, (req, res) => {
  const { admin_notes } = req.body;
  const withdrawal = db.prepare('SELECT * FROM withdrawal_requests WHERE id = ?').get(req.params.id);
  if (withdrawal && withdrawal.status === 'pending') {
    db.prepare("UPDATE withdrawal_requests SET status = 'rejected', admin_notes = ?, processed_at = datetime('now') WHERE id = ?").run(admin_notes || '', req.params.id);
  }
  res.redirect('/admin/withdrawals');
});

// ============================================================
// ADMIN SETTINGS
// ============================================================

router.get('/settings', requireAdmin, (req, res) => {
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.session.admin.id);
  const settings = {};
  const rows = db.prepare('SELECT * FROM admin_settings').all();
  rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
  const primaryColor = settings.primary_color || '#8B6F47';
  res.render('admin/settings', { admin, settings, primaryColor, success: req.query.success, error: req.query.error });
});

router.post('/settings/profile', requireAdmin, (req, res) => {
  const { email, current_password, new_password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.session.admin.id);

  // Update email
  if (email !== undefined) {
    db.prepare('UPDATE admins SET email = ? WHERE id = ?').run(email, admin.id);
  }

  // Update password if provided
  if (new_password && new_password.trim()) {
    if (!current_password || !bcrypt.compareSync(current_password, admin.password_hash)) {
      return res.redirect('/admin/settings?error=كلمة المرور الحالية غير صحيحة');
    }
    const hash = bcrypt.hashSync(new_password, 10);
    db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(hash, admin.id);
  }

  res.redirect('/admin/settings?success=تم تحديث البيانات بنجاح');
});

router.post('/settings/typography', requireAdmin, (req, res) => {
  const { font_family, custom_font_url } = req.body;
  // Upsert font_family
  const existingFont = db.prepare("SELECT * FROM admin_settings WHERE setting_key = 'font_family'").get();
  if (existingFont) {
    db.prepare("UPDATE admin_settings SET setting_value = ?, updated_at = datetime('now') WHERE setting_key = 'font_family'").run(font_family || 'Cairo');
  } else {
    db.prepare("INSERT INTO admin_settings (setting_key, setting_value) VALUES ('font_family', ?)").run(font_family || 'Cairo');
  }
  // Upsert custom_font_url
  const existingUrl = db.prepare("SELECT * FROM admin_settings WHERE setting_key = 'custom_font_url'").get();
  if (existingUrl) {
    db.prepare("UPDATE admin_settings SET setting_value = ?, updated_at = datetime('now') WHERE setting_key = 'custom_font_url'").run(custom_font_url || '');
  } else {
    db.prepare("INSERT INTO admin_settings (setting_key, setting_value) VALUES ('custom_font_url', ?)").run(custom_font_url || '');
  }
  res.redirect('/admin/settings?success=تم تحديث اعدادات الخط');
});

// Feedback homepage settings
router.post('/settings/feedback', requireAdmin, (req, res) => {
  const feedbackCount = req.body.homepage_feedback_count || '6';
  const showSection = req.body.show_feedback_section ? '1' : '0';

  const keys = [
    ['homepage_feedback_count', feedbackCount],
    ['show_feedback_section', showSection]
  ];

  keys.forEach(([key, val]) => {
    const existing = db.prepare('SELECT * FROM admin_settings WHERE setting_key = ?').get(key);
    if (existing) {
      db.prepare("UPDATE admin_settings SET setting_value = ?, updated_at = datetime('now') WHERE setting_key = ?").run(val, key);
    } else {
      db.prepare('INSERT INTO admin_settings (setting_key, setting_value) VALUES (?, ?)').run(key, val);
    }
  });

  res.redirect('/admin/settings?success=تم تحديث اعدادات Feedback');
});

router.post('/settings/theme', requireAdmin, (req, res) => {
  const colorKeys = [
    ['primary_color', req.body.primary_color || req.body.primary_color_text || '#000000'],
    ['secondary_color', req.body.secondary_color || '#333333'],
    ['button_color', req.body.button_color || '#000000'],
    ['button_text_color', req.body.button_text_color || '#FFFFFF'],
    ['text_color', req.body.text_color || '#2C1810'],
    ['bg_color', req.body.bg_color || '#FFFFFF'],
    ['header_bg_color', req.body.header_bg_color || '#FFFFFF'],
    ['header_text_color', req.body.header_text_color || '#000000'],
    ['footer_bg_color', req.body.footer_bg_color || '#1a1a1a'],
    ['footer_text_color', req.body.footer_text_color || '#FFFFFF'],
    ['border_color', req.body.border_color || '#000000'],
    ['slider_arrow_color', req.body.slider_arrow_color || '#333333'],
    ['slider_arrow_bg_color', req.body.slider_arrow_bg_color_text || req.body.slider_arrow_bg_color || 'rgba(255,255,255,0.9)'],
  ];
  colorKeys.forEach(([key, value]) => {
    const existing = db.prepare("SELECT 1 FROM admin_settings WHERE setting_key = ?").get(key);
    if (existing) {
      db.prepare("UPDATE admin_settings SET setting_value = ?, updated_at = datetime('now') WHERE setting_key = ?").run(value, key);
    } else {
      db.prepare("INSERT INTO admin_settings (setting_key, setting_value) VALUES (?, ?)").run(key, value);
    }
  });
  res.redirect('/admin/settings?success=تم تحديث تصميم الموقع بنجاح');
});

router.post('/settings/site', requireAdmin, (req, res) => {
  const { site_name } = req.body;
  if (site_name) {
    const existing = db.prepare("SELECT * FROM admin_settings WHERE setting_key = 'site_name'").get();
    if (existing) {
      db.prepare("UPDATE admin_settings SET setting_value = ?, updated_at = datetime('now') WHERE setting_key = 'site_name'").run(site_name);
    } else {
      db.prepare("INSERT INTO admin_settings (setting_key, setting_value) VALUES ('site_name', ?)").run(site_name);
    }
  }
  res.redirect('/admin/settings?success=تم تحديث اعدادات الموقع');
});

// Language Settings
router.post('/settings/language', requireAdmin, (req, res) => {
  const { site_language } = req.body;
  if (['ar', 'fr', 'both'].includes(site_language)) {
    upsertSetting('site_language', site_language);
  }
  res.redirect('/admin/settings?success=تم تحديث لغة المتجر');
});

// Cart Mode Settings
router.post('/settings/cart-mode', requireAdmin, (req, res) => {
  const { cart_mode } = req.body;
  if (['drawer', 'redirect', 'disabled'].includes(cart_mode)) {
    upsertSetting('cart_mode', cart_mode);
  }
  res.redirect('/admin/settings?success=تم تحديث وضع السلة');
});

router.post('/settings/checkout-description', requireAdmin, (req, res) => {
  const { checkout_description } = req.body;
  upsertSetting('checkout_description', checkout_description || '');
  res.redirect('/admin/settings?success=تم+الحفظ');
});

// Helper to upsert admin_settings
function upsertSetting(key, value) {
  const existing = db.prepare("SELECT 1 FROM admin_settings WHERE setting_key = ?").get(key);
  if (existing) {
    db.prepare("UPDATE admin_settings SET setting_value = ?, updated_at = datetime('now') WHERE setting_key = ?").run(value, key);
  } else {
    db.prepare("INSERT INTO admin_settings (setting_key, setting_value) VALUES (?, ?)").run(key, value);
  }
}

// SEO Settings (meta title, meta description)
router.post('/settings/seo', requireAdmin, (req, res) => {
  const { meta_title, meta_description } = req.body;
  upsertSetting('meta_title', meta_title || '');
  upsertSetting('meta_description', meta_description || '');
  res.redirect('/admin/settings?success=تم تحديث اعدادات SEO');
});

// OG Image upload
router.post('/settings/og-image', requireAdmin, settingsUpload.single('og_image'), (req, res) => {
  if (req.file) {
    upsertSetting('og_image', req.file.filename);
  }
  res.redirect('/admin/settings?success=تم رفع صورة المشاركة');
});

// Favicon upload
router.post('/settings/favicon', requireAdmin, settingsUpload.single('favicon'), (req, res) => {
  if (req.file) {
    upsertSetting('favicon', req.file.filename);
  }
  res.redirect('/admin/settings?success=تم رفع أيقونة المتجر');
});

// Logo upload (now redirects to Design panel)
const logoUpload = multer({ storage: settingsStorage, limits: { fileSize: 10 * 1024 * 1024 } });
router.post('/settings/logo', requireAdmin, logoUpload.fields([
  { name: 'desktop_logo', maxCount: 1 },
  { name: 'mobile_logo', maxCount: 1 }
]), (req, res) => {
  if (req.files && req.files.desktop_logo && req.files.desktop_logo[0]) {
    upsertSetting('desktop_logo', req.files.desktop_logo[0].filename);
  }
  if (req.files && req.files.mobile_logo && req.files.mobile_logo[0]) {
    upsertSetting('mobile_logo', req.files.mobile_logo[0].filename);
  }
  if (req.body.logo_size) {
    upsertSetting('logo_size', req.body.logo_size);
  }
  const redirectTo = req.body._redirect || '/admin/collections';
  res.redirect(redirectTo);
});

// Logo size + categories position (AJAX)
router.post('/settings/design-extras', requireAdmin, (req, res) => {
  const { logo_size, categories_position } = req.body;
  if (logo_size) upsertSetting('logo_size', logo_size);
  if (categories_position) upsertSetting('categories_position', categories_position);
  res.json({ success: true });
});

// Categories visibility toggle (AJAX)
router.post('/settings/categories-visibility', requireAdmin, (req, res) => {
  const { hidden } = req.body;
  upsertSetting('categories_hidden', hidden ? '1' : '');
  res.json({ success: true });
});

// Tracking Pixels (GA, FB, TikTok) + custom meta tags
router.post('/settings/tracking', requireAdmin, (req, res) => {
  const { ga_id, fb_pixel_id, tiktok_pixel_id, custom_meta_tags } = req.body;
  upsertSetting('ga_id', ga_id || '');
  upsertSetting('fb_pixel_id', fb_pixel_id || '');
  upsertSetting('tiktok_pixel_id', tiktok_pixel_id || '');
  upsertSetting('custom_meta_tags', custom_meta_tags || '');
  res.redirect('/admin/settings?success=تم تحديث اعدادات التتبع');
});

// ============================================================
// BANNERS
// ============================================================

router.get('/banners', requireAdmin, (req, res) => {
  const banners = db.prepare('SELECT * FROM banners ORDER BY sort_order, id').all();
  const bannerInterval = db.prepare("SELECT setting_value FROM admin_settings WHERE setting_key = 'banner_interval'").get();
  res.render('admin/banners', { banners, bannerInterval: bannerInterval ? bannerInterval.setting_value : '4' });
});

router.post('/banners', requireAdmin, bannerUpload.fields([
  { name: 'desktop_image', maxCount: 1 },
  { name: 'mobile_image', maxCount: 1 }
]), (req, res) => {
  const { link_url, is_active, sort_order } = req.body;
  const desktopImage = req.files && req.files.desktop_image ? req.files.desktop_image[0].filename : '';
  const mobileImage = req.files && req.files.mobile_image ? req.files.mobile_image[0].filename : '';
  if (desktopImage) {
    db.prepare('INSERT INTO banners (desktop_image, mobile_image, link_url, is_active, sort_order) VALUES (?, ?, ?, ?, ?)').run(
      desktopImage, mobileImage, link_url || '', is_active === '1' ? 1 : 0, parseInt(sort_order) || 0
    );
  }
  res.redirect('/admin/banners');
});

router.post('/banners/:id/update', requireAdmin, bannerUpload.fields([
  { name: 'desktop_image', maxCount: 1 },
  { name: 'mobile_image', maxCount: 1 }
]), (req, res) => {
  const { link_url, is_active, sort_order } = req.body;
  const banner = db.prepare('SELECT * FROM banners WHERE id = ?').get(req.params.id);
  if (!banner) return res.redirect('/admin/banners');
  const desktopImage = req.files && req.files.desktop_image ? req.files.desktop_image[0].filename : banner.desktop_image;
  const mobileImage = req.files && req.files.mobile_image ? req.files.mobile_image[0].filename : banner.mobile_image;
  // Delete old images if replaced
  if (req.files && req.files.desktop_image && banner.desktop_image) {
    const oldPath = path.join(__dirname, '..', 'public', 'uploads', 'banners', banner.desktop_image);
    try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch(e) {}
  }
  if (req.files && req.files.mobile_image && banner.mobile_image) {
    const oldPath = path.join(__dirname, '..', 'public', 'uploads', 'banners', banner.mobile_image);
    try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch(e) {}
  }
  db.prepare('UPDATE banners SET desktop_image=?, mobile_image=?, link_url=?, is_active=?, sort_order=? WHERE id=?').run(
    desktopImage, mobileImage, link_url || '', is_active === '1' ? 1 : 0, parseInt(sort_order) || 0, req.params.id
  );
  res.redirect('/admin/banners');
});

router.post('/banners/:id/toggle', requireAdmin, (req, res) => {
  const banner = db.prepare('SELECT * FROM banners WHERE id = ?').get(req.params.id);
  if (banner) {
    db.prepare('UPDATE banners SET is_active = ? WHERE id = ?').run(banner.is_active ? 0 : 1, req.params.id);
  }
  res.redirect('/admin/banners');
});

router.post('/banners/:id/delete', requireAdmin, (req, res) => {
  const banner = db.prepare('SELECT * FROM banners WHERE id = ?').get(req.params.id);
  if (banner) {
    if (banner.desktop_image) {
      const p1 = path.join(__dirname, '..', 'public', 'uploads', 'banners', banner.desktop_image);
      try { if (fs.existsSync(p1)) fs.unlinkSync(p1); } catch(e) {}
    }
    if (banner.mobile_image) {
      const p2 = path.join(__dirname, '..', 'public', 'uploads', 'banners', banner.mobile_image);
      try { if (fs.existsSync(p2)) fs.unlinkSync(p2); } catch(e) {}
    }
    db.prepare('DELETE FROM banners WHERE id = ?').run(req.params.id);
  }
  res.redirect('/admin/banners');
});

router.post('/banners/interval', requireAdmin, (req, res) => {
  const { banner_interval } = req.body;
  upsertSetting('banner_interval', banner_interval || '4');
  res.redirect('/admin/banners');
});

// ============================================================
// CATEGORIES
// ============================================================

router.get('/categories', requireAdmin, (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order, id').all();
  res.render('admin/categories', { categories });
});

router.post('/categories', requireAdmin, categoryUpload.single('image'), (req, res) => {
  const { name, slug } = req.body;
  if (name && slug) {
    const image = req.file ? req.file.filename : '';
    const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as max_order FROM categories').get();
    db.prepare('INSERT INTO categories (name, slug, image_filename, sort_order) VALUES (?, ?, ?, ?)').run(name, slug, image, (maxOrder.max_order + 1));
  }
  res.redirect('/admin/categories');
});

router.post('/categories/:id/delete', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.redirect('/admin/categories');
});

// ============================================================
// COLLECTIONS MANAGEMENT
// ============================================================

router.get('/collections', requireAdmin, (req, res) => {
  const collections = db.prepare(`
    SELECT c.*, cat.name as category_name
    FROM collections c
    LEFT JOIN categories cat ON c.category_id = cat.id
    ORDER BY c.sort_order
  `).all();
  // Load FAQ items for each FAQ collection, footer columns/links for footer collections
  collections.forEach(col => {
    if (col.section_type === 'faq') {
      try {
        col.faqItems = db.prepare('SELECT * FROM faq_items WHERE collection_id = ? ORDER BY sort_order, id').all(col.id);
      } catch(e) { col.faqItems = []; }
    }
    if (col.section_type === 'footer') {
      try {
        col.footerColumns = db.prepare('SELECT * FROM footer_columns WHERE collection_id = ? ORDER BY sort_order, id').all(col.id);
        col.footerColumns.forEach(fc => {
          fc.links = db.prepare('SELECT * FROM footer_links WHERE column_id = ? ORDER BY sort_order, id').all(fc.id);
        });
        col.footerIcons = db.prepare('SELECT * FROM footer_icons WHERE collection_id = ? ORDER BY sort_order, id').all(col.id);
      } catch(e) { col.footerColumns = []; col.footerIcons = []; }
    }
  });
  const categories = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order').all();
  res.render('admin/collections', { collections, categories });
});

router.post('/collections', requireAdmin, bannerUpload.fields([
  { name: 'banner_desktop_image', maxCount: 1 },
  { name: 'banner_mobile_image', maxCount: 1 }
]), (req, res) => {
  const { name, section_type, category_id, display_mode, grid_columns, grid_product_count, slider_product_count, slider_autoplay, show_title, banner_link_url } = req.body;
  if (!name) return res.redirect('/admin/collections');
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as max_order FROM collections').get();
  const desktopImage = req.files && req.files.banner_desktop_image ? req.files.banner_desktop_image[0].filename : '';
  const mobileImage = req.files && req.files.banner_mobile_image ? req.files.banner_mobile_image[0].filename : '';
  db.prepare(`
    INSERT INTO collections (name, section_type, category_id, display_mode, grid_columns, grid_product_count, slider_product_count, slider_autoplay, show_title, sort_order, banner_desktop_image, banner_mobile_image, banner_link_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    section_type || 'products',
    category_id || null,
    display_mode || 'grid',
    parseInt(grid_columns) || 2,
    parseInt(grid_product_count) || 6,
    parseInt(slider_product_count) || 10,
    slider_autoplay === 'on' || slider_autoplay === '1' ? 1 : 0,
    show_title === 'on' || show_title === '1' ? 1 : 0,
    maxOrder.max_order + 1,
    desktopImage,
    mobileImage,
    banner_link_url || ''
  );
  res.redirect('/admin/collections');
});

router.post('/collections/:id/update', requireAdmin, bannerUpload.fields([
  { name: 'banner_desktop_image', maxCount: 1 },
  { name: 'banner_mobile_image', maxCount: 1 }
]), (req, res) => {
  const { name, section_type, category_id, display_mode, grid_columns, grid_product_count, slider_product_count, slider_autoplay, is_active, show_title, sort_order, banner_link_url, footer_description, footer_description_fr, footer_copyright, footer_copyright_fr, footer_payment_icons } = req.body;
  const existing = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
  if (!existing) return res.redirect('/admin/collections');
  const desktopImage = req.files && req.files.banner_desktop_image ? req.files.banner_desktop_image[0].filename : (existing.banner_desktop_image || '');
  const mobileImage = req.files && req.files.banner_mobile_image ? req.files.banner_mobile_image[0].filename : (existing.banner_mobile_image || '');
  // Delete old banner images if new ones are uploaded
  if (req.files && req.files.banner_desktop_image && existing.banner_desktop_image) {
    const oldPath = path.join(__dirname, '..', 'public', 'uploads', 'banners', existing.banner_desktop_image);
    try { fs.unlinkSync(oldPath); } catch(e) {}
  }
  if (req.files && req.files.banner_mobile_image && existing.banner_mobile_image) {
    const oldPath = path.join(__dirname, '..', 'public', 'uploads', 'banners', existing.banner_mobile_image);
    try { fs.unlinkSync(oldPath); } catch(e) {}
  }
  db.prepare(`
    UPDATE collections SET name = ?, section_type = ?, category_id = ?, display_mode = ?, grid_columns = ?, grid_product_count = ?, slider_product_count = ?, slider_autoplay = ?, is_active = ?, show_title = ?, sort_order = ?, banner_desktop_image = ?, banner_mobile_image = ?, banner_link_url = ?, footer_description = ?, footer_description_fr = ?, footer_copyright = ?, footer_copyright_fr = ?, footer_payment_icons = ?
    WHERE id = ?
  `).run(
    name,
    section_type || 'products',
    category_id || null,
    display_mode || 'grid',
    parseInt(grid_columns) || 2,
    parseInt(grid_product_count) || 6,
    parseInt(slider_product_count) || 10,
    slider_autoplay === 'on' || slider_autoplay === '1' ? 1 : 0,
    is_active === 'on' || is_active === '1' ? 1 : 0,
    show_title === 'on' || show_title === '1' ? 1 : 0,
    parseInt(sort_order) || 0,
    desktopImage,
    mobileImage,
    banner_link_url || '',
    footer_description || existing.footer_description || '',
    footer_description_fr || existing.footer_description_fr || '',
    footer_copyright || existing.footer_copyright || '',
    footer_copyright_fr || existing.footer_copyright_fr || '',
    footer_payment_icons || existing.footer_payment_icons || 'visa,mastercard,paypal',
    req.params.id
  );
  res.redirect('/admin/collections');
});

router.post('/collections/:id/delete', requireAdmin, (req, res) => {
  const col = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
  if (col) {
    if (col.banner_desktop_image) {
      try { fs.unlinkSync(path.join(__dirname, '..', 'public', 'uploads', 'banners', col.banner_desktop_image)); } catch(e) {}
    }
    if (col.banner_mobile_image) {
      try { fs.unlinkSync(path.join(__dirname, '..', 'public', 'uploads', 'banners', col.banner_mobile_image)); } catch(e) {}
    }
    db.prepare('DELETE FROM collections WHERE id = ?').run(req.params.id);
  }
  res.redirect('/admin/collections');
});

router.post('/collections/reorder', requireAdmin, (req, res) => {
  const { order } = req.body; // array of IDs (may include "categories" for circular categories card)
  if (Array.isArray(order)) {
    order.forEach((id, idx) => {
      if (id === 'categories') {
        upsertSetting('categories_sort_order', String(idx));
      } else {
        db.prepare('UPDATE collections SET sort_order = ? WHERE id = ?').run(idx, parseInt(id));
      }
    });
  }
  res.json({ success: true });
});

// ============================================================
// FAQ ITEMS CRUD (AJAX)
// ============================================================

// Get single FAQ item (for edit)
router.get('/collections/:id/faq/:faqId', requireAdmin, (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM faq_items WHERE id = ? AND collection_id = ?').get(req.params.faqId, req.params.id);
    if (!item) return res.json({ error: 'Not found' });
    res.json(item);
  } catch(e) { res.json({ error: e.message }); }
});

// Create FAQ item
router.post('/collections/:id/faq', requireAdmin, (req, res) => {
  try {
    const { question, answer, question_fr, answer_fr } = req.body;
    if (!question || !answer) return res.json({ error: 'Missing fields' });
    const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as max_order FROM faq_items WHERE collection_id = ?').get(req.params.id);
    db.prepare('INSERT INTO faq_items (collection_id, question, answer, question_fr, answer_fr, sort_order) VALUES (?, ?, ?, ?, ?, ?)').run(
      req.params.id, question, answer, question_fr || '', answer_fr || '', (maxOrder.max_order || 0) + 1
    );
    res.json({ success: true });
  } catch(e) { res.json({ error: e.message }); }
});

// Update FAQ item
router.put('/collections/:id/faq/:faqId', requireAdmin, (req, res) => {
  try {
    const { question, answer, question_fr, answer_fr } = req.body;
    if (!question || !answer) return res.json({ error: 'Missing fields' });
    db.prepare('UPDATE faq_items SET question = ?, answer = ?, question_fr = ?, answer_fr = ? WHERE id = ? AND collection_id = ?').run(
      question, answer, question_fr || '', answer_fr || '', req.params.faqId, req.params.id
    );
    res.json({ success: true });
  } catch(e) { res.json({ error: e.message }); }
});

// Delete FAQ item
router.delete('/collections/:id/faq/:faqId', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM faq_items WHERE id = ? AND collection_id = ?').run(req.params.faqId, req.params.id);
    res.json({ success: true });
  } catch(e) { res.json({ error: e.message }); }
});

// ============================================================
// FOOTER COLUMNS & LINKS CRUD (AJAX)
// ============================================================

// Get all footer columns with links for a collection
router.get('/collections/:id/footer-columns', requireAdmin, (req, res) => {
  try {
    const columns = db.prepare('SELECT * FROM footer_columns WHERE collection_id = ? ORDER BY sort_order, id').all(req.params.id);
    columns.forEach(col => {
      col.links = db.prepare('SELECT * FROM footer_links WHERE column_id = ? ORDER BY sort_order, id').all(col.id);
    });
    res.json(columns);
  } catch(e) { res.json({ error: e.message }); }
});

// Create footer column
router.post('/collections/:id/footer-column', requireAdmin, (req, res) => {
  try {
    const { title, title_fr } = req.body;
    if (!title) return res.json({ error: 'Title required' });
    const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as max_order FROM footer_columns WHERE collection_id = ?').get(req.params.id);
    const result = db.prepare('INSERT INTO footer_columns (collection_id, title, title_fr, sort_order) VALUES (?, ?, ?, ?)').run(
      req.params.id, title, title_fr || '', (maxOrder.max_order || 0) + 1
    );
    res.json({ success: true, id: result.lastInsertRowid });
  } catch(e) { res.json({ error: e.message }); }
});

// Update footer column
router.put('/collections/:id/footer-column/:colId', requireAdmin, (req, res) => {
  try {
    const { title, title_fr } = req.body;
    if (!title) return res.json({ error: 'Title required' });
    db.prepare('UPDATE footer_columns SET title = ?, title_fr = ? WHERE id = ? AND collection_id = ?').run(
      title, title_fr || '', req.params.colId, req.params.id
    );
    res.json({ success: true });
  } catch(e) { res.json({ error: e.message }); }
});

// Delete footer column (cascade deletes links)
router.delete('/collections/:id/footer-column/:colId', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM footer_links WHERE column_id = ?').run(req.params.colId);
    db.prepare('DELETE FROM footer_columns WHERE id = ? AND collection_id = ?').run(req.params.colId, req.params.id);
    res.json({ success: true });
  } catch(e) { res.json({ error: e.message }); }
});

// Add link to footer column
router.post('/collections/:id/footer-column/:colId/link', requireAdmin, (req, res) => {
  try {
    const { label, label_fr, url } = req.body;
    if (!label) return res.json({ error: 'Label required' });
    const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as max_order FROM footer_links WHERE column_id = ?').get(req.params.colId);
    const result = db.prepare('INSERT INTO footer_links (column_id, label, label_fr, url, sort_order) VALUES (?, ?, ?, ?, ?)').run(
      req.params.colId, label, label_fr || '', url || '#', (maxOrder.max_order || 0) + 1
    );
    res.json({ success: true, id: result.lastInsertRowid });
  } catch(e) { res.json({ error: e.message }); }
});

// Update footer link
router.put('/collections/:id/footer-link/:linkId', requireAdmin, (req, res) => {
  try {
    const { label, label_fr, url } = req.body;
    if (!label) return res.json({ error: 'Label required' });
    db.prepare('UPDATE footer_links SET label = ?, label_fr = ?, url = ? WHERE id = ?').run(
      label, label_fr || '', url || '#', req.params.linkId
    );
    res.json({ success: true });
  } catch(e) { res.json({ error: e.message }); }
});

// Delete footer link
router.delete('/collections/:id/footer-link/:linkId', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM footer_links WHERE id = ?').run(req.params.linkId);
    res.json({ success: true });
  } catch(e) { res.json({ error: e.message }); }
});

// Update footer settings (description, copyright, colors, typography)
router.put('/collections/:id/footer-settings', requireAdmin, (req, res) => {
  try {
    const { footer_description, footer_description_fr, footer_copyright, footer_copyright_fr, footer_payment_icons,
      footer_bg_color, footer_text_color, footer_heading_size, footer_heading_color,
      footer_link_size, footer_link_color, footer_desc_size, footer_desc_color } = req.body;
    db.prepare(`
      UPDATE collections SET footer_description = ?, footer_description_fr = ?, footer_copyright = ?, footer_copyright_fr = ?, footer_payment_icons = ?
      WHERE id = ?
    `).run(
      footer_description || '', footer_description_fr || '', footer_copyright || '', footer_copyright_fr || '', footer_payment_icons || '', req.params.id
    );
    // Save footer settings to admin_settings
    const footerSettings = {
      footer_bg_color, footer_text_color,
      footer_heading_size, footer_heading_color,
      footer_link_size, footer_link_color,
      footer_desc_size, footer_desc_color
    };
    Object.entries(footerSettings).forEach(([key, val]) => {
      if (val !== undefined) {
        db.prepare("INSERT OR REPLACE INTO admin_settings (setting_key, setting_value) VALUES (?, ?)").run(key, val || '');
      }
    });
    res.json({ success: true });
  } catch(e) { res.json({ error: e.message }); }
});

// ============================================================
// FOOTER CUSTOM ICONS (uploadable bank/payment icons)
// ============================================================

// Get all footer icons for a collection
router.get('/collections/:id/footer-icons', requireAdmin, (req, res) => {
  try {
    const icons = db.prepare('SELECT * FROM footer_icons WHERE collection_id = ? ORDER BY sort_order, id').all(req.params.id);
    res.json(icons);
  } catch(e) { res.json({ error: e.message }); }
});

// Upload a new footer icon
router.post('/collections/:id/footer-icon', requireAdmin, footerIconUpload.single('icon_image'), (req, res) => {
  try {
    const { name, url } = req.body;
    if (!req.file) return res.json({ error: 'Image required' });
    const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as max_order FROM footer_icons WHERE collection_id = ?').get(req.params.id);
    db.prepare('INSERT INTO footer_icons (collection_id, name, image_filename, url, sort_order) VALUES (?, ?, ?, ?, ?)').run(
      req.params.id, name || '', req.file.filename, url || '', (maxOrder.max_order || 0) + 1
    );
    res.json({ success: true });
  } catch(e) { res.json({ error: e.message }); }
});

// Update footer icon (with optional new image)
router.post('/collections/:id/footer-icon/:iconId/update', requireAdmin, footerIconUpload.single('icon_image'), (req, res) => {
  try {
    const { name, url } = req.body;
    const existing = db.prepare('SELECT * FROM footer_icons WHERE id = ? AND collection_id = ?').get(req.params.iconId, req.params.id);
    if (!existing) return res.json({ error: 'Icon not found' });
    let filename = existing.image_filename;
    if (req.file) {
      // Delete old file
      if (filename) {
        const oldPath = path.join(__dirname, '..', 'public', 'uploads', 'footer-icons', filename);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      filename = req.file.filename;
    }
    db.prepare('UPDATE footer_icons SET name = ?, image_filename = ?, url = ? WHERE id = ? AND collection_id = ?').run(
      name || '', filename, url || '', req.params.iconId, req.params.id
    );
    res.json({ success: true });
  } catch(e) { res.json({ error: e.message }); }
});

// Delete footer icon
router.delete('/collections/:id/footer-icon/:iconId', requireAdmin, (req, res) => {
  try {
    const existing = db.prepare('SELECT image_filename FROM footer_icons WHERE id = ? AND collection_id = ?').get(req.params.iconId, req.params.id);
    if (existing && existing.image_filename) {
      const filePath = path.join(__dirname, '..', 'public', 'uploads', 'footer-icons', existing.image_filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    db.prepare('DELETE FROM footer_icons WHERE id = ? AND collection_id = ?').run(req.params.iconId, req.params.id);
    res.json({ success: true });
  } catch(e) { res.json({ error: e.message }); }
});

// ============================================================
// FOOTER LOGO UPLOAD
// ============================================================
router.post('/footer-logo-upload', requireAdmin, settingsUpload.single('footer_logo'), (req, res) => {
  try {
    if (!req.file) return res.json({ error: 'No file uploaded' });
    // Delete old footer logo if exists
    const old = db.prepare("SELECT setting_value FROM admin_settings WHERE setting_key = 'footer_logo'").get();
    if (old && old.setting_value) {
      const oldPath = path.join(__dirname, '..', 'public', 'uploads', 'settings', old.setting_value);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    db.prepare("INSERT OR REPLACE INTO admin_settings (setting_key, setting_value) VALUES ('footer_logo', ?)").run(req.file.filename);
    res.json({ success: true, filename: req.file.filename });
  } catch(e) { res.json({ error: e.message }); }
});

// Delete footer logo
router.delete('/footer-logo', requireAdmin, (req, res) => {
  try {
    const old = db.prepare("SELECT setting_value FROM admin_settings WHERE setting_key = 'footer_logo'").get();
    if (old && old.setting_value) {
      const oldPath = path.join(__dirname, '..', 'public', 'uploads', 'settings', old.setting_value);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    db.prepare("INSERT OR REPLACE INTO admin_settings (setting_key, setting_value) VALUES ('footer_logo', '')").run();
    res.json({ success: true });
  } catch(e) { res.json({ error: e.message }); }
});

// ============================================================
// ANNOUNCEMENT BAR SETTINGS
// ============================================================
router.put('/announcement-settings', requireAdmin, (req, res) => {
  try {
    const fields = ['announcement_enabled', 'announcement_text', 'announcement_text_fr',
      'announcement_bg_color', 'announcement_text_color', 'announcement_height',
      'announcement_mobile_height', 'announcement_link'];
    fields.forEach(key => {
      if (req.body[key] !== undefined) {
        db.prepare("INSERT OR REPLACE INTO admin_settings (setting_key, setting_value) VALUES (?, ?)").run(key, req.body[key] || '');
      }
    });
    res.json({ success: true });
  } catch(e) { res.json({ error: e.message }); }
});

// ============================================================
// CUSTOM PAGES
// ============================================================

router.get('/pages', requireAdmin, (req, res) => {
  const pages = db.prepare('SELECT * FROM custom_pages ORDER BY sort_order, id DESC').all();
  res.render('admin/pages', { pages });
});

router.get('/pages/new', requireAdmin, (req, res) => {
  res.render('admin/page-form', { page: null });
});

router.get('/pages/:id/edit', requireAdmin, (req, res) => {
  const page = db.prepare('SELECT * FROM custom_pages WHERE id = ?').get(req.params.id);
  if (!page) return res.redirect('/admin/pages');
  res.render('admin/page-form', { page });
});

router.post('/pages', requireAdmin, (req, res) => {
  const { title_ar, title_fr, slug, content_ar, content_fr, meta_title_ar, meta_title_fr, meta_description_ar, meta_description_fr, is_published, sort_order } = req.body;
  // Auto-generate slug from Arabic title if not provided
  let finalSlug = slug ? slug.trim() : '';
  if (!finalSlug) {
    finalSlug = (title_ar || title_fr || 'page').toLowerCase()
      .replace(/[\u0600-\u06FF]+/g, function(m) { return m; }) // keep Arabic
      .replace(/[^\w\u0600-\u06FF]+/g, '-')
      .replace(/^-|-$/g, '') || 'page-' + Date.now();
  }
  // Ensure slug is unique
  const existing = db.prepare('SELECT id FROM custom_pages WHERE slug = ?').get(finalSlug);
  if (existing) finalSlug = finalSlug + '-' + Date.now();

  db.prepare(`INSERT INTO custom_pages (title_ar, title_fr, slug, content_ar, content_fr, meta_title_ar, meta_title_fr, meta_description_ar, meta_description_fr, is_published, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    title_ar || '', title_fr || '', finalSlug, content_ar || '', content_fr || '',
    meta_title_ar || '', meta_title_fr || '', meta_description_ar || '', meta_description_fr || '',
    is_published === '1' ? 1 : 0, parseInt(sort_order) || 0
  );
  res.redirect('/admin/pages');
});

router.post('/pages/:id/update', requireAdmin, (req, res) => {
  const page = db.prepare('SELECT * FROM custom_pages WHERE id = ?').get(req.params.id);
  if (!page) return res.redirect('/admin/pages');
  const { title_ar, title_fr, slug, content_ar, content_fr, meta_title_ar, meta_title_fr, meta_description_ar, meta_description_fr, is_published, sort_order } = req.body;

  let finalSlug = slug ? slug.trim() : page.slug;
  if (!finalSlug) finalSlug = page.slug;
  // Ensure slug uniqueness (exclude current page)
  const existing = db.prepare('SELECT id FROM custom_pages WHERE slug = ? AND id != ?').get(finalSlug, page.id);
  if (existing) finalSlug = finalSlug + '-' + Date.now();

  db.prepare(`UPDATE custom_pages SET title_ar=?, title_fr=?, slug=?, content_ar=?, content_fr=?, meta_title_ar=?, meta_title_fr=?, meta_description_ar=?, meta_description_fr=?, is_published=?, sort_order=?, updated_at=datetime('now') WHERE id=?`).run(
    title_ar || '', title_fr || '', finalSlug, content_ar || '', content_fr || '',
    meta_title_ar || '', meta_title_fr || '', meta_description_ar || '', meta_description_fr || '',
    is_published === '1' ? 1 : 0, parseInt(sort_order) || 0, req.params.id
  );
  res.redirect('/admin/pages');
});

router.post('/pages/:id/delete', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM custom_pages WHERE id = ?').run(req.params.id);
  res.redirect('/admin/pages');
});

router.post('/pages/:id/toggle', requireAdmin, (req, res) => {
  const page = db.prepare('SELECT * FROM custom_pages WHERE id = ?').get(req.params.id);
  if (page) {
    db.prepare('UPDATE custom_pages SET is_published = ? WHERE id = ?').run(page.is_published ? 0 : 1, req.params.id);
  }
  res.redirect('/admin/pages');
});

module.exports = router;
