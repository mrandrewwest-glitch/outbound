// Shared floor-plan constants. Units are metres. The player sits at the origin facing -z;
// +x is to the player's right, the boss aisle runs behind the chair along z = 3.2.
export const PLAYER = { x: 0, z: 0, eye: 1.2 };
export const BIN = { x: 2.0, z: 1.6, r: 0.27, h: 0.55 };
export const AISLE_Z = 3.2;
export const OFFICE = { x: 7.8, z: 4.4 };
export const DOOR = { x: 5.6, z: AISLE_Z };
export const AISLE_W = { x: -6.6, z: AISLE_Z };
export const WATCH_SPOT = { x: 0, z: 1.9 };   // boss stands behind the chair here
export const COOLER = { x: -4.6, z: 2.3 };
export const DRAWER = { x: -0.95, z: -0.05 };

export const COWORKERS = [
  { name: 'Dave',   x: -3.5, z: 0.2,  rot: Math.PI / 2,  shirt: 0x4b7bd1, hair: 0x3a2a1a, skin: 0xe0b08c, spot: { x: -3.5, z: 1.7 } },
  { name: 'Brenda', x: 3.5,  z: 0.2,  rot: -Math.PI / 2, shirt: 0xd14b8f, hair: 0xb5651d, skin: 0xf1c9a5, spot: { x: 3.5, z: 1.7 } },
  { name: 'Kev',    x: -2.5, z: -3.3, rot: 0,            shirt: 0x58a55c, hair: 0x111111, skin: 0xc68642, spot: { x: -2.5, z: -1.6 }, via: -1.7 },
  { name: 'Priya',  x: 2.5,  z: -3.3, rot: 0,            shirt: 0xe0a030, hair: 0x0b0b0b, skin: 0x9c6b43, spot: { x: 2.5, z: -1.6 }, via: 1.7 },
];
