/** P2-012. Pure backing-store operations; no RAM, MMU or bus side effects. */
function swapBytes(bytes, length) {
  if (!Array.isArray(bytes) || bytes.length !== length) throw new Error('INVALID_LENGTH');
  for (var i = 0; i < length; i++) {
    if (!Number.isInteger(bytes[i]) || bytes[i] < 0 || bytes[i] > 255) throw new Error('INVALID_BYTE');
  }
}
function swapVpn(vpn) {
  if (!Number.isInteger(vpn) || vpn < 0 || vpn >= 16) throw new Error('INVALID_VPN');
}
function swapValidate(store) {
  if (!store || !Array.isArray(store.pages) || !Array.isArray(store.initialPages) ||
      store.pages.length !== 16 || store.initialPages.length !== 16) throw new Error('INVALID_STORE');
  for (var i = 0; i < 16; i++) {
    swapBytes(store.pages[i], 32);
    swapBytes(store.initialPages[i], 32);
  }
}
function swapCreate(image) {
  if (image === undefined) image = Array(512).fill(0);
  swapBytes(image, 512);
  var initial = [];
  for (var i = 0; i < 16; i++) initial.push(image.slice(i * 32, (i + 1) * 32));
  return { initialPages: initial, pages: initial.map(function (p) { return p.slice(); }) };
}
function swapReadPage(store, vpn) {
  swapValidate(store); swapVpn(vpn);
  return store.pages[vpn].slice();
}
function swapWritePage(store, vpn, bytes) {
  swapValidate(store); swapVpn(vpn); swapBytes(bytes, 32);
  var next = JSON.parse(JSON.stringify(store));
  next.pages[vpn] = bytes.slice();
  return next;
}
/** Global reset is empty; restoring the loaded program is a separate operation. */
function swapReset() { return swapCreate(); }
function swapRestoreImage(store) {
  swapValidate(store);
  return swapCreate([].concat.apply([], store.initialPages));
}
/** Explicit migration of the existing schemaVersion 1 snapshot. */
function swapAttachImage(state, image) {
  if (!state || state.schemaVersion !== 1 || !state.ram) throw new Error('INVALID_STATE');
  swapBytes(state.ram.bytes, 256);
  var store = swapCreate(image);
  var next = JSON.parse(JSON.stringify(state));
  next.swap = store;
  return next;
}
/** Stage a page save on a copy. The coordinator commits it with its event. */
function swapSaveFrame(state, vpn, pfn) {
  swapVpn(vpn);
  if (!state || state.schemaVersion !== 1 || !state.profile ||
      !Array.isArray(state.profile.pinnedMappings) || !state.ram || !state.mmu ||
      !Array.isArray(state.ram.frames) || state.ram.frames.length !== 8 ||
      !Array.isArray(state.mmu.pages) || state.mmu.pages.length !== 16 ||
      !Number.isInteger(pfn) || pfn < 0 || pfn > 7) throw new Error('INVALID_STATE');
  swapBytes(state.ram.bytes, 256);
  var frame = state.ram.frames[pfn], page = state.mmu.pages[vpn];
  if (!frame || !page || frame.pfn !== pfn || page.vpn !== vpn ||
      frame.vpn !== vpn || page.pfn !== pfn || page.present !== true) throw new Error('INVALID_MAPPING');
  if (frame.pinned !== false || page.pinned !== false || state.profile.pinnedMappings.some(function (m) {
    return !m || m.vpn === vpn || m.pfn === pfn;
  })) throw new Error('IO_PROTECTED');
  var store = swapWritePage(state.swap, vpn, state.ram.bytes.slice(pfn * 32, pfn * 32 + 32));
  var next = JSON.parse(JSON.stringify(state));
  next.swap = store;
  return next;
}
