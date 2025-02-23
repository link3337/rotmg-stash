import { skinsheets, textiles } from '@realm/renders/sheets';
import { skins } from '@realm/renders/skins';
import { textures } from '@realm/renders/textures';

// single component
function p_comp(s: any, x: any, y: any, i: any) {
  return s.data[((s.width * y + x) << 2) + i];
}

// single pixel
function p_dict(s: any, x: any, y: any) {
  var offset = (s.width * y + x) << 2;
  for (var i = 0, d = []; i < 4; i++) d[i] = s.data[offset + i];
  return d;
}

// css-compatible
function p_css(s: any, x: any, y: any) {
  var d = p_dict(s, x, y);
  d[3] /= 255;
  return 'rgba(' + d.join(',') + ')';
}
// Initialize ready state and sprites object
let ready = false;
const sprites = {};

// Function to extract sprites
function extract_sprites(img: any, sx: any, sy?: any) {
  sx = sx || 8;
  sy = sy || sx;
  const sprc = document.createElement('canvas');
  const c: any = sprc;
  c.crossOrigin = 'anonymous';
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  let i = 0;
  const r = [];
  for (let y = 0; y < c.height; y += sy) {
    for (let x = 0; x < c.width; x += sx, i++) {
      r[i] = ctx.getImageData(x, y, sx, sy);
    }
  }
  return r;
}

/**
 * Extracts skin images from a given image.
 *
 * @param img - The source image from which skins will be extracted.
 * @param size - The size of each skin to be extracted. Defaults to 8 if not provided.
 * @returns An array of ImageData objects, each representing a skin extracted from the source image.
 */
function extract_skins(img: any, size: any) {
  size = size || 8;
  const sprc = document.createElement('canvas');
  const c: any = sprc;
  c.crossOrigin = 'anonymous';
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  let i = 0;
  const r = [];
  for (let y = 0; y < c.height; y += size * 3, i++) {
    r[i] = ctx.getImageData(0, y, size, size);
  }
  return r;
}

/**
 * Loads an image from the specified source URL and returns a promise that resolves when the image is loaded.
 * 
 * @param {string} src - The source URL of the image to load.
 * @param {any} t - An additional parameter to be passed to the resolve function.
 * @param {any} s - Another additional parameter to be passed to the resolve function.
 * @returns {Promise<HTMLImageElement>} A promise that resolves with the loaded image element and the additional parameters.
 */
function load_img(src: any, t: any, s: any) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      (resolve as any)(this, t, s);
    };
    img.onerror = function () {
      console.error(`${src} failed to load`);
      reject(src);
    };
    img.src = src;
  });
}

/**
 * Loads skinsheets and textiles, processes them, and stores the resulting sprites.
 *
 * This function creates promises for loading images from the `skinsheets` and `textiles` objects.
 * It processes each image by extracting skins or sprites and stores them in the `sprites` object.
 *
 * @returns {Promise<void[]>} A promise that resolves when all skinsheets and textiles have been loaded and processed.
 */
function load_sheets() {
  const skinsheetPromises = Object.keys(skinsheets).map((key) => {
    const src: any = (skinsheets as any)[key];
    return load_img(src, key, +key)
      .then((img) => {
        const size = key.includes('16') ? 16 : 8;
        (sprites as any)[key] = extract_skins(img, size);
      })
      .catch((e) => {
        console.error(`Failed to load skinsheet ${key} from ${src}`, e);
      });
  });

  const textilePromises = Object.keys(textiles).map((key) => {
    const src: any = (textiles as any)[key];
    return load_img(src, key, +key)
      .then((img) => {
        (sprites as any)[key] = extract_sprites(img, +key);
      })
      .catch((e) => {
        console.warn(`Failed to load textile ${key} from ${src}`, e);
      });
  });

  return Promise.all([...skinsheetPromises, ...textilePromises]);
}

const fs: any = {};
let fsc: any;

/**
 * Generates a texture pattern based on the provided texture and ratio.
 *
 * @param tex - The texture identifier, which can be a number or any other type.
 * @param ratio - The ratio used for scaling the texture.
 * @returns The generated texture pattern as a string or CanvasPattern.
 *
 * The function performs the following steps:
 * 1. Checks if the texture pattern for the given ratio already exists in the cache.
 * 2. If the texture identifier is 0, returns 'transparent'.
 * 3. If the texture identifier is 1, converts the texture to a hexadecimal color string and returns it.
 * 4. If the sprite sheet corresponding to the texture identifier is not found, logs an error and returns 'transparent'.
 * 5. If the sprite corresponding to the texture identifier is not found, logs an error and returns 'transparent'.
 * 6. Creates a canvas element and scales the sprite based on the provided ratio.
 * 7. Generates a repeating pattern from the scaled sprite and caches it.
 * 8. Returns the generated texture pattern.
 */
function makeTexPattern(tex: any, ratio: any) {
  if (!fs[ratio]) fs[ratio] = {};
  const dict = fs[ratio];
  tex = +tex || 0;
  if (dict[tex]) return dict[tex];
  const i = (tex & 0xff000000) >> 24;
  let c: any = tex & 0xffffff;
  if (i === 0) return 'transparent';
  if (i === 1) {
    c = c.toString(16);
    while (c.length < 6) c = '0' + c;
    dict[tex] = '#' + c;
    return dict[tex];
  }
  if (!(sprites as any)[i]) {
    console.error(`Sprite sheet ${i} not found in sprites.`);
    return 'transparent';
  }
  const spr = (sprites as any)[i][c];
  if (!spr) {
    console.error(`Sprite ${c} not found in sheet ${i}`);
    return 'transparent';
  }
  fsc = fsc || document.createElement('canvas');
  const ca = fsc;
  const scale = ratio / 5;
  ca.width = spr.width;
  ca.height = spr.height;
  const cact = ca.getContext('2d');
  cact.imageSmoothingEnabled = false;
  cact.putImageData(spr, 0, 0);
  const p = cact.createPattern(ca, 'repeat');
  ca.width = scale * spr.width;
  ca.height = scale * spr.height;
  cact.scale(scale, scale);
  cact.fillStyle = p;
  cact.fillRect(0, 0, spr.width, spr.height);
  dict[tex] = cact.createPattern(ca, 'repeat');
  return dict[tex];
}

/**
 * Generates a portrait image based on the provided type, skin, and texture IDs.
 *
 * @param {any} type - The type of the portrait.
 * @param {any} skin - The skin ID for the portrait.
 * @param {any} tex1Id - The first texture ID for the portrait.
 * @param {any} tex2Id - The second texture ID for the portrait.
 * @returns {string} - A data URL representing the generated portrait image.
 *
 * @remarks
 * This function relies on global variables `ready`, `skins`, `sprites`, and `textures`.
 * It creates a canvas element, draws the portrait based on the provided parameters,
 * and returns the image as a data URL.
 *
 * If the sprites are not ready, or if the skin data is not found, it logs an error
 * and returns an empty string.
 *
 * The function also handles texture patterns and applies them to the portrait
 * based on the mask data.
 */
function portrait(type: any, skin: any, tex1Id: any, tex2Id: any) {
  if (!ready) {
    console.error('Sprites are not ready yet.');
    return '';
  }

  if (!(skins as any)[skin]) {
    skin = type;
  }

  let skinData = (skins as any)[skin];
  if (!skinData || !(sprites as any)[skinData[3]][skinData[1]]) {
    skin = type;
    skinData = (skins as any)[skin];
    if (!skinData) {
      console.error('Default skin not found.');
      return '';
    }
  }

  const tex1 = (textures as any)[tex1Id] ? (textures as any)[tex1Id][0] : null;
  const tex2 = (textures as any)[tex2Id] ? (textures as any)[tex2Id][2] : null;

  const size = skinData[2] ? 16 : 8;
  const ratio = skinData[2] ? 2 : 4;
  const fs1 = tex1 ? makeTexPattern(tex1Id, ratio) : 'transparent';
  const fs2 = tex2 ? makeTexPattern(tex2Id, ratio) : 'transparent';

  const st = document.createElement('canvas');
  st.width = 34;
  st.height = 34;
  const ctx = st.getContext('2d');
  ctx?.save();
  ctx?.clearRect(0, 0, st.width, st.height);
  ctx?.translate(1, 1);

  const i = skinData[1];
  const sheetName = skinData[3];
  const spr = (sprites as any)[sheetName][i];
  const mask = (sprites as any)[sheetName + 'Mask'][i];

  for (let xi = 0; xi < size; xi++) {
    const x = xi * ratio;
    const w = ratio;
    for (let yi = 0; yi < size; yi++) {
      if (p_comp(spr, xi, yi, 3) < 2) continue;
      const y = yi * ratio;
      const h = ratio;

      ctx!.fillStyle = p_css(spr, xi, yi);
      ctx?.fillRect(x, y, w, h);

      let vol = 0;
      function dotex(tex: any) {
        ctx!.fillStyle = tex;
        ctx?.fillRect(x, y, w, h);
        ctx!.fillStyle = 'rgba(0,0,0,' + (255 - vol) / 255 + ')';
        ctx?.fillRect(x, y, w, h);
      }

      if (p_comp(mask, xi, yi, 3) > 1) {
        const red = p_comp(mask, xi, yi, 0);
        const green = p_comp(mask, xi, yi, 1);
        if (red > green && fs1 !== 'transparent') {
          vol = red;
          dotex(fs1);
        } else if (green > red && fs2 !== 'transparent') {
          vol = green;
          dotex(fs2);
        }
      }

      ctx?.save();
      ctx!.globalCompositeOperation = 'destination-over';
      ctx?.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
      ctx?.restore();
    }
  }

  ctx?.restore();
  const imageDataURL = st.toDataURL();
  return imageDataURL;
}

// Initialize loading sheets
const preload = load_sheets();

// Wait for preload to finish
preload
  .then(() => {
    ready = true;
    (window as any).portraitReady = true;
  })
  .catch((error) => {
    console.error('Failed to load sheets:', error);
  });

// Export portrait function and other utilities
export { portrait };
