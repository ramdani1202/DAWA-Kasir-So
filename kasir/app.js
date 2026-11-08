// ===================== STATE & STORAGE =====================
const LS_KEYS = {
  queue: 'dawa_next_queue',
  history: 'dawa_history',
  unpaid: 'dawa_unpaid',
  freedQueues: 'dawa_freed_queues',
};

function loadQueue() {
  const v = localStorage.getItem(LS_KEYS.queue);
  return v ? parseInt(v, 10) : 1;
}
function saveQueue(n) {
  localStorage.setItem(LS_KEYS.queue, String(n));
}
function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.history) || '[]');
  } catch (e) { return []; }
}
function saveHistory(arr) {
  localStorage.setItem(LS_KEYS.history, JSON.stringify(arr));
}
function loadUnpaid() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.unpaid) || '[]');
  } catch (e) { return []; }
}
function saveUnpaid(arr) {
  localStorage.setItem(LS_KEYS.unpaid, JSON.stringify(arr));
}
function loadFreedQueues() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.freedQueues) || '[]');
  } catch (e) { return []; }
}
function saveFreedQueues(arr) {
  localStorage.setItem(LS_KEYS.freedQueues, JSON.stringify(arr));
}

let state = {
  nextQueue: loadQueue(),
  cart: {},        // key -> { id, name, unitLabel, qty (lines), price, lineQty }
  custName: '',
  orderType: 'dinein',   // 'dinein' | 'takeaway'
  history: loadHistory(),
  unpaidOrders: loadUnpaid(),
  freedQueues: loadFreedQueues(),   // nomor antrian bekas dibatalkan, siap dipakai lagi
};

// Ambil nomor antrian berikutnya: pakai nomor bekas (freed) dulu kalau ada, baru nomor baru
function takeNextQueueNumber() {
  if (state.freedQueues.length > 0) {
    state.freedQueues.sort((a, b) => a - b);
    const num = state.freedQueues.shift();
    saveFreedQueues(state.freedQueues);
    return num;
  }
  const num = state.nextQueue;
  state.nextQueue += 1;
  saveQueue(state.nextQueue);
  return num;
}

// Kembalikan nomor antrian ke pool (dipanggil saat pesanan dibatalkan / item riwayat dihapus)
function releaseQueueNumber(num) {
  if (!state.freedQueues.includes(num)) {
    state.freedQueues.push(num);
    saveFreedQueues(state.freedQueues);
  }
}

// Lihat nomor antrian berikutnya TANPA mengambilnya (untuk ditampilkan di UI)
function previewNextQueueNumber() {
  if (state.freedQueues.length > 0) {
    return Math.min(...state.freedQueues);
  }
  return state.nextQueue;
}

function orderTypeLabel(t) { return t === 'takeaway' ? 'Take Away' : 'Dine In'; }
function payTypeLabel(t) { return t === 'qris' ? 'QRIS' : 'Cash'; }

// ===================== HELPERS =====================
function rupiah(n) {
  return 'Rp' + n.toLocaleString('id-ID');
}
function pad2(n) {
  return String(n).padStart(2, '0');
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._tm);
  showToast._tm = setTimeout(() => t.classList.remove('show'), 1800);
}
function cartCount() {
  return Object.values(state.cart).reduce((s, l) => s + l.lineQty, 0);
}
function cartTotal() {
  return Object.values(state.cart).reduce((s, l) => s + l.price * l.lineQty, 0);
}

// ===================== RENDER MENU =====================
function renderMenuGrid(containerId, items) {
  const el = document.getElementById(containerId);
  el.innerHTML = items.map(item => {
    if (item.variants) {
      // kue with variants: sum qty across its variant keys
      const totalQty = item.variants.reduce((s, v) => {
        const k = item.id + '-' + v.qty;
        return s + (state.cart[k] ? state.cart[k].lineQty : 0);
      }, 0);
      return `
        <div class="menu-card ${totalQty > 0 ? 'has-qty' : ''}" data-kue="${item.id}">
          <div class="qtytag">${totalQty}x</div>
          <div class="thumb">${svgIcon(item.icon, {size:26, strokeWidth:1.6})}</div>
          <div class="info">
            <div class="mname">${item.name}</div>
            <div class="mprice">Mulai ${rupiah(Math.min(...item.variants.map(v=>v.price)))}</div>
          </div>
          <div class="addbadge">${svgIcon('plus', {size:13, strokeWidth:2.4})}</div>
        </div>`;
    } else {
      const inCart = state.cart[item.id];
      const qty = inCart ? inCart.lineQty : 0;
      return `
        <div class="menu-card ${qty > 0 ? 'has-qty' : ''}" data-simple="${item.id}">
          <div class="qtytag">${qty}x</div>
          <div class="thumb">${svgIcon(item.icon, {size:26, strokeWidth:1.6})}</div>
          <div class="info">
            <div class="mname">${item.name}</div>
            <div class="mprice">${rupiah(item.price)}</div>
          </div>
          <div class="addbadge">${svgIcon('plus', {size:13, strokeWidth:2.4})}</div>
        </div>`;
    }
  }).join('');
}

function renderAllMenus() {
  renderMenuGrid('grid-original', MENU.original);
  renderMenuGrid('grid-susu', MENU.susu);
  renderMenuGrid('grid-kue', MENU.kue);
}

// ===================== CART LOGIC =====================
function addSimpleItem(item) {
  const key = item.id;
  if (!state.cart[key]) {
    state.cart[key] = { key, name: item.name, unitLabel: '', price: item.price, lineQty: 0 };
  }
  state.cart[key].lineQty += 1;
  onCartChanged();
  showToast(`${item.name} ditambahkan`);
}

function addKueVariant(kueItem, variant) {
  const key = kueItem.id + '-' + variant.qty;
  if (!state.cart[key]) {
    state.cart[key] = {
      key, name: kueItem.name, unitLabel: variant.label,
      price: variant.price, lineQty: 0
    };
  }
  state.cart[key].lineQty += 1;
  onCartChanged();
  showToast(`${kueItem.name} (${variant.label}) ditambahkan`);
}

function changeLineQty(key, delta) {
  const line = state.cart[key];
  if (!line) return;
  line.lineQty += delta;
  if (line.lineQty <= 0) delete state.cart[key];
  onCartChanged();
}

function onCartChanged() {
  renderAllMenus();
  renderCart();
  updateBottomBars();
}

// ===================== RENDER CART =====================
function renderCart() {
  const listEl = document.getElementById('cartList');
  const sumEl = document.getElementById('cartSummary');
  const lines = Object.values(state.cart);

  if (lines.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="ic">${svgIcon('bag', {size:36})}</div>
        <div class="msg">Keranjang masih kosong.<br>Yuk pilih menu dulu.</div>
      </div>`;
    sumEl.innerHTML = '';
    return;
  }

  listEl.innerHTML = lines.map(l => `
    <div class="cart-line" data-k="${l.key}">
      <div class="cl-info">
        <div class="cl-name">${l.name}${l.unitLabel ? ' · ' + l.unitLabel : ''}</div>
        <div class="cl-sub">${rupiah(l.price)} / item</div>
        <div class="cl-price">${rupiah(l.price * l.lineQty)}</div>
      </div>
      <div class="stepper">
        <button data-dec="${l.key}">−</button>
        <div class="qv">${l.lineQty}</div>
        <button data-inc="${l.key}">+</button>
      </div>
    </div>
  `).join('');

  const total = cartTotal();
  sumEl.innerHTML = `
    <div class="cart-summary">
      <div class="cs-col"><b>${cartCount()}</b><span>Item</span></div>
      <div class="cs-col"><b>${lines.length}</b><span>Menu</span></div>
      <div class="cs-col"><b>#${pad2(previewNextQueueNumber())}</b><span>Antrian</span></div>
      <div class="cs-col"><b>${Math.round(total/1000)}rb</b><span>Rupiah</span></div>
    </div>
    <div class="cart-total">
      <div class="ct-total">Total: ${rupiah(total)}</div>
      <div class="ct-note">${svgIcon('receipt', {size:16})} Antrian #${pad2(previewNextQueueNumber())} siap disimpan</div>
    </div>
  `;
}

// ===================== BOTTOM BARS / FAB =====================
function updateBottomBars() {
  const view = document.querySelector('.view.active').id;
  const count = cartCount();
  const total = cartTotal();

  document.getElementById('bottomBarOrder').style.display = (view === 'view-order' && count > 0) ? 'block' : 'none';
  document.getElementById('bottomBarCart').style.display = (view === 'view-cart') ? 'block' : 'none';

  document.getElementById('btnGoCartTotal').textContent = rupiah(total);
  document.getElementById('checkoutQueueNum').textContent = pad2(previewNextQueueNumber());

  const checkoutBtn = document.getElementById('btnCheckout');
  checkoutBtn.disabled = count === 0;

  // FAB
  const fab = document.getElementById('fabCart');
  const badge = document.getElementById('fabBadge');
  if (view === 'view-order' && count > 0) {
    fab.style.display = 'flex';
    badge.style.display = 'flex';
    badge.textContent = count;
  } else {
    fab.style.display = 'none';
  }
}

// ===================== TABS / VIEWS =====================
function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  updateBottomBars();
  if (name === 'history') renderHistory();
  if (name === 'unpaid') renderUnpaidList();
}

// ===================== QUEUE CHIP =====================
function renderQueueChip() {
  document.getElementById('queueChipNum').textContent = pad2(previewNextQueueNumber());
}

// ===================== CHECKOUT (SIMPAN PESANAN, BELUM BAYAR) =====================
function doCheckout() {
  if (cartCount() === 0) return;
  const lines = Object.values(state.cart);
  const total = cartTotal();
  const queueNum = takeNextQueueNumber();
  const name = document.getElementById('custName').value.trim();
  const now = new Date();

  const order = {
    id: 'ord_' + Date.now(),
    queue: queueNum,
    name: name || '-',
    orderType: state.orderType,
    items: lines.map(l => ({ name: l.name, unitLabel: l.unitLabel, price: l.price, qty: l.lineQty })),
    total,
    time: now.toISOString(),
  };

  state.unpaidOrders.unshift(order);
  saveUnpaid(state.unpaidOrders);

  showTicket(order, false);

  // reset cart, name, and selectors back to default
  state.cart = {};
  document.getElementById('custName').value = '';
  state.orderType = 'dinein';
  syncOrderTypeUI();
  onCartChanged();
  renderQueueChip();
  renderUnpaidDot();
}

function syncOrderTypeUI() {
  document.querySelectorAll('#orderTypeRow button').forEach(b => {
    b.classList.toggle('active', b.dataset.type === state.orderType);
  });
}

function showTicket(order, isPaid, payType) {
  document.getElementById('ticketQnum').textContent = pad2(order.queue);
  document.getElementById('ticketName').textContent = order.name;
  document.getElementById('ticketOrderType').textContent = orderTypeLabel(order.orderType);
  document.getElementById('ticketPayType').innerHTML = isPaid
    ? svgIcon('check-circle', {size:13, cls:'inline-ic'}) + ' Lunas · ' + payTypeLabel(payType)
    : svgIcon('clock', {size:13, cls:'inline-ic'}) + ' Belum Dibayar';
  const t = new Date(order.time);
  document.getElementById('ticketTime').textContent = t.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  document.getElementById('ticketItems').innerHTML = order.items.map(it => `
    <div class="ti-row">
      <span>${it.qty}x ${it.name}${it.unitLabel ? ' (' + it.unitLabel + ')' : ''}</span>
      <span>${rupiah(it.price * it.qty)}</span>
    </div>
  `).join('');
  document.getElementById('ticketTotal').textContent = rupiah(order.total);
  document.getElementById('ticketOverlay').classList.add('show');
}

// ===================== UNPAID ORDERS VIEW =====================
function renderUnpaidDot() {
  document.getElementById('unpaidDot').style.display = state.unpaidOrders.length > 0 ? 'inline-block' : 'none';
}

function renderUnpaidList() {
  const listEl = document.getElementById('unpaidList');
  renderUnpaidDot();

  if (state.unpaidOrders.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="ic">${svgIcon('clock', {size:36})}</div>
        <div class="msg">Tidak ada pesanan yang belum dibayar.</div>
      </div>`;
    return;
  }

  listEl.innerHTML = state.unpaidOrders.map(o => {
    const t = new Date(o.time);
    const itemsStr = o.items.map(it => `${it.qty}x ${it.name}${it.unitLabel ? ' (' + it.unitLabel + ')' : ''}`).join('<br>');
    const otIcon = o.orderType === 'takeaway' ? svgIcon('takeaway', {size:11, cls:'inline-ic'}) : svgIcon('dine-in', {size:11, cls:'inline-ic'});
    const otLabel = o.orderType === 'takeaway' ? 'Take Away' : 'Dine In';
    return `
      <div class="unpaid-card">
        <div class="unpaid-top">
          <div class="unpaid-q">
            <div class="unpaid-qnum">#${pad2(o.queue)}</div>
            <div class="unpaid-name">${o.name}</div>
          </div>
          <div class="unpaid-time">${t.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div style="display:flex; gap:6px; margin-top:6px;">
          <span class="badge-tag badge-dinein">${otIcon} ${otLabel}</span>
          <span class="badge-tag badge-unpaid">${svgIcon('clock', {size:11, cls:'inline-ic'})} Belum Bayar</span>
        </div>
        <div class="unpaid-items">${itemsStr}</div>
        <div class="unpaid-total">${rupiah(o.total)}</div>
        <div class="unpaid-actions">
          <button class="btn-batal" data-cancel="${o.id}">Batalkan</button>
          <button class="btn-lunas" data-lunas="${o.id}">${svgIcon('check-circle', {size:13, cls:'inline-ic'})} Tandai Lunas</button>
        </div>
      </div>
    `;
  }).join('');
}

let activePayOrderId = null;
let selectedPayType = 'cash';

function openPayOverlay(orderId) {
  activePayOrderId = orderId;
  selectedPayType = 'cash';
  syncPayModalUI();
  document.getElementById('payOverlay').classList.add('show');
}
function closePayOverlay() {
  document.getElementById('payOverlay').classList.remove('show');
  activePayOrderId = null;
}
function syncPayModalUI() {
  document.getElementById('payCashBtn').classList.toggle('active', selectedPayType === 'cash');
  document.getElementById('payQrisBtn').classList.toggle('active', selectedPayType === 'qris');
}

function confirmMarkPaid() {
  if (!activePayOrderId) return;
  const idx = state.unpaidOrders.findIndex(o => o.id === activePayOrderId);
  if (idx === -1) return;
  const order = state.unpaidOrders[idx];

  const trx = { ...order, payType: selectedPayType, paidTime: new Date().toISOString() };
  state.history.unshift(trx);
  saveHistory(state.history);

  state.unpaidOrders.splice(idx, 1);
  saveUnpaid(state.unpaidOrders);

  closePayOverlay();
  renderUnpaidList();
  showToast(`Pesanan #${pad2(order.queue)} ditandai lunas`);
}

function cancelUnpaidOrder(orderId) {
  const idx = state.unpaidOrders.findIndex(o => o.id === orderId);
  if (idx === -1) return;
  const order = state.unpaidOrders[idx];
  if (!confirm(`Batalkan pesanan #${pad2(order.queue)} (${order.name})?\n\nNomor antrian #${pad2(order.queue)} akan dipakai lagi untuk pesanan berikutnya.`)) return;
  state.unpaidOrders.splice(idx, 1);
  saveUnpaid(state.unpaidOrders);
  releaseQueueNumber(order.queue);
  renderUnpaidList();
  renderQueueChip();
  updateBottomBars();
  showToast(`Pesanan dibatalkan · Antrian #${pad2(order.queue)} bisa dipakai lagi`);
}

// ===================== HISTORY VIEW =====================
function isToday(iso) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function renderHistory() {
  const listEl = document.getElementById('historyList');
  const todays = state.history.filter(h => isToday(h.time));

  document.getElementById('statCount').textContent = todays.length;
  document.getElementById('statTotal').textContent = rupiah(todays.reduce((s, h) => s + h.total, 0));

  const cashTotal = todays.filter(h => h.payType !== 'qris').reduce((s, h) => s + h.total, 0);
  const qrisTotal = todays.filter(h => h.payType === 'qris').reduce((s, h) => s + h.total, 0);
  document.getElementById('statCash').textContent = rupiah(cashTotal);
  document.getElementById('statQris').textContent = rupiah(qrisTotal);

  if (state.history.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="ic">${svgIcon('receipt', {size:36})}</div>
        <div class="msg">Belum ada transaksi.</div>
      </div>`;
    return;
  }

  listEl.innerHTML = state.history.map(h => {
    const t = new Date(h.time);
    const otIcon = h.orderType === 'takeaway' ? svgIcon('takeaway', {size:11, cls:'inline-ic'}) : svgIcon('dine-in', {size:11, cls:'inline-ic'});
    const otLabel = h.orderType === 'takeaway' ? 'Take Away' : 'Dine In';
    const payBadgeClass = h.payType === 'qris' ? 'badge-qris' : 'badge-cash';
    const payIcon = h.payType === 'qris' ? svgIcon('qris', {size:11, cls:'inline-ic'}) : svgIcon('cash', {size:11, cls:'inline-ic'});
    const payLabel = h.payType === 'qris' ? 'QRIS' : 'Cash';
    const itemsHtml = h.items.map((it, itemIdx) => `
      <div class="hist-item-row" data-trx="${h.id}" data-itemidx="${itemIdx}">
        <span class="hi-label">${it.qty}x ${it.name}${it.unitLabel ? ' (' + it.unitLabel + ')' : ''}</span>
        <span class="hi-price">${rupiah(it.price * it.qty)}</span>
        <button class="hi-del" data-delitem="${h.id}|${itemIdx}" title="Hapus item ini">${svgIcon('close', {size:11, strokeWidth:2.4})}</button>
      </div>
    `).join('');
    return `
      <div class="hist-card">
        <div class="hist-top">
          <div class="hist-q">
            <div class="hist-qnum">#${pad2(h.queue)}</div>
            <div class="hist-name">${h.name}</div>
          </div>
          <div class="hist-time">${t.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div style="display:flex; gap:6px; margin-top:6px;">
          <span class="badge-tag badge-dinein">${otIcon} ${otLabel}</span>
          <span class="badge-tag ${payBadgeClass}">${payIcon} ${payLabel}</span>
        </div>
        <div class="hist-items">${itemsHtml}</div>
        <div class="hist-bottom-row">
          <button class="btn-del-trx" data-deltrx="${h.id}">${svgIcon('trash', {size:12, cls:'inline-ic'})} Hapus Transaksi Ini</button>
          <div class="hist-total">${rupiah(h.total)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// Hapus satu item dari sebuah transaksi riwayat.
// Kalau item terakhir dihapus, seluruh transaksi ikut terhapus dan nomor antriannya dilepas.
function deleteHistoryItem(trxId, itemIdx) {
  const trx = state.history.find(h => h.id === trxId);
  if (!trx) return;
  const item = trx.items[itemIdx];
  if (!item) return;

  if (!confirm(`Hapus "${item.qty}x ${item.name}${item.unitLabel ? ' (' + item.unitLabel + ')' : ''}" dari transaksi #${pad2(trx.queue)}?`)) return;

  const itemTotal = item.price * item.qty;
  trx.items.splice(itemIdx, 1);
  trx.total -= itemTotal;

  if (trx.items.length === 0) {
    // tidak ada item tersisa, hapus seluruh transaksi & lepas nomor antrian
    state.history = state.history.filter(h => h.id !== trxId);
    releaseQueueNumber(trx.queue);
    renderQueueChip();
    showToast(`Item dihapus · Transaksi #${pad2(trx.queue)} ikut terhapus`);
  } else {
    showToast('Item dihapus dari riwayat');
  }

  saveHistory(state.history);
  renderHistory();
}

// Hapus seluruh transaksi dari riwayat (misal salah input semua) & lepas nomor antriannya
function deleteHistoryTrx(trxId) {
  const trx = state.history.find(h => h.id === trxId);
  if (!trx) return;
  if (!confirm(`Hapus seluruh transaksi #${pad2(trx.queue)} (${trx.name})?\n\nNomor antrian #${pad2(trx.queue)} akan dipakai lagi untuk pesanan berikutnya.`)) return;
  state.history = state.history.filter(h => h.id !== trxId);
  saveHistory(state.history);
  releaseQueueNumber(trx.queue);
  renderQueueChip();
  renderHistory();
  showToast(`Transaksi #${pad2(trx.queue)} dihapus`);
}

// ===================== PDF EXPORT =====================
function downloadPdf() {
  const todays = state.history.filter(h => isToday(h.time));
  if (todays.length === 0) {
    showToast('Belum ada transaksi hari ini');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;
  let y = 50;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(61, 40, 23);
  doc.text('DAWA - Minuman Rempah', marginX, y);
  y += 20;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 90, 90);
  const now = new Date();
  doc.text('Rekap Transaksi - ' + now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), marginX, y);
  y += 25;

  doc.setDrawColor(200, 190, 170);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 20;

  // sorted oldest first for the report
  const sorted = [...todays].sort((a, b) => new Date(a.time) - new Date(b.time));
  let grandTotal = 0;

  sorted.forEach((h, idx) => {
    if (y > 760) { doc.addPage(); y = 50; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(192, 71, 42);
    const t = new Date(h.time);
    const timeStr = t.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    doc.text(`#${pad2(h.queue)}  ${h.name}`, marginX, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(10);
    doc.text(timeStr, pageWidth - marginX, y, { align: 'right' });
    y += 14;

    doc.setFontSize(9);
    doc.setTextColor(140, 130, 110);
    const otLabel = h.orderType === 'takeaway' ? 'Take Away' : 'Dine In';
    const payLabel = h.payType === 'qris' ? 'QRIS' : 'Cash';
    doc.text(`${otLabel}  ·  ${payLabel}`, marginX, y);
    y += 14;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    h.items.forEach(it => {
      if (y > 770) { doc.addPage(); y = 50; }
      const label = `${it.qty}x ${it.name}${it.unitLabel ? ' (' + it.unitLabel + ')' : ''}`;
      const lineTotal = rupiah(it.price * it.qty);
      doc.text(label, marginX + 10, y);
      doc.text(lineTotal, pageWidth - marginX, y, { align: 'right' });
      y += 14;
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(40, 27, 15);
    doc.text('Subtotal', marginX + 10, y);
    doc.text(rupiah(h.total), pageWidth - marginX, y, { align: 'right' });
    y += 14;

    grandTotal += h.total;

    doc.setDrawColor(230, 224, 210);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 16;
  });

  const cashTotal = sorted.filter(h => h.payType !== 'qris').reduce((s, h) => s + h.total, 0);
  const qrisTotal = sorted.filter(h => h.payType === 'qris').reduce((s, h) => s + h.total, 0);

  if (y > 700) { doc.addPage(); y = 50; }
  y += 6;
  doc.setDrawColor(200, 190, 170);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(92, 122, 82);
  doc.text('Omset Cash', marginX, y);
  doc.text(rupiah(cashTotal), pageWidth - marginX, y, { align: 'right' });
  y += 16;

  doc.setTextColor(52, 82, 160);
  doc.text('Omset QRIS', marginX, y);
  doc.text(rupiah(qrisTotal), pageWidth - marginX, y, { align: 'right' });
  y += 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(61, 40, 23);
  doc.text('TOTAL OMSET HARI INI', marginX, y);
  doc.text(rupiah(grandTotal), pageWidth - marginX, y, { align: 'right' });
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  y += 20;
  doc.text(`Jumlah transaksi: ${sorted.length}`, marginX, y);
  y += 12;
  doc.text('Dibuat otomatis oleh Kasir DAWA App', marginX, y);

  const fname = `Rekap-DAWA-${now.getFullYear()}${pad2(now.getMonth()+1)}${pad2(now.getDate())}.pdf`;
  doc.save(fname);
  showToast('PDF rekap berhasil diunduh');
}

// ===================== RESET DATA =====================
function resetAllData() {
  if (!confirm('Yakin ingin reset semua data?\n\nSemua riwayat transaksi, pesanan belum bayar, dan nomor antrian akan direset. Tindakan ini tidak bisa dibatalkan.')) return;
  localStorage.setItem('dawa_reset_at', new Date().toISOString()); // sinyal ke SO: tutup buku, jangan kembalikan stok
  state.history = [];
  saveHistory(state.history);
  state.unpaidOrders = [];
  saveUnpaid(state.unpaidOrders);
  state.freedQueues = [];
  saveFreedQueues(state.freedQueues);
  state.nextQueue = 1;
  saveQueue(state.nextQueue);
  state.cart = {};
  renderQueueChip();
  onCartChanged();
  renderHistory();
  renderUnpaidDot();
  showToast('Semua data telah direset');
}

// ===================== EVENT BINDINGS =====================
document.addEventListener('DOMContentLoaded', () => {
  renderAllMenus();
  renderCart();
  renderQueueChip();
  updateBottomBars();
  syncOrderTypeUI();
  renderUnpaidDot();

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Menu grid clicks (event delegation)
  document.getElementById('view-order').addEventListener('click', (e) => {
    const simpleCard = e.target.closest('[data-simple]');
    const kueCard = e.target.closest('[data-kue]');
    if (simpleCard) {
      const id = simpleCard.dataset.simple;
      const allItems = [...MENU.original, ...MENU.susu];
      const item = allItems.find(i => i.id === id);
      if (item) addSimpleItem(item);
    } else if (kueCard) {
      const id = kueCard.dataset.kue;
      const item = MENU.kue.find(i => i.id === id);
      if (item) openKuePicker(item);
    }
  });

  // Cart stepper clicks
  document.getElementById('cartList').addEventListener('click', (e) => {
    const inc = e.target.closest('[data-inc]');
    const dec = e.target.closest('[data-dec]');
    if (inc) changeLineQty(inc.dataset.inc, 1);
    if (dec) changeLineQty(dec.dataset.dec, -1);
  });

  // FAB -> go to cart
  document.getElementById('fabCart').addEventListener('click', () => switchView('cart'));
  document.getElementById('btnGoCart').addEventListener('click', () => switchView('cart'));

  // Checkout
  document.getElementById('btnCheckout').addEventListener('click', doCheckout);

  // Ticket overlay
  document.getElementById('ticketClose').addEventListener('click', () => {
    document.getElementById('ticketOverlay').classList.remove('show');
    renderUnpaidDot();
    switchView('order');
  });
  document.getElementById('ticketNew').addEventListener('click', () => {
    document.getElementById('ticketOverlay').classList.remove('show');
    renderUnpaidDot();
    switchView('order');
  });

  // Kue picker
  document.getElementById('pickerCancel').addEventListener('click', closeKuePicker);
  document.getElementById('pickerOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'pickerOverlay') closeKuePicker();
  });

  // Queue chip -> open queue set sheet
  document.getElementById('queueChip').addEventListener('click', () => {
    document.getElementById('queueInput').value = previewNextQueueNumber();
    document.getElementById('queueOverlay').classList.add('show');
  });
  document.getElementById('queueCancel').addEventListener('click', () => {
    document.getElementById('queueOverlay').classList.remove('show');
  });
  document.getElementById('queueOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'queueOverlay') document.getElementById('queueOverlay').classList.remove('show');
  });
  document.getElementById('queueSetBtn').addEventListener('click', () => {
    const v = parseInt(document.getElementById('queueInput').value, 10);
    if (!v || v < 1) { showToast('Masukkan nomor yang valid'); return; }
    state.nextQueue = v;
    saveQueue(v);
    state.freedQueues = [];
    saveFreedQueues(state.freedQueues);
    renderQueueChip();
    updateBottomBars();
    document.getElementById('queueOverlay').classList.remove('show');
    showToast('Nomor antrian diatur ke ' + pad2(v));
  });

  // History actions
  document.getElementById('btnDownloadPdf').addEventListener('click', downloadPdf);
  document.getElementById('btnResetData').addEventListener('click', resetAllData);

  // History list: delete single item or whole transaction
  document.getElementById('historyList').addEventListener('click', (e) => {
    const delItemBtn = e.target.closest('[data-delitem]');
    const delTrxBtn = e.target.closest('[data-deltrx]');
    if (delItemBtn) {
      const [trxId, itemIdx] = delItemBtn.dataset.delitem.split('|');
      deleteHistoryItem(trxId, parseInt(itemIdx, 10));
    } else if (delTrxBtn) {
      deleteHistoryTrx(delTrxBtn.dataset.deltrx);
    }
  });

  // custName input keep in state (not strictly required, read on checkout)
  document.getElementById('custName').addEventListener('input', (e) => {
    state.custName = e.target.value;
  });

  // Order type toggle
  document.getElementById('orderTypeRow').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    state.orderType = btn.dataset.type;
    syncOrderTypeUI();
  });

  // Category pill switch
  document.getElementById('catScroller').addEventListener('click', (e) => {
    const pill = e.target.closest('.cat-pill');
    if (!pill) return;
    document.querySelectorAll('.cat-pill').forEach(p => p.classList.toggle('active', p === pill));
    document.querySelectorAll('.cat-section').forEach(sec => {
      sec.style.display = (sec.id === 'cat-' + pill.dataset.cat) ? 'block' : 'none';
    });
  });

  // Unpaid list actions (mark as paid / cancel)
  document.getElementById('unpaidList').addEventListener('click', (e) => {
    const lunasBtn = e.target.closest('[data-lunas]');
    const cancelBtn = e.target.closest('[data-cancel]');
    if (lunasBtn) openPayOverlay(lunasBtn.dataset.lunas);
    if (cancelBtn) cancelUnpaidOrder(cancelBtn.dataset.cancel);
  });

  // Pay overlay (mark paid modal)
  document.getElementById('payCashBtn').addEventListener('click', () => {
    selectedPayType = 'cash'; syncPayModalUI();
  });
  document.getElementById('payQrisBtn').addEventListener('click', () => {
    selectedPayType = 'qris'; syncPayModalUI();
  });
  document.getElementById('payConfirmBtn').addEventListener('click', confirmMarkPaid);
  document.getElementById('payCancel').addEventListener('click', closePayOverlay);
  document.getElementById('payOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'payOverlay') closePayOverlay();
  });

  setupInstallPrompt();
  registerServiceWorker();

  // Hide splash screen with a small minimum-display time so it doesn't just flash
  const splashStart = Date.now();
  const minSplashMs = 550;
  const hideSplash = () => {
    const elapsed = Date.now() - splashStart;
    const wait = Math.max(0, minSplashMs - elapsed);
    setTimeout(() => {
      const splash = document.getElementById('splash');
      if (splash) splash.classList.add('hide');
    }, wait);
  };
  if (document.readyState === 'complete') {
    hideSplash();
  } else {
    window.addEventListener('load', hideSplash);
    setTimeout(hideSplash, 2000); // safety fallback
  }
});

// ===================== KUE PICKER =====================
let activeKue = null;
function openKuePicker(kueItem) {
  activeKue = kueItem;
  document.getElementById('pickerTitle').textContent = kueItem.name;
  const optsEl = document.getElementById('pickerOptions');
  optsEl.innerHTML = kueItem.variants.map((v, idx) => `
    <div class="picker-opt" data-vidx="${idx}">
      <div class="left">
        <b>${v.label}</b>
        <span>${kueItem.name}</span>
      </div>
      <div class="price">${rupiah(v.price)}</div>
    </div>
  `).join('');
  optsEl.querySelectorAll('.picker-opt').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.vidx, 10);
      addKueVariant(activeKue, activeKue.variants[idx]);
      closeKuePicker();
    });
  });
  document.getElementById('pickerOverlay').classList.add('show');
}
function closeKuePicker() {
  document.getElementById('pickerOverlay').classList.remove('show');
  activeKue = null;
}

// ===================== PWA INSTALL =====================
let deferredPrompt = null;
function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installBanner').classList.add('show');
  });
  document.getElementById('installBtn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    document.getElementById('installBanner').classList.remove('show');
  });
  window.addEventListener('appinstalled', () => {
    document.getElementById('installBanner').classList.remove('show');
  });
}

function registerServiceWorker() {
  return; // SW dikelola app induk (../sw.js)
  if (!('serviceWorker' in navigator)) return;
  // Reload otomatis sekali saat service worker baru mengambil alih
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
    reg.update();
    // Cek update saat aplikasi dibuka kembali & tiap 30 menit
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update();
    });
    setInterval(() => reg.update(), 30 * 60 * 1000);
  }).catch(() => {});
}
