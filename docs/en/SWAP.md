# Page backing store — P2-012

Sixteen 32-byte pages provide 512 bytes of backing storage; physical RAM remains
256 bytes. initialPages holds the loaded image; pages holds updated backing data.
The arrays are independent. A resident Dirty page may be newer in RAM.

Pure API: swapCreate(image) accepts exactly 512 bytes, or zeroes if omitted;
swapReadPage(store,vpn) returns an independent 32-byte copy;
swapWritePage(store,vpn,bytes) returns a new store preserving neighbors and image;
swapReset() creates zeroes; swapRestoreImage(store) restores the initial image;
swapAttachImage(state,image) returns a snapshot copy with a new backing store;
swapSaveFrame(state,vpn,pfn) stages saving one mapped RAM frame to backing storage.

VPN must be an integer 0..15; pages contain exactly 32 integer bytes 0..255.
Sparse arrays, invalid lengths/indices/bytes are rejected before mutation. Inputs,
outputs and initial image do not alias. SaveFrame validates the target mapping and
rejects pinned I/O pages/frames; the coordinator validates the full snapshot.

The #1 schema already has swap.pages. AttachImage adds initialPages when loading
a program; it replaces backing data and must not migrate an ongoing Dirty session.
The coordinator saves a Dirty victim, invalidates caches, transfers 32 bytes via
the bus, then commits mappings and FIFO. This module does not select victims,
clear Dirty, advance revisions, animate transfers or install RAM pages itself.

Run `node --test tests/unit/swap.test.cjs`: 10 tests cover roundtrip, neighboring
pages, detached copies, reset versus reload, I/O protection and unchanged 256-byte
RAM. Evidence: ../evidence/P2-012.md. Eviction integration belongs to #15; module
approval is not proof of a connected simulator or spreadsheet.
