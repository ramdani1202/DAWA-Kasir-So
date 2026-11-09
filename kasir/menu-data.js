// Data menu DAWA - Minuman Rempah
const MENU = {
  original: [
    { id: 'ori-1', name: 'Rempah Original', price: 16000, icon: 'drink-jar' },
    { id: 'ori-2', name: 'Rempah Kencur + Madu', price: 17000, icon: 'drink-honey' },
    { id: 'ori-3', name: 'Rempah Temulawak + Madu', price: 17000, icon: 'drink-jar' },
    { id: 'ori-4', name: 'Rempah Jahe Lemon + Madu', price: 17000, icon: 'drink-lemon' },
    { id: 'ori-5', name: 'Ranjang Kopi Hitam', price: 18000, icon: 'coffee-cup' },
    { id: 'ori-6', name: 'Bir Pletok Original + Madu', price: 17000, icon: 'drink-glass' },
    { id: 'ori-7', name: 'Wedang Uwuh', price: 13000, icon: 'drink-tea' },
    { id: 'ori-8', name: 'Rempah Kunyit Madu', price: 18000, icon: 'drink-honey' },
    { id: 'ori-9', name: 'Rempah Kunyit Asem', price: 18000, icon: 'drink-jar' },
  ],
  susu: [
    { id: 'susu-1', name: 'STMJ', price: 21000, icon: 'drink-milk' },
    { id: 'susu-2', name: 'Rempah Susu Aren + Madu', price: 17000, icon: 'drink-milk' },
    { id: 'susu-3', name: 'Temulawak Susu', price: 18000, icon: 'drink-milk' },
    { id: 'susu-4', name: 'Lemon Susu + Madu', price: 18000, icon: 'drink-lemon' },
    { id: 'susu-5', name: 'Ranjang Kopi Susu', price: 19000, icon: 'coffee-cup' },
    { id: 'susu-6', name: 'Bir Pletok Susu', price: 18000, icon: 'drink-milk' },
  ],
  // Kue - punya pilihan jumlah (1 pcs / 3 pcs) dengan harga beda
  kue: [
    {
      id: 'kue-1', name: 'Bangke Jahe', icon: 'cookie',
      variants: [
        { label: '1 pcs', qty: 1, price: 2000 },
        { label: '3 pcs', qty: 3, price: 5000 },
      ]
    },
    {
      id: 'kue-2', name: 'Bolu', icon: 'cupcake',
      variants: [
        { label: '1 pcs', qty: 1, price: 2000 },
        { label: '3 pcs', qty: 3, price: 5000 },
      ]
    },
  ]
};
