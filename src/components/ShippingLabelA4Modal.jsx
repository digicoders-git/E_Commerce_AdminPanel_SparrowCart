// src/components/ShippingLabelA4Modal.jsx
import React, { useState, useMemo } from 'react';
import {
  FaTimes,
  FaPrint,
  FaBarcode,
  FaQrcode,
  FaCheck,
  FaCut,
  FaFilePdf,
  FaInfoCircle
} from 'react-icons/fa';
import { generateCode39Svg, getQrCodeUrl } from '../utils/barcodeGenerator';

export default function ShippingLabelA4Modal({
  isOpen,
  onClose,
  selectedOrders = [],
  onPrintComplete,
  themeColors
}) {
  if (!isOpen) return null;

  // Options states
  const [showCutLines, setShowCutLines] = useState(true);
  const [showItemsTable, setShowItemsTable] = useState(true);
  const [showOtp, setShowOtp] = useState(true);
  const [showQr, setShowQr] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [hubName, setHubName] = useState('SPARROW CART LOGISTICS');

  // Fill up to 4 slots
  const slots = useMemo(() => {
    const list = [...selectedOrders.slice(0, 4)];
    while (list.length < 4) {
      list.push(null); // empty quadrant
    }
    return list;
  }, [selectedOrders]);

  const activeCount = selectedOrders.slice(0, 4).length;

  // Render HTML for a single order shipping label quadrant
  const renderSingleShippingLabelHtml = (order, quadrantIndex) => {
    if (!order) {
      return `
        <div class="label-quadrant empty-quadrant">
          <div class="empty-placeholder">
            <span class="cut-guide-text">✂️ [ Slot ${quadrantIndex + 1} - Blank for Cutting ]</span>
          </div>
        </div>
      `;
    }

    const orderId = order._id || '';
    const orderNum = order.orderNumber || (orderId ? orderId.substring(orderId.length - 8).toUpperCase() : `ORD-${quadrantIndex + 1}`);
    const barcodeSvg = generateCode39Svg(orderNum, { height: 32 });
    const qrUrl = getQrCodeUrl(orderId || orderNum, 90);
    const addr = order.shippingAddress || {};
    const isCod = order.paymentMethod?.toLowerCase() === 'cod';
    const store = order.store?.storeName || 'SparrowCart Central Hub';
    const totalAmount = Number(order.grandTotal) || 0;

    return `
      <div class="label-quadrant">
        <!-- Quadrant Header -->
        <div class="quad-header">
          <div>
            <div class="brand-title">SPARROW CART</div>
            <div class="hub-subtitle">${hubName}</div>
          </div>
          <div class="pay-badge ${isCod ? 'badge-cod' : 'badge-prepaid'}">
            ${isCod ? `COD: ₹${totalAmount.toLocaleString('en-IN')}` : 'PREPAID'}
          </div>
        </div>

        <!-- Barcode & QR Row -->
        <div class="code-strip">
          <div class="barcode-wrapper">
            ${showBarcode ? `
              <div class="barcode-svg">${barcodeSvg}</div>
              <div class="order-num-text">#${orderNum}</div>
            ` : `
              <div class="order-num-text text-lg">ORDER: #${orderNum}</div>
            `}
          </div>
          ${showQr ? `
            <div class="qr-wrapper">
              <img src="${qrUrl}" alt="QR" class="qr-img" />
              <span class="qr-tag">SCAN</span>
            </div>
          ` : ''}
        </div>

        <!-- Deliver To / Address Box -->
        <div class="address-box">
          <div class="section-label">DELIVER TO:</div>
          <div class="cust-name">${addr.fullName || order.user?.fullName || 'Customer'}</div>
          <div class="cust-address">
            ${addr.addressLine1 || ''} ${addr.addressLine2 || ''}
            ${addr.landmark ? `<br/><span class="landmark-text">Near ${addr.landmark}</span>` : ''}
          </div>
          <div class="city-pin">
            <strong>${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}</strong>
          </div>
          <div class="phone-row">
            📞 Phone: <strong>${addr.mobile || order.user?.mobile || 'N/A'}</strong>
          </div>
          ${showOtp && order.collectionOTP ? `
            <div class="otp-pill">
              🔑 Delivery OTP: <strong>${order.collectionOTP}</strong>
            </div>
          ` : ''}
        </div>

        <!-- Items Table -->
        ${showItemsTable ? `
          <div class="items-box">
            <div class="section-label">PACKAGE CONTENTS:</div>
            <table class="items-mini-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="text-center" style="width: 36px;">Qty</th>
                </tr>
              </thead>
              <tbody>
                ${(order.items || []).slice(0, 3).map(item => `
                  <tr>
                    <td class="item-name">${item.name || item.product?.name || 'Product Item'}</td>
                    <td class="text-center font-bold">${item.quantity || 1}</td>
                  </tr>
                `).join('')}
                ${(order.items?.length || 0) > 3 ? `
                  <tr>
                    <td colspan="2" class="more-items">+${order.items.length - 3} more items in package</td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- Quadrant Footer -->
        <div class="quad-footer">
          <div>
            <span class="muted-text">Fulfilled by: </span><strong>${store}</strong>
            <div class="muted-date">Date: ${order.createdAtIST || new Date().toLocaleDateString('en-IN')}</div>
          </div>
          <div class="footer-amt">
            <span class="amt-label">${isCod ? 'COLLECT CASH:' : 'TOTAL PAID:'}</span>
            <span class="amt-val">₹${totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    `;
  };

  // Compile entire printable A4 HTML
  const buildA4PrintHtml = () => {
    const quadrantsHtml = slots.map((ord, idx) => renderSingleShippingLabelHtml(ord, idx)).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>4-in-1 A4 Shipping Labels - SparrowCart</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            background: #cbd5e1;
            color: #0f172a;
            padding: 10px;
          }

          /* A4 Sheet Container: 210mm x 297mm */
          .a4-page {
            width: 210mm;
            height: 297mm;
            background: #ffffff;
            margin: 0 auto;
            position: relative;
            padding: 6mm;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 4mm;
            box-sizing: border-box;
          }

          /* Cut Lines (Center Horizontal & Vertical) */
          ${showCutLines ? `
            .cut-line-v {
              position: absolute;
              top: 4mm;
              bottom: 4mm;
              left: 50%;
              width: 0;
              border-left: 1.5px dashed #94a3b8;
              pointer-events: none;
              z-index: 10;
            }
            .cut-line-h {
              position: absolute;
              left: 4mm;
              right: 4mm;
              top: 50%;
              height: 0;
              border-top: 1.5px dashed #94a3b8;
              pointer-events: none;
              z-index: 10;
            }
            .cut-icon-v-top { position: absolute; top: 1mm; left: calc(50% - 6px); font-size: 11px; z-index: 11; }
            .cut-icon-v-bottom { position: absolute; bottom: 1mm; left: calc(50% - 6px); font-size: 11px; z-index: 11; }
            .cut-icon-h-left { position: absolute; left: 1mm; top: calc(50% - 7px); font-size: 11px; z-index: 11; }
            .cut-icon-h-right { position: absolute; right: 1mm; top: calc(50% - 7px); font-size: 11px; z-index: 11; }
          ` : ''}

          /* Individual Label Quadrant */
          .label-quadrant {
            border: 1.5px solid #0f172a;
            border-radius: 6px;
            padding: 8px 10px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
            background: #ffffff;
            height: 100%;
          }

          .empty-quadrant {
            border: 1px dashed #cbd5e1;
            background: #fafafa;
          }
          .empty-placeholder {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #94a3b8;
            font-size: 11px;
            font-weight: 600;
          }

          /* Header */
          .quad-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1.5px solid #0f172a;
            padding-bottom: 4px;
            margin-bottom: 4px;
          }
          .brand-title {
            font-size: 15px;
            font-weight: 900;
            letter-spacing: 0.8px;
            color: #0f172a;
            line-height: 1.1;
          }
          .hub-subtitle {
            font-size: 8px;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 0.5px;
          }

          /* Badges */
          .pay-badge {
            font-size: 11px;
            font-weight: 900;
            padding: 3px 8px;
            border-radius: 4px;
            letter-spacing: 0.5px;
            text-align: right;
          }
          .badge-cod {
            background: #0f172a;
            color: #ffffff;
            border: 1px solid #0f172a;
          }
          .badge-prepaid {
            background: #ecfdf5;
            color: #065f46;
            border: 1px solid #059669;
          }

          /* Barcode & QR */
          .code-strip {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 4px 6px;
            margin-bottom: 5px;
          }
          .barcode-wrapper {
            flex: 1;
            text-align: center;
          }
          .barcode-svg {
            max-height: 32px;
            width: 100%;
            overflow: hidden;
          }
          .order-num-text {
            font-family: monospace;
            font-size: 10px;
            font-weight: 800;
            color: #1e293b;
            letter-spacing: 1px;
            margin-top: 1px;
          }
          .qr-wrapper {
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
          .qr-tag {
            font-size: 6.5px;
            font-weight: 800;
            color: #64748b;
            margin-top: 1px;
          }

          /* Address Box */
          .address-box {
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 6px 8px;
            background: #ffffff;
            margin-bottom: 5px;
            flex: 1;
          }
          .section-label {
            font-size: 8px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          .cust-name {
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 2px;
          }
          .cust-address {
            font-size: 10px;
            color: #334155;
            line-height: 1.25;
          }
          .landmark-text {
            color: #64748b;
            font-style: italic;
          }
          .city-pin {
            font-size: 11px;
            color: #0f172a;
            margin-top: 2px;
          }
          .phone-row {
            font-size: 11px;
            color: #0f172a;
            margin-top: 3px;
          }
          .otp-pill {
            display: inline-block;
            background: #fef08a;
            border: 1px dashed #854d0e;
            color: #854d0e;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9.5px;
            margin-top: 4px;
          }

          /* Items Box */
          .items-box {
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 4px 6px;
            background: #fafafa;
            margin-bottom: 4px;
          }
          .items-mini-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
          }
          .items-mini-table th {
            text-align: left;
            color: #64748b;
            font-weight: 700;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 2px;
          }
          .items-mini-table td {
            padding: 2px 0;
            border-bottom: 0.5px solid #f1f5f9;
          }
          .item-name {
            max-width: 150px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-weight: 600;
          }
          .text-center { text-align: center; }
          .font-bold { font-weight: 700; }
          .more-items {
            font-size: 8px;
            color: #64748b;
            font-style: italic;
          }

          /* Footer */
          .quad-footer {
            border-top: 1.5px solid #0f172a;
            padding-top: 4px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 9px;
          }
          .muted-text { color: #64748b; }
          .muted-date { font-size: 8px; color: #94a3b8; }
          .footer-amt {
            text-align: right;
          }
          .amt-label {
            font-size: 8px;
            color: #64748b;
            display: block;
          }
          .amt-val {
            font-size: 13px;
            font-weight: 900;
            color: #0f172a;
          }

          /* Print Settings */
          @media print {
            body {
              background: none;
              padding: 0;
            }
            @page {
              size: A4 portrait;
              margin: 4mm;
            }
            .a4-page {
              box-shadow: none;
              padding: 2mm;
              width: 100%;
              height: 100%;
              gap: 3mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="a4-page">
          ${showCutLines ? `
            <span class="cut-icon-v-top">✂️</span>
            <div class="cut-line-v"></div>
            <span class="cut-icon-v-bottom">✂️</span>

            <span class="cut-icon-h-left">✂️</span>
            <div class="cut-line-h"></div>
            <span class="cut-icon-h-right">✂️</span>
          ` : ''}
          ${quadrantsHtml}
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

  // Direct Print Handler
  const handlePrint = () => {
    const html = buildA4PrintHtml();
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print shipping labels.');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    // Notify parent to mark these orders as printed
    const printedIds = selectedOrders.slice(0, 4).map(o => o._id);
    if (onPrintComplete) {
      onPrintComplete(printedIds);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border"
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          color: themeColors.text
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: themeColors.border }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#6366F120', color: '#6366F1' }}
            >
              <FaCut size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">4-in-1 A4 Shipping Label Printing</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                  {activeCount}/4 Selected
                </span>
              </div>
              <p className="text-xs opacity-70">
                Fit 4 parcel shipping labels on a single A4 sheet (2×2 Grid) with cutting guidelines.
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

        {/* Modal Body: Settings on Left, A4 Live Preview on Right */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Panel (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Selected Orders List */}
            <div className="p-3 rounded-xl border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                  Selected Orders ({activeCount})
                </span>
                <span className="text-[10px] opacity-60">Max 4 on A4</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedOrders.slice(0, 4).map((ord, idx) => (
                  <div
                    key={ord._id || idx}
                    className="p-2 rounded-lg border text-xs flex items-center justify-between"
                    style={{ borderColor: themeColors.border }}
                  >
                    <div>
                      <div className="font-bold truncate max-w-[150px]">
                        {ord.shippingAddress?.fullName || ord.user?.fullName || 'Customer'}
                      </div>
                      <div className="text-[10px] font-mono opacity-70">
                        #{ord.orderNumber || ord._id?.substring(0, 8)}
                      </div>
                    </div>
                    <span className="font-bold text-indigo-600">
                      ₹{ord.grandTotal || 0}
                    </span>
                  </div>
                ))}
                {activeCount < 4 && (
                  <div className="p-2 rounded-lg border border-dashed text-center text-xs opacity-60">
                    +{4 - activeCount} empty slot{4 - activeCount > 1 ? 's' : ''} (blank for cutting)
                  </div>
                )}
              </div>
            </div>

            {/* Hub / Company Header */}
            <div>
              <label className="block text-xs font-bold opacity-80 mb-1">Company / Logistics Hub</label>
              <input
                type="text"
                value={hubName}
                onChange={(e) => setHubName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border text-sm"
                style={{
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                  color: themeColors.text
                }}
                placeholder="SPARROW CART LOGISTICS"
              />
            </div>

            {/* Visible Elements Toggles */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80">
                Print Elements & Guides
              </label>
              <div className="space-y-2 text-xs">
                {[
                  { label: '✂️ Dotted Cut Lines & Scissors Guide', state: showCutLines, setter: setShowCutLines },
                  { label: '📦 Package Contents Table', state: showItemsTable, setter: setShowItemsTable },
                  { label: '🔑 Customer Delivery OTP Badge', state: showOtp, setter: setShowOtp },
                  { label: '📷 Scannable QR Code', state: showQr, setter: setShowQr },
                  { label: '🏷️ Code 39 Barcode (300 DPI Vector)', state: showBarcode, setter: setShowBarcode },
                ].map((item, idx) => (
                  <label
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none hover:bg-black/5"
                    style={{ borderColor: themeColors.border }}
                  >
                    <input
                      type="checkbox"
                      checked={item.state}
                      onChange={(e) => item.setter(e.target.checked)}
                      className="rounded accent-indigo-600 w-4 h-4"
                    />
                    <span className="font-medium">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <FaInfoCircle />
                A4 Paper Efficiency
              </div>
              Printing 4 labels per A4 sheet saves up to 75% paper cost. The dashed cut-lines ensure clean scissors or paper-cutter slicing.
            </div>
          </div>

          {/* A4 Sheet Visual Preview (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                A4 Sheet Live Preview (2×2 Grid)
              </span>
              <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full">
                Standard A4 (210mm × 297mm)
              </span>
            </div>

            {/* Scaled A4 Preview Sheet */}
            <div
              className="w-full max-w-[480px] aspect-[1/1.414] bg-white text-slate-900 rounded-xl shadow-xl border-2 border-slate-300 p-3 relative grid grid-cols-2 grid-rows-2 gap-2 overflow-hidden select-none"
            >
              {/* Cutting Guideline Overlay */}
              {showCutLines && (
                <>
                  <div className="absolute top-2 bottom-2 left-1/2 w-0 border-l border-dashed border-slate-400 pointer-events-none z-10 flex flex-col justify-between items-center -ml-[0.5px]">
                    <span className="text-[10px] -mt-1 bg-white px-0.5">✂️</span>
                    <span className="text-[10px] -mb-1 bg-white px-0.5">✂️</span>
                  </div>
                  <div className="absolute left-2 right-2 top-1/2 h-0 border-t border-dashed border-slate-400 pointer-events-none z-10 flex justify-between items-center -mt-[0.5px]">
                    <span className="text-[10px] -ml-1 bg-white py-0.5">✂️</span>
                    <span className="text-[10px] -mr-1 bg-white py-0.5">✂️</span>
                  </div>
                </>
              )}

              {/* 4 Quadrants Preview */}
              {slots.map((order, idx) => {
                if (!order) {
                  return (
                    <div
                      key={idx}
                      className="border border-dashed border-slate-300 rounded bg-slate-50 flex items-center justify-center p-2 text-center"
                    >
                      <span className="text-[10px] font-bold text-slate-400">
                        Slot {idx + 1}<br/>[ Blank for cutting ]
                      </span>
                    </div>
                  );
                }

                const orderNum = order.orderNumber || (order._id ? order._id.substring(order._id.length - 8).toUpperCase() : `ORD-${idx + 1}`);
                const isCod = order.paymentMethod?.toLowerCase() === 'cod';

                return (
                  <div
                    key={order._id || idx}
                    className="border border-slate-900 rounded p-1.5 flex flex-col justify-between bg-white text-[9px] overflow-hidden leading-tight"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
                      <span className="font-black text-[10px] tracking-tight">SPARROW CART</span>
                      <span className={`px-1 rounded font-bold text-[8px] ${isCod ? 'bg-black text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                        {isCod ? 'COD' : 'PAID'}
                      </span>
                    </div>

                    {/* Barcode & Order Number */}
                    <div className="bg-slate-50 p-0.5 rounded text-center my-0.5">
                      <div className="font-mono font-bold text-[8.5px]">#{orderNum}</div>
                    </div>

                    {/* Deliver To */}
                    <div className="border border-slate-200 rounded p-1 my-0.5 flex-1">
                      <div className="text-[7.5px] font-bold text-slate-500 uppercase">DELIVER TO:</div>
                      <div className="font-bold text-[10px] truncate">
                        {order.shippingAddress?.fullName || order.user?.fullName || 'Customer'}
                      </div>
                      <div className="text-[8px] text-slate-600 line-clamp-1">
                        {order.shippingAddress?.city}, {order.shippingAddress?.pincode}
                      </div>
                      <div className="text-[8px] font-bold mt-0.5">
                        📞 {order.shippingAddress?.mobile || order.user?.mobile || 'N/A'}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-800 pt-0.5 flex items-center justify-between text-[8px]">
                      <span className="truncate max-w-[80px]">{order.store?.storeName || 'SparrowCart'}</span>
                      <span className="font-black text-[9px]">₹{order.grandTotal || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
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
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 text-white shadow-lg hover:scale-105 active:scale-95 transition-all bg-indigo-600 hover:bg-indigo-700"
            >
              <FaPrint />
              Print A4 Sheet ({activeCount} Labels)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
