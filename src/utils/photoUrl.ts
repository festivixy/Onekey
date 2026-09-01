/**
 * Photos are not committed to the repo. In production they are served from
 * cloud storage: set REACT_APP_PHOTO_BASE in the build environment (e.g.
 * https://pub-xxxx.r2.dev/site or a custom photos domain) and every photo
 * path like /pics/onekey.jpg resolves against it. When unset (local dev),
 * photos load from the local public/ folder as before.
 */
export const PHOTO_BASE = process.env.REACT_APP_PHOTO_BASE || process.env.PUBLIC_URL || '';

export const photoUrl = (path: string): string => `${PHOTO_BASE}${path}`;
