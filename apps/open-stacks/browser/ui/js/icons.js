// Small type icons: what kind of thing an item is (paper, book, wiki page,
// post, report, rules, old scan), plus LessWrong and EA Forum marks for posts
// from those sites. Line icons are from Lucide (ISC licence, lucide.dev); the
// two forum marks are from QURI's Roast My Post (apps/web/src/components/icons).

const LINE = {
 "file-text": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\" /> <path d=\"M14 2v4a2 2 0 0 0 2 2h4\" /> <path d=\"M10 9H8\" /> <path d=\"M16 13H8\" /> <path d=\"M16 17H8\" />",
 "book-open": "<path d=\"M12 7v14\" /> <path d=\"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z\" />",
 "library": "<path d=\"m16 6 4 14\" /> <path d=\"M12 6v14\" /> <path d=\"M8 8v12\" /> <path d=\"M4 4v16\" />",
 "newspaper": "<path d=\"M15 18h-5\" /> <path d=\"M18 14h-8\" /> <path d=\"M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2\" /> <rect width=\"8\" height=\"4\" x=\"10\" y=\"6\" rx=\"1\" />",
 "file-chart-column": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\" /> <path d=\"M14 2v4a2 2 0 0 0 2 2h4\" /> <path d=\"M8 18v-1\" /> <path d=\"M12 18v-6\" /> <path d=\"M16 18v-3\" />",
 "scroll": "<path d=\"M19 17V5a2 2 0 0 0-2-2H4\" /> <path d=\"M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3\" />",
 "dices": "<rect width=\"12\" height=\"12\" x=\"2\" y=\"10\" rx=\"2\" ry=\"2\" /> <path d=\"m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6\" /> <path d=\"M6 18h.01\" /> <path d=\"M10 14h.01\" /> <path d=\"M15 6h.01\" /> <path d=\"M18 9h.01\" />",
 "graduation-cap": "<path d=\"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z\" /> <path d=\"M22 10v6\" /> <path d=\"M6 12.5V16a6 3 0 0 0 12 0v-3.5\" />",
 "globe": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20\" /> <path d=\"M2 12h20\" />"
};
const FILLED = { lesswrong: "<path d=\"M23.25,11.03223l-5.64685-1.45825,2.59802-4.40601c.23145-.39258.16797-.89258-.1543-1.21484-.32227-.32129-.82227-.38672-1.21484-.1543l-4.40588,2.5979-1.45789-5.64673c-.11377-.44141-.51221-.75-.96826-.75s-.85449.30859-.96826.75l-1.45789,5.64673-4.40588-2.5979c-.39258-.2334-.89355-.16699-1.21484.1543-.32275.32227-.38623.82227-.1543,1.21484l2.59802,4.40601-5.64685,1.45825c-.44141.11328-.75.51172-.75.96777s.30859.85449.75.96777l5.64648,1.45819-2.59766,4.40607c-.23193.39258-.16797.89258.1543,1.21484.19287.19238.44873.29297.70752.29297.17383,0,.34961-.04492.50732-.13867l4.40588-2.5979,1.45789,5.64673c.11377.44141.51221.75.96826.75s.85449-.30859.96826-.75l1.45789-5.64673,4.40588,2.5979c.1582.09375.33301.13867.50781.13867.25879,0,.51465-.10059.70703-.29297.32227-.32227.38574-.82227.1543-1.21484l-2.59802-4.40601,5.64685-1.45825c.44141-.11328.75-.51172.75-.96777s-.30859-.85449-.75-.96777ZM16.51074,7.48926l-.92236,1.56439-.51025-.13177-.13177-.51031,1.56439-.9223ZM7.48926,7.48926l1.56439.9223-.13177.51031-.51025.13177-.92236-1.56439ZM7.48877,16.51074l.92242-1.56451.51068.1319.13171.51019-1.56482.92242ZM16.51074,16.51074l-1.56439-.9223.13177-.51031.51025-.13177.92236,1.56439ZM14.00684,13.28809c-.35254.0918-.62695.36621-.71875.71875l-1.28809,4.99219-1.28906-4.99219c-.09082-.35254-.36621-.62695-.71826-.71777l-4.9917-1.28906,4.9917-1.28906c.35205-.09082.62744-.36523.71826-.71777l1.28906-4.99219,1.28809,4.99219c.0918.35254.36621.62695.71875.71875l4.99219,1.28809-4.99219,1.28809Z\"/>", eaforum: "<path d=\"M17.24415,1.87867C15.334.30422,12.82327-.32087,10.35355.15674c-3.27392.63583-5.73289,3.0561-6.41697,6.31438-.5542,2.63905.13965,5.28689,1.90283,7.26471.86877.9753,1.3471,2.22481,1.34747,3.51839,0,.00061-.00031.00104-.00031.00165v2.87444c0,.00085.00049.00159.00049.00244v1.57689c0,1.26288,1.02685,2.29037,2.28954,2.29037h5.04686c1.26269,0,2.29003-1.02749,2.29003-2.29037v-4.44888c0-1.30097.47558-2.54919,1.33984-3.51515,1.35156-1.51389,2.09667-3.46632,2.09667-5.49688,0-2.47399-1.0957-4.79561-3.00585-6.37005ZM14.81349,21.70963c0,.16018-.12988.29008-.29004.29008h-5.04686c-.15967,0-.28955-.1299-.28955-.29008v-.71202l5.62645-.00781v.71983ZM9.18656,18.99782v-.75646l2.82812-.042h2.79882v.79015l-5.62694.0083ZM12.00003,11.07139l-2.53661-2.5365c-.12012-.12013-.18603-.27934-.18603-.44928s.06592-.32915.18603-.44928c.12353-.12306.28613-.18557.44873-.18557s.32519.06251.44824.18557l.93213.93275c.37598.37505,1.03906.37505,1.41503,0l.93115-.93275c.24805-.24613.65137-.24808.89746,0,.24805.24711.24805.65146.00098.89857l-2.5371,2.5365ZM16.66212,12.4124c-.95434,1.06711-1.55816,2.38407-1.76403,3.78668h-1.89807v-3.29869l2.95214-2.95123c1.02539-1.02749,1.02539-2.69961,0-3.7271q-.00098,0-.00098-.00098c-1.02734-1.02554-2.69921-1.02456-3.72655.00098l-.22461.22464-.2251-.22464c-1.02685-1.02749-2.69775-1.02749-3.72557,0-1.02734,1.02749-1.02734,2.69961,0,3.7271l2.95067,2.95111v3.31346l-1.88427.02832c-.19971-1.41622-.81592-2.75137-1.7832-3.83649-1.33642-1.49924-1.86083-3.51222-1.43896-5.52423.51611-2.45641,2.37109-4.28089,4.84178-4.76142,1.88037-.36724,3.791.10939,5.23631,1.30194,1.44824,1.19353,2.27831,2.95257,2.27831,4.82686,0,1.53831-.56445,3.01801-1.58789,4.16368Z\"/>" };
export const TYPES = {
  paper: ['file-text', 'Paper'], book: ['book-open', 'Book'], textbook: ['graduation-cap', 'Textbook'],
  wiki: ['library', 'Wiki page'], post: ['newspaper', 'Post'], web: ['globe', 'Web page'],
  report: ['file-chart-column', 'Report'], rules: ['dices', 'Game rules'], scan: ['scroll', 'Old scan'],
};
const REPORT_HOSTS = /metr\.org|apolloresearch|aisi\.gov\.uk|intelligence\.org|epoch\.ai|redwoodresearch|safe\.ai|storage\.googleapis\.com|anthropic\.com|openai\.com|governance\.ai|rand\.org/;
const BLOG_HOSTS = /medium\.com|substack\.com|deepmind\.google\/discover\/blog|deepmind\.com\/blog|blog\.|\/blog\//;
/** The item's type: explicit `type` from the data, else inferred from lane, kind and source. */
export function typeOf(it) {
  if (it.type && TYPES[it.type]) return it.type;
  const u = it.url || '';
  if (it.kind === 'scan') return 'scan';
  if (it.lane === 'ttrpg') return 'rules';
  if (it.lane === 'quri' || /wikisource\.org|wikipedia\.org/.test(u)) return 'wiki';
  if (it.lane === 'textbooks') return 'textbook';
  if (it.kind === 'text' || /^(book|bstj):/.test(it.id)) return 'book';
  if (it.kind === 'html') return 'post';
  if (it.id.startsWith('arxiv:')) return 'paper';
  if (it.kind === 'web') return BLOG_HOSTS.test(u) ? 'post' : REPORT_HOSTS.test(u) ? 'report' : 'web';
  if (it.kind === 'pdf') return REPORT_HOSTS.test(u) ? 'report' : 'paper';
  return 'web';
}
const forumOf = (it) => (it.id.startsWith('eaf:') ? 'eaforum' : it.id.startsWith('lw:') ? 'lesswrong' : null);
/** An inline SVG icon element for the item (currentColor; size in px). */
export function itemIcon(it, size = 13) {
  const t = typeOf(it), f = forumOf(it);
  const span = document.createElement('span');
  span.className = 'ticon t-' + t;
  span.title = TYPES[t][1] + (f ? (f === 'lesswrong' ? ' · LessWrong' : ' · EA Forum') : '');
  span.innerHTML = f
    ? `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">${FILLED[f]}</svg>`
    : `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${LINE[TYPES[t][0]]}</svg>`;
  return span;
}
