// src/components/ProductLabelModal.jsx
import React, { useState, useMemo } from 'react';
import {
  FaTimes,
  FaPrint,
  FaDownload,
  FaBarcode,
  FaQrcode,
  FaTag,
  FaCheck,
  FaCopy,
  FaLayerGroup,
  FaFileAlt
} from 'react-icons/fa';
import { generateCode39Svg, getQrCodeUrl } from '../utils/barcodeGenerator';

export default function ProductLabelModal({
  isOpen,
  onClose,
  product = null,
  products = [],
  themeColors
}) {
  if (!isOpen) return null;

  // Single product or list of products
  const productList = useMemo(() => {
    if (product) return [product];
    if (products && products.length > 0) return products;
    return [];
  }, [product, products]);

  const activeProduct = productList[0] || {};

  // Configuration States
  const [format, setFormat] = useState('thermal'); // 'thermal' | 'retail' | 'a4_24' | 'a4_12'
  const [copies, setCopies] = useState(1);
  const [brandName, setBrandName] = useState('SPARROW CART');
  const [showBarcode, setShowBarcode] = useState(true);
  const [showQr, setShowQr] = useState(true);
  const [showMrp, setShowMrp] = useState(true);
  const [showImage, setShowImage] = useState(false);
  const [showDate, setShowDate] = useState(true);
  const [showStore, setShowStore] = useState(true);
  const [customSku, setCustomSku] = useState('');

  // Sku code for barcode (truncate to 16 chars max for crisp scanning)
  const skuCode = customSku || (activeProduct._id ? activeProduct._id.substring(activeProduct._id.length - 12).toUpperCase() : 'SPARROW01');
  const barcodeSvg = useMemo(() => generateCode39Svg(skuCode, { height: 40 }), [skuCode]);
  const qrUrl = useMemo(() => getQrCodeUrl(activeProduct._id || skuCode, 120), [activeProduct._id, skuCode]);

  const todayDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const mrp = Number(activeProduct.price) || 0;
  const offerPrice = Number(activeProduct.offerPrice) || mrp;
  const savings = mrp > offerPrice ? mrp - offerPrice : 0;
  const discountPercent = mrp > 0 && savings > 0 ? Math.round((savings / mrp) * 100) : 0;
  const storeName = activeProduct.store?.storeName || 'SparrowCart Verified';

  // Generate HTML for a single label card
  const renderSingleLabelHtml = (prod, index = 1) => {
    const pMrp = Number(prod.price) || 0;
    const pOffer = Number(prod.offerPrice) || pMrp;
    const pSavings = pMrp > pOffer ? pMrp - pOffer : 0;
    const pDiscount = pMrp > 0 && pSavings > 0 ? Math.round((pSavings / pMrp) * 100) : 0;
    const pSku = customSku || (prod._id ? prod._id.substring(prod._id.length - 12).toUpperCase() : `SKU${index}`);
    const pBarcode = generateCode39Svg(pSku, { height: format === 'thermal' ? 32 : 38 });
    const pQr = getQrCodeUrl(prod._id || pSku, 100);
    const pStore = prod.store?.storeName || 'SparrowCart';

    return `
      <div class="product-label label-${format}">
        <!-- Header -->
        <div class="label-header">
          <span class="brand-name">${brandName}</span>
          ${showDate ? `<span class="label-date">PKD: ${todayDate}</span>` : ''}
        </div>

        <!-- Product Name -->
        <div class="product-title">${prod.name || 'Product Title'}</div>
        <div class="product-meta">
          <span>${prod.category?.title || 'General'}</span>
          <span>•</span>
          <span>${prod.unit || 'piece'}</span>
          ${showStore && pStore ? `<span>• ${pStore}</span>` : ''}
        </div>

        <!-- Middle Content: Image & QR -->
        ${(showImage && prod.images?.[0]) || showQr ? `
          <div class="middle-row">
            ${showImage && prod.images?.[0] ? `
              <img src="${prod.images[0]}" class="prod-thumb" alt="Product" />
            ` : ''}
            <div class="price-box">
              ${showMrp && pMrp > pOffer ? `
                <div class="mrp-row">MRP: <span class="mrp-val">₹${pMrp.toLocaleString('en-IN')}</span></div>
              ` : ''}
              <div class="offer-price">
                <span class="currency">₹</span><span class="price-val">${pOffer.toLocaleString('en-IN')}</span>
              </div>
              ${showMrp && pDiscount > 0 ? `
                <div class="discount-badge">SAVE ₹${pSavings} (${pDiscount}% OFF)</div>
              ` : ''}
              <div class="tax-info">Incl. of all taxes</div>
            </div>
            ${showQr ? `
              <div class="qr-box">
                <img src="${pQr}" class="qr-img" alt="QR" />
                <span class="qr-text">SCAN</span>
              </div>
            ` : ''}
          </div>
        ` : `
          <!-- Price Only Layout -->
          <div class="price-strip">
            ${showMrp && pMrp > pOffer ? `
              <span class="mrp-text">MRP: ₹${pMrp.toLocaleString('en-IN')}</span>
            ` : ''}
            <span class="offer-text">PRICE: ₹${pOffer.toLocaleString('en-IN')}</span>
            ${showMrp && pDiscount > 0 ? `
              <span class="save-tag">${pDiscount}% OFF</span>
            ` : ''}
          </div>
        `}

        <!-- Barcode Section -->
        ${showBarcode ? `
          <div class="barcode-container">
            ${pBarcode}
            <div class="sku-text">${pSku}</div>
          </div>
        ` : ''}
      </div>
    `;
  };

  // Compile entire printable HTML page with CSS styling
  const buildPrintablePageHtml = () => {
    let labelsHtml = '';

    if (format === 'a4_24' || format === 'a4_12') {
      // Multiple labels in grid
      const count = productList.length > 1 ? productList.length : copies;
      for (let i = 0; i < count; i++) {
        const prod = productList.length > 1 ? productList[i] : activeProduct;
        labelsHtml += renderSingleLabelHtml(prod, i + 1);
      }
    } else {
      // Single sticker or repeated copies on roll
      for (let i = 0; i < copies; i++) {
        labelsHtml += renderSingleLabelHtml(activeProduct, i + 1);
      }
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Product Labels - ${brandName}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            background: #f1f5f9;
            color: #0f172a;
            padding: 20px;
          }

          /* General Label Styles */
          .product-label {
            background: #ffffff;
            border: 1px dashed #94a3b8;
            border-radius: 6px;
            padding: 8px 10px;
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
          }

          .label-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 3px;
            margin-bottom: 4px;
          }
          .brand-name {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.8px;
            color: #0f172a;
          }
          .label-date {
            font-size: 8px;
            color: #64748b;
            font-weight: 600;
          }

          .product-title {
            font-size: 11px;
            font-weight: 700;
            color: #1e293b;
            line-height: 1.2;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            margin-bottom: 2px;
          }
          .product-meta {
            font-size: 8.5px;
            color: #64748b;
            display: flex;
            gap: 4px;
            margin-bottom: 4px;
          }

          .middle-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
            margin: 4px 0;
          }
          .prod-thumb {
            width: 38px;
            height: 38px;
            object-fit: cover;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          }

          .price-box {
            flex: 1;
            text-align: left;
          }
          .mrp-row {
            font-size: 9px;
            color: #64748b;
          }
          .mrp-val {
            text-decoration: line-through;
          }
          .offer-price {
            font-size: 15px;
            font-weight: 900;
            color: #0f172a;
            line-height: 1.1;
          }
          .discount-badge {
            font-size: 8px;
            font-weight: 700;
            color: #15803d;
            background: #dcfce7;
            padding: 1px 4px;
            border-radius: 3px;
            display: inline-block;
            margin-top: 2px;
          }
          .tax-info {
            font-size: 7.5px;
            color: #94a3b8;
          }

          .price-strip {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #f8fafc;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
            margin: 4px 0;
          }
          .mrp-text { font-size: 9px; color: #64748b; text-decoration: line-through; }
          .offer-text { font-size: 13px; font-weight: 800; color: #0f172a; }
          .save-tag { font-size: 8.5px; font-weight: 700; color: #16a34a; }

          .qr-box {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .qr-img {
            width: 38px;
            height: 38px;
            border: 1px solid #cbd5e1;
            border-radius: 3px;
          }
          .qr-text {
            font-size: 7px;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 0.5px;
          }

          .barcode-container {
            margin-top: 4px;
            text-align: center;
          }
          .barcode-container svg {
            width: 100%;
            max-height: 34px;
          }
          .sku-text {
            font-size: 8px;
            font-family: monospace;
            font-weight: 600;
            letter-spacing: 1px;
            color: #475569;
            margin-top: 1px;
          }

          /* Specific Layout Dimensions */
          ${format === 'thermal' ? `
            .container {
              display: flex;
              flex-direction: column;
              gap: 12px;
              max-width: 50mm;
              margin: 0 auto;
            }
            .label-thermal {
              width: 50mm;
              height: 35mm;
              border: 1px solid #000;
              padding: 5px 6px;
            }
            @media print {
              body { padding: 0; background: none; }
              @page { size: 50mm 35mm; margin: 0; }
              .container { max-width: 50mm; gap: 0; }
              .label-thermal {
                border: none;
                page-break-after: always;
                width: 50mm;
                height: 35mm;
              }
            }
          ` : format === 'retail' ? `
            .container {
              display: flex;
              flex-direction: column;
              gap: 14px;
              max-width: 75mm;
              margin: 0 auto;
            }
            .label-retail {
              width: 75mm;
              height: 50mm;
              border: 1px solid #000;
              padding: 8px 10px;
            }
            @media print {
              body { padding: 0; background: none; }
              @page { size: 75mm 50mm; margin: 0; }
              .container { max-width: 75mm; gap: 0; }
              .label-retail {
                border: none;
                page-break-after: always;
                width: 75mm;
                height: 50mm;
              }
            }
          ` : format === 'a4_24' ? `
            .container {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8px;
              max-width: 210mm;
              margin: 0 auto;
              background: #fff;
              padding: 10mm;
              border-radius: 8px;
            }
            .label-a4_24 {
              height: 34mm;
              padding: 5px 6px;
              border: 1px dashed #cbd5e1;
            }
            @media print {
              body { padding: 0; background: none; }
              @page { size: A4; margin: 6mm; }
              .container {
                max-width: 100%;
                padding: 0;
                gap: 3mm;
                grid-template-columns: repeat(3, 1fr);
              }
              .label-a4_24 {
                border: 0.5px solid #ccc;
              }
            }
          ` : `
            /* a4_12 */
            .container {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
              max-width: 210mm;
              margin: 0 auto;
              background: #fff;
              padding: 10mm;
              border-radius: 8px;
            }
            .label-a4_12 {
              height: 44mm;
              padding: 8px 10px;
              border: 1px dashed #cbd5e1;
            }
            @media print {
              body { padding: 0; background: none; }
              @page { size: A4; margin: 8mm; }
              .container {
                max-width: 100%;
                padding: 0;
                gap: 5mm;
                grid-template-columns: repeat(2, 1fr);
              }
              .label-a4_12 {
                border: 0.5px solid #ccc;
              }
            }
          `}
        </style>
      </head>
      <body>
        <div class="container">
          ${labelsHtml}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;
  };

  // Direct Print
  const handlePrint = () => {
    const html = buildPrintablePageHtml();
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this site to print labels.');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Download HTML File (can be saved or printed offline)
  const handleDownload = () => {
    const html = buildPrintablePageHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (activeProduct.name || 'product_label').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    link.href = url;
    link.download = `${safeName}_labels_${format}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border"
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          color: themeColors.text
        }}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: themeColors.border }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}
            >
              <FaBarcode size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Product Label & Barcode Generator</h2>
              <p className="text-xs opacity-70">
                {productList.length > 1
                  ? `Batch Printing: ${productList.length} products selected`
                  : activeProduct.name || 'Generate ready-to-print product tags'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-5">
            {/* Format Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80">
                Label Format & Size
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'thermal', label: 'Thermal Sticker', sub: '50mm × 35mm (Roll)' },
                  { id: 'retail', label: 'Retail Tag', sub: '75mm × 50mm (Box)' },
                  { id: 'a4_24', label: 'A4 Sheet (24-Up)', sub: '3 × 8 Sticky Grid' },
                  { id: 'a4_12', label: 'A4 Sheet (12-Up)', sub: '2 × 6 Large Grid' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormat(item.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      format === item.id ? 'ring-2 font-semibold shadow-sm' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{
                      borderColor: format === item.id ? themeColors.primary : themeColors.border,
                      backgroundColor: format === item.id ? themeColors.primary + '15' : themeColors.background,
                    }}
                  >
                    <div className="text-sm font-bold flex items-center justify-between">
                      {item.label}
                      {format === item.id && <FaCheck className="text-xs" style={{ color: themeColors.primary }} />}
                    </div>
                    <div className="text-[11px] opacity-70 mt-0.5">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Copies Count */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider opacity-80">
                  Number of Copies
                </label>
                {activeProduct.stockQuantity > 0 && (
                  <button
                    type="button"
                    onClick={() => setCopies(activeProduct.stockQuantity)}
                    className="text-xs underline font-medium hover:opacity-80"
                    style={{ color: themeColors.primary }}
                  >
                    Match Stock ({activeProduct.stockQuantity})
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {[1, 5, 10, 24].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCopies(n)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      copies === n ? 'shadow-sm' : 'opacity-70'
                    }`}
                    style={{
                      backgroundColor: copies === n ? themeColors.primary : themeColors.background,
                      color: copies === n ? 'white' : themeColors.text,
                      borderColor: themeColors.border
                    }}
                  >
                    {n}
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-3 py-1.5 rounded-lg border text-center text-sm font-bold"
                  style={{
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }}
                />
              </div>
            </div>

            {/* Header Text & SKU */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold opacity-80 mb-1">Company / Brand</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border text-sm"
                  style={{
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }}
                  placeholder="SPARROW CART"
                />
              </div>
              <div>
                <label className="block text-xs font-bold opacity-80 mb-1">SKU / Barcode ID</label>
                <input
                  type="text"
                  value={customSku}
                  onChange={(e) => setCustomSku(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 rounded-lg border text-sm font-mono"
                  style={{
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }}
                  placeholder={skuCode}
                />
              </div>
            </div>

            {/* Elements Toggle Toggles */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80">
                Visible Elements
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Barcode', state: showBarcode, setter: setShowBarcode },
                  { label: 'QR Code', state: showQr, setter: setShowQr },
                  { label: 'MRP & Discount', state: showMrp, setter: setShowMrp },
                  { label: 'Product Photo', state: showImage, setter: setShowImage },
                  { label: 'Store Name', state: showStore, setter: setShowStore },
                  { label: 'Packed Date', state: showDate, setter: setShowDate },
                ].map((toggle, idx) => (
                  <label
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none hover:bg-black/5"
                    style={{ borderColor: themeColors.border }}
                  >
                    <input
                      type="checkbox"
                      checked={toggle.state}
                      onChange={(e) => toggle.setter(e.target.checked)}
                      className="rounded accent-emerald-600 w-4 h-4"
                    />
                    <span className="font-medium">{toggle.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                Live Label Preview ({format.toUpperCase()})
              </span>
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                High-Resolution Vector Output
              </span>
            </div>

            {/* Visual Preview Box */}
            <div
              className="flex-1 flex items-center justify-center p-6 rounded-2xl border bg-slate-100 dark:bg-slate-900/60 overflow-hidden"
              style={{ borderColor: themeColors.border }}
            >
              {/* The Styled Label Card */}
              <div
                className={`bg-white text-slate-900 rounded-lg shadow-xl border border-slate-300 p-3 transition-all flex flex-col justify-between ${
                  format === 'thermal'
                    ? 'w-[260px] h-[190px]'
                    : format === 'retail'
                    ? 'w-[320px] h-[230px]'
                    : 'w-[280px] h-[200px]'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1">
                  <span className="text-[11px] font-black tracking-wider text-slate-900">{brandName}</span>
                  {showDate && <span className="text-[8px] text-slate-500 font-semibold">PKD: {todayDate}</span>}
                </div>

                {/* Product Name */}
                <div className="text-[12px] font-bold text-slate-900 line-clamp-1 leading-snug">
                  {activeProduct.name || 'Sample Product Name'}
                </div>
                <div className="text-[8.5px] text-slate-500 flex items-center gap-1 mb-1">
                  <span>{activeProduct.category?.title || 'General'}</span>
                  <span>•</span>
                  <span>{activeProduct.unit || 'piece'}</span>
                  {showStore && <span>• {storeName}</span>}
                </div>

                {/* Middle Row (Photo, Price, QR) */}
                <div className="flex items-center justify-between gap-2 my-1">
                  {showImage && activeProduct.images?.[0] && (
                    <img
                      src={activeProduct.images[0]}
                      alt="Thumb"
                      className="w-10 h-10 object-cover rounded border border-slate-200"
                    />
                  )}
                  <div className="flex-1 text-left">
                    {showMrp && mrp > offerPrice && (
                      <div className="text-[9px] text-slate-500">
                        MRP: <span className="line-through">₹{mrp.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="text-base font-black text-slate-900 leading-none">
                      ₹{offerPrice.toLocaleString('en-IN')}
                    </div>
                    {showMrp && discountPercent > 0 && (
                      <span className="inline-block text-[8px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded mt-0.5">
                        SAVE ₹{savings} ({discountPercent}% OFF)
                      </span>
                    )}
                  </div>
                  {showQr && (
                    <div className="flex flex-col items-center">
                      <img src={qrUrl} alt="QR" className="w-10 h-10 border border-slate-300 rounded" />
                      <span className="text-[7px] font-bold text-slate-500 tracking-tighter">SCAN</span>
                    </div>
                  )}
                </div>

                {/* Barcode */}
                {showBarcode && (
                  <div className="text-center pt-1 border-t border-slate-200/80">
                    <div
                      className="w-full flex justify-center overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                    />
                    <div className="text-[8.5px] font-mono font-bold tracking-widest text-slate-600 mt-0.5">
                      {skuCode}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Helper Info */}
            <div className="mt-3 text-xs opacity-70 flex items-center justify-between">
              <span>Paper Size: {format === 'thermal' ? '50mm × 35mm Roll' : format === 'retail' ? '75mm × 50mm Box' : 'A4 Sticker Sheet'}</span>
              <span>Total Labels to Print: <strong className="font-bold">{productList.length > 1 ? productList.length : copies}</strong></span>
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Buttons */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t bg-black/5"
          style={{ borderColor: themeColors.border }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2.5 rounded-xl text-sm font-bold border flex items-center gap-2 hover:bg-black/5 transition-all"
              style={{ borderColor: themeColors.border, color: themeColors.text }}
            >
              <FaDownload />
              Download HTML / PDF
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 text-white shadow-lg hover:scale-105 active:scale-95 transition-all"
              style={{ backgroundColor: themeColors.primary }}
            >
              <FaPrint />
              Print Label ({productList.length > 1 ? productList.length : copies})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
