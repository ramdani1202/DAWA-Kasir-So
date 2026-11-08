// Daftar "Rekomendasi untuk Anda" di layar keranjang.
// Hanya memakai MENU, addSimpleItem() dan openKuePicker() yang sudah ada.
(function () {
  function build() {
    var el = document.getElementById('recList');
    if (!el || typeof MENU === 'undefined') return;
    var items = MENU.original.concat(MENU.susu, MENU.kue);
    el.innerHTML = items.map(function (i) {
      var price = i.variants ? 'Mulai ' + rupiah(Math.min.apply(null, i.variants.map(function (v) { return v.price; }))) : rupiah(i.price);
      return '<div class="rec-card" data-rec="' + i.id + '" data-k="' + i.id + '">' +
        '<div class="rec-thumb">' + svgIcon(i.icon, { size: 36, strokeWidth: 1.5 }) + '</div>' +
        '<div class="rec-name">' + i.name + '</div>' +
        '<div class="rec-price">' + price + '</div></div>';
    }).join('');
    el.addEventListener('click', function (e) {
      var card = e.target.closest('[data-rec]');
      if (!card) return;
      var id = card.dataset.rec;
      var simple = MENU.original.concat(MENU.susu).find(function (i) { return i.id === id; });
      if (simple) { addSimpleItem(simple); return; }
      var kue = MENU.kue.find(function (i) { return i.id === id; });
      if (kue) openKuePicker(kue);
    });
  }
  document.addEventListener('DOMContentLoaded', build);
})();
