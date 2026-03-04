const express = require('express');
const session = require('express-session');
const path = require('path');
const { initDatabase } = require('./database');
const { getTranslator, getDirection } = require('./i18n');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
  secret: 'moroccan-store-secret-2024-xyz',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 days
}));

// Make session available in templates
app.use((req, res, next) => {
  res.locals.admin = req.session.admin || null;
  res.locals.user = req.session.user || null;

  // Site name from admin_settings
  try {
    const { db } = require('./database');
    const siteNameRow = db.prepare("SELECT setting_value FROM admin_settings WHERE setting_key = 'site_name'").get();
    res.locals.siteName = siteNameRow ? siteNameRow.setting_value : 'متجرنا';

    // Font settings
    const fontRow = db.prepare("SELECT setting_value FROM admin_settings WHERE setting_key = 'font_family'").get();
    res.locals.fontFamily = fontRow ? fontRow.setting_value : 'Cairo';
    const fontUrlRow = db.prepare("SELECT setting_value FROM admin_settings WHERE setting_key = 'custom_font_url'").get();
    res.locals.customFontUrl = fontUrlRow ? fontUrlRow.setting_value : '';

    // Load ALL settings at once
    const allSettings = {};
    db.prepare('SELECT setting_key, setting_value FROM admin_settings').all().forEach(r => { allSettings[r.setting_key] = r.setting_value; });

    // Theme colors
    res.locals.primaryColor = allSettings.primary_color || '#000000';
    res.locals.secondaryColor = allSettings.secondary_color || '#333333';
    res.locals.buttonColor = allSettings.button_color || '#000000';
    res.locals.buttonTextColor = allSettings.button_text_color || '#FFFFFF';
    res.locals.textColor = allSettings.text_color || '#2C1810';
    res.locals.bgColor = allSettings.bg_color || '#FFFFFF';
    res.locals.headerBgColor = allSettings.header_bg_color || '#FFFFFF';
    res.locals.headerTextColor = allSettings.header_text_color || '#000000';
    res.locals.footerBgColor = allSettings.footer_bg_color || '#1a1a1a';
    res.locals.footerTextColor = allSettings.footer_text_color || '#FFFFFF';
    res.locals.footerHeadingSize = allSettings.footer_heading_size || '14';
    res.locals.footerHeadingColor = allSettings.footer_heading_color || '';
    res.locals.footerLinkSize = allSettings.footer_link_size || '14';
    res.locals.footerLinkColor = allSettings.footer_link_color || '';
    res.locals.footerDescSize = allSettings.footer_desc_size || '14';
    res.locals.footerDescColor = allSettings.footer_desc_color || '';
    res.locals.footerLogo = allSettings.footer_logo || '';
    res.locals.sliderArrowColor = allSettings.slider_arrow_color || '#333333';
    res.locals.sliderArrowBgColor = allSettings.slider_arrow_bg_color || 'rgba(255,255,255,0.9)';
    res.locals.metaTitle = allSettings.meta_title || '';
    res.locals.metaDescription = allSettings.meta_description || '';
    res.locals.ogImage = allSettings.og_image || '';
    res.locals.favicon = allSettings.favicon || '';
    res.locals.gaId = allSettings.ga_id || '';
    res.locals.fbPixelId = allSettings.fb_pixel_id || '';
    res.locals.tiktokPixelId = allSettings.tiktok_pixel_id || '';
    res.locals.customMetaTags = allSettings.custom_meta_tags || '';
    res.locals.desktopLogo = allSettings.desktop_logo || '';
    res.locals.mobileLogo = allSettings.mobile_logo || '';
    res.locals.logoSize = allSettings.logo_size || '36';
    res.locals.categoriesPosition = allSettings.categories_position || 'after_slider';
    res.locals.categoriesSortOrder = parseInt(allSettings.categories_sort_order) || 0;
    res.locals.categoriesHidden = allSettings.categories_hidden === '1';

    // Language / i18n
    const siteLang = allSettings.site_language || 'ar';
    res.locals.siteLang = siteLang;
    // For 'both' mode, determine active language from query or session
    let activeLang = siteLang;
    if (siteLang === 'both') {
      if (req.query.lang === 'ar' || req.query.lang === 'fr') {
        req.session.lang = req.query.lang;
        activeLang = req.query.lang;
      } else if (req.session.lang) {
        activeLang = req.session.lang;
      } else {
        activeLang = 'ar'; // default to Arabic in both mode
      }
    }
    res.locals.lang = activeLang;
    res.locals.dir = getDirection(activeLang);
    res.locals.t = getTranslator(activeLang);

    // Cart mode
    res.locals.cartMode = allSettings.cart_mode || 'drawer';

    // Announcement bar
    res.locals.announcementEnabled = allSettings.announcement_enabled === '1';
    res.locals.announcementText = allSettings.announcement_text || '';
    res.locals.announcementTextFr = allSettings.announcement_text_fr || '';
    res.locals.announcementBgColor = allSettings.announcement_bg_color || '#000000';
    res.locals.announcementTextColor = allSettings.announcement_text_color || '#FFFFFF';
    res.locals.announcementHeight = allSettings.announcement_height || '44';
    res.locals.announcementMobileHeight = allSettings.announcement_mobile_height || '40';
    res.locals.announcementLink = allSettings.announcement_link || '';

    // Checkout description
    res.locals.checkoutDescription = allSettings.checkout_description || '';

    // Footer data (from footer collection)
    try {
      const footerCol = db.prepare("SELECT * FROM collections WHERE section_type = 'footer' AND is_active = 1 LIMIT 1").get();
      if (footerCol) {
        const footerColumns = db.prepare('SELECT * FROM footer_columns WHERE collection_id = ? ORDER BY sort_order, id').all(footerCol.id);
        footerColumns.forEach(fc => {
          fc.links = db.prepare('SELECT * FROM footer_links WHERE column_id = ? ORDER BY sort_order, id').all(fc.id);
        });
        const footerIcons = db.prepare('SELECT * FROM footer_icons WHERE collection_id = ? ORDER BY sort_order, id').all(footerCol.id);
        res.locals.footerData = {
          description: footerCol.footer_description || '',
          description_fr: footerCol.footer_description_fr || '',
          copyright: footerCol.footer_copyright || '',
          copyright_fr: footerCol.footer_copyright_fr || '',
          payment_icons: (footerCol.footer_payment_icons || '').split(',').filter(Boolean),
          custom_icons: footerIcons,
          columns: footerColumns
        };
      } else {
        res.locals.footerData = null;
      }
    } catch(fe) {
      res.locals.footerData = null;
    }
  } catch(e) {
    res.locals.siteName = 'متجرنا';
    res.locals.fontFamily = 'Cairo';
    res.locals.customFontUrl = '';
    res.locals.primaryColor = '#000000';
    res.locals.secondaryColor = '#333333';
    res.locals.buttonColor = '#000000';
    res.locals.buttonTextColor = '#FFFFFF';
    res.locals.textColor = '#2C1810';
    res.locals.bgColor = '#FFFFFF';
    res.locals.headerBgColor = '#FFFFFF';
    res.locals.headerTextColor = '#000000';
    res.locals.footerBgColor = '#1a1a1a';
    res.locals.footerTextColor = '#FFFFFF';
    res.locals.footerHeadingSize = '14';
    res.locals.footerHeadingColor = '';
    res.locals.footerLinkSize = '14';
    res.locals.footerLinkColor = '';
    res.locals.footerDescSize = '14';
    res.locals.footerDescColor = '';
    res.locals.footerLogo = '';
    res.locals.sliderArrowColor = '#333333';
    res.locals.sliderArrowBgColor = 'rgba(255,255,255,0.9)';
    res.locals.metaTitle = '';
    res.locals.metaDescription = '';
    res.locals.ogImage = '';
    res.locals.favicon = '';
    res.locals.gaId = '';
    res.locals.fbPixelId = '';
    res.locals.tiktokPixelId = '';
    res.locals.customMetaTags = '';
    res.locals.desktopLogo = '';
    res.locals.mobileLogo = '';
    res.locals.lang = 'ar';
    res.locals.dir = 'rtl';
    res.locals.siteLang = 'ar';
    res.locals.t = getTranslator('ar');
    res.locals.cartMode = 'drawer';
    res.locals.checkoutDescription = '';
    res.locals.footerData = null;
    res.locals.announcementEnabled = false;
    res.locals.announcementText = '';
    res.locals.announcementTextFr = '';
    res.locals.announcementBgColor = '#000000';
    res.locals.announcementTextColor = '#FFFFFF';
    res.locals.announcementHeight = '44';
    res.locals.announcementMobileHeight = '40';
    res.locals.announcementLink = '';
  }

  // Cart count for badge
  try {
    const { db } = require('./database');
    const countRow = db.prepare('SELECT SUM(quantity) as total FROM cart_items WHERE session_id = ?').get(req.sessionID);
    res.locals.cartCount = countRow && countRow.total ? countRow.total : 0;
  } catch(e) {
    res.locals.cartCount = 0;
  }

  // Global categories for sidebar menu
  try {
    const { db } = require('./database');
    res.locals.sidebarCategories = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order').all();
  } catch(e) {
    res.locals.sidebarCategories = [];
  }

  next();
});

// Routes (admin must be before public due to /:username catch-all)
app.use('/admin', require('./routes/admin'));
app.use('/api', require('./routes/api'));
app.use('/', require('./routes/public'));

// 404
app.use((req, res) => {
  res.status(404).render('404');
});

// Initialize database then start server
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

