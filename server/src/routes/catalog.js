import express from 'express';
import { query } from '../config/db.js';

const router = express.Router();

const cleanCdata = (str) => {
    if (!str) return '';
    return '<![CDATA[' + String(str).replace(/\]\]>/g, ']] >') + ']]>';
};

const handleCatalogFeed = async (req, res) => {
    try {
        const result = await query('SELECT * FROM products WHERE is_active = TRUE ORDER BY created_at DESC');
        const products = result.rows;

        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || 'choshmazone.com';
        const baseUrl = process.env.BASE_URL || (protocol + '://' + host);

        const getAbsoluteUrl = (url) => {
            if (!url) return '';
            if (url.startsWith('http://') || url.startsWith('https://')) return url;
            return baseUrl + (url.startsWith('/') ? '' : '/') + url;
        };

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
'<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n' +
'  <channel>\n' +
'    <title>Choshmazone Catalog Feed</title>\n' +
'    <link>' + baseUrl + '</link>\n' +
'    <description>Facebook Product Catalog Feed for Choshmazone</description>\n';

        for (const product of products) {
            const parentId = product.id;
            const parentName = product.name;
            const parentDescription = product.description || product.name;
            const parentCategory = product.category || 'Apparel & Accessories > Clothing';
            const brand = product.brand || 'Choshmazone';

            let variantsList = [];
            try {
                if (product.variants) {
                    variantsList = typeof product.variants === 'string'
                        ? JSON.parse(product.variants)
                        : product.variants;
                }
            } catch (e) {
                console.warn('Failed to parse variants for product ' + product.id);
            }

            if (Array.isArray(variantsList) && variantsList.length > 0) {
                for (const variant of variantsList) {
                    const variantId = variant.id || Math.random().toString(36).substr(2, 9);
                    const feedId = parentId + '_' + variantId;

                    const details = [];
                    if (variant.color) details.push(variant.color);
                    if (variant.size) details.push(variant.size);
                    const variantName = details.length > 0
                        ? (parentName + ' - ' + details.join(' / '))
                        : parentName;

                    const link = baseUrl + '/product/' + parentId + '?variant=' + variantId;
                    const imageLink = getAbsoluteUrl(variant.image_url || product.image_url);
                    const priceVal = variant.price || product.price;
                    const priceStr = Number(priceVal).toFixed(2) + ' BDT';

                    const stockQty = typeof variant.stock_quantity !== 'undefined'
                        ? Number(variant.stock_quantity)
                        : Number(product.stock_quantity);
                    const availability = stockQty > 0 ? 'in stock' : 'out of stock';

                    xml += '    <item>\n' +
'      <g:id>' + feedId + '</g:id>\n' +
'      <g:item_group_id>' + parentId + '</g:item_group_id>\n' +
'      <g:title>' + cleanCdata(variantName) + '</g:title>\n' +
'      <g:description>' + cleanCdata(parentDescription) + '</g:description>\n' +
'      <g:link>' + link + '</g:link>\n' +
'      <g:image_link>' + imageLink + '</g:image_link>\n' +
'      <g:brand>' + cleanCdata(brand) + '</g:brand>\n' +
'      <g:condition>new</g:condition>\n' +
'      <g:availability>' + availability + '</g:availability>\n' +
'      <g:price>' + priceStr + '</g:price>\n' +
'      <g:google_product_category>' + cleanCdata(parentCategory) + '</g:google_product_category>\n';
                    if (variant.color) xml += '      <g:color>' + cleanCdata(variant.color) + '</g:color>\n';
                    if (variant.size) xml += '      <g:size>' + cleanCdata(variant.size) + '</g:size>\n';
                    if (product.style) xml += '      <g:style>' + cleanCdata(product.style) + '</g:style>\n';
                    xml += '    </item>\n';
                }
            } else {
                const link = baseUrl + '/product/' + parentId;
                const imageLink = getAbsoluteUrl(product.image_url);
                const priceStr = Number(product.price).toFixed(2) + ' BDT';
                const availability = Number(product.stock_quantity) > 0 ? 'in stock' : 'out of stock';

                xml += '    <item>\n' +
'      <g:id>' + parentId + '</g:id>\n' +
'      <g:title>' + cleanCdata(parentName) + '</g:title>\n' +
'      <g:description>' + cleanCdata(parentDescription) + '</g:description>\n' +
'      <g:link>' + link + '</g:link>\n' +
'      <g:image_link>' + imageLink + '</g:image_link>\n' +
'      <g:brand>' + cleanCdata(brand) + '</g:brand>\n' +
'      <g:condition>new</g:condition>\n' +
'      <g:availability>' + availability + '</g:availability>\n' +
'      <g:price>' + priceStr + '</g:price>\n' +
'      <g:google_product_category>' + cleanCdata(parentCategory) + '</g:google_product_category>\n';
                if (product.color) xml += '      <g:color>' + cleanCdata(product.color) + '</g:color>\n';
                if (product.style) xml += '      <g:style>' + cleanCdata(product.style) + '</g:style>\n';
                xml += '    </item>\n';
            }
        }

        xml += '  </channel>\n</rss>';

        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
        res.status(200).send(xml);
    } catch (err) {
        console.error('[Catalog XML Feed Error]:', err);
        res.status(500).json({ error: err.message });
    }
};

router.get('/', handleCatalogFeed);
router.get('/catalog.xml', handleCatalogFeed);

export default router;
