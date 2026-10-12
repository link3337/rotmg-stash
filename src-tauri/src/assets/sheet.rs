//! Sprite sheet recompiler: flatbuffer rects + Unity atlas textures →
//! legacy-style sheet canvases (16-column static grids / single-column
//! animation strips), plus mask sheets.
//!
//! Rust port of `rotmg-asset-creator/src/index.ts` (SpriteAtlas,
//! AnimatedSpriteAtlas, setSpriteAtlas, setAnimated, config `copy` aliases).

use crate::assets::flatbuf::{Sprite, SpriteSheetRoot};
use crate::assets::unity::RgbaTexture;
use std::collections::HashMap;
use std::sync::Arc;

// ── Canvas ──────────────────────────────────────────────────────────

#[derive(Clone)]
pub struct Canvas {
    pub w: usize,
    pub h: usize,
    /// RGBA8, straight (non-premultiplied) alpha, row-major.
    pub data: Vec<u8>,
}

pub const MAX_CANVAS_HEIGHT: usize = 16000;

impl Canvas {
    pub fn new(w: usize, h: usize) -> Self {
        Self {
            w,
            h,
            data: vec![0u8; w * h * 4],
        }
    }

    pub fn from_texture(texture: RgbaTexture) -> Self {
        Self {
            w: texture.width as usize,
            h: texture.height as usize,
            data: texture.data,
        }
    }

    pub fn pixel(&self, x: usize, y: usize) -> [u8; 4] {
        let i = (y * self.w + x) * 4;
        [
            self.data[i],
            self.data[i + 1],
            self.data[i + 2],
            self.data[i + 3],
        ]
    }

    #[allow(dead_code)]
    pub fn set_pixel(&mut self, x: usize, y: usize, px: [u8; 4]) {
        let i = (y * self.w + x) * 4;
        self.data[i..i + 4].copy_from_slice(&px);
    }

    fn blend_over(dst: &mut [u8], src: [u8; 4]) {
        if src[3] == 0 {
            return;
        }
        if dst[3] == 0 {
            dst.copy_from_slice(&src);
            return;
        }
        let sa = src[3] as f32 / 255.0;
        let da = dst[3] as f32 / 255.0;
        let out_a = sa + da * (1.0 - sa);
        if out_a <= 0.0 {
            return;
        }
        for c in 0..3 {
            let v = (src[c] as f32 * sa + dst[c] as f32 * da * (1.0 - sa)) / out_a;
            dst[c] = v.round().clamp(0.0, 255.0) as u8;
        }
        dst[3] = (out_a * 255.0).round().clamp(0.0, 255.0) as u8;
    }

    /// Nearest-neighbor `drawImage` with source-over compositing.
    /// Source coordinates outside `src` render as transparent (per canvas spec).
    #[allow(clippy::too_many_arguments)]
    pub fn draw_image(
        &mut self,
        src: &Canvas,
        sx: f32,
        sy: f32,
        sw: f32,
        sh: f32,
        dx: i32,
        dy: i32,
        dw: i32,
        dh: i32,
    ) {
        if sw <= 0.0 || sh <= 0.0 || dw <= 0 || dh <= 0 {
            return;
        }
        for py in 0..dh {
            let ty = dy + py;
            if ty < 0 || ty as usize >= self.h {
                continue;
            }
            let src_y = (sy + (py as f32 + 0.5) * sh / dh as f32).floor();
            for px in 0..dw {
                let tx = dx + px;
                if tx < 0 || tx as usize >= self.w {
                    continue;
                }
                let src_x = (sx + (px as f32 + 0.5) * sw / dw as f32).floor();
                if !(src_x >= 0.0 && src_y >= 0.0 && src_x.is_finite() && src_y.is_finite()) {
                    continue;
                }
                let sxu = src_x as usize;
                let syu = src_y as usize;
                if sxu >= src.w || syu >= src.h {
                    continue;
                }
                let s = src.pixel(sxu, syu);
                let di = (ty as usize * self.w + tx as usize) * 4;
                Self::blend_over(&mut self.data[di..di + 4], s);
            }
        }
    }

    /// `globalCompositeOperation = 'source-in'` against a source canvas.
    /// Result: source color, alpha = srcA * dstA.
    pub fn source_in(&mut self, src: &Canvas) {
        for y in 0..self.h {
            for x in 0..self.w {
                let i = (y * self.w + x) * 4;
                let da = self.data[i + 3] as u32;
                let sa = src.data[i + 3] as u32;
                self.data[i] = src.data[i];
                self.data[i + 1] = src.data[i + 1];
                self.data[i + 2] = src.data[i + 2];
                self.data[i + 3] = ((da * sa) / 255) as u8;
            }
        }
    }

    /// `source-in` with an opaque fill color: keeps dest alpha, sets color.
    pub fn source_in_fill(&mut self, rgb: [u8; 3]) {
        for i in (0..self.data.len()).step_by(4) {
            if self.data[i + 3] > 0 {
                self.data[i] = rgb[0];
                self.data[i + 1] = rgb[1];
                self.data[i + 2] = rgb[2];
            }
        }
    }

    pub fn fill_rect(&mut self, x: i32, y: i32, w: i32, h: i32, rgba: [u8; 4]) {
        let x0 = x.max(0) as usize;
        let y0 = y.max(0) as usize;
        let x1 = ((x + w).max(0) as usize).min(self.w);
        let y1 = ((y + h).max(0) as usize).min(self.h);
        for py in y0..y1 {
            for px in x0..x1 {
                let i = (py * self.w + px) * 4;
                Self::blend_over(&mut self.data[i..i + 4], rgba);
            }
        }
    }

    /// Copy another canvas over this one at (0,0), source-over.
    pub fn draw_over(&mut self, src: &Canvas) {
        self.draw_image(
            src,
            0.0,
            0.0,
            src.w as f32,
            src.h as f32,
            0,
            0,
            src.w as i32,
            src.h as i32,
        );
    }

    /// Expand height (keeps width), copying existing content to the top-left.
    pub fn expand_height(&mut self, new_height: usize) -> Result<(), String> {
        if new_height > MAX_CANVAS_HEIGHT {
            return Err(format!(
                "Canvas expansion would exceed limits: trying to expand to height={new_height}"
            ));
        }
        if new_height <= self.h {
            return Ok(());
        }
        let mut next = Canvas::new(self.w, new_height);
        for y in 0..self.h {
            let src_off = y * self.w * 4;
            let dst_off = y * next.w * 4;
            next.data[dst_off..dst_off + self.w * 4]
                .copy_from_slice(&self.data[src_off..src_off + self.w * 4]);
        }
        *self = next;
        Ok(())
    }
}

// ── Unity atlases (keyed by flatbuffer aId) ────────────────────────

pub struct Atlas {
    pub image: Canvas,
    pub mask: Option<Canvas>,
}

pub type AtlasMap = HashMap<u64, Atlas>;

/// Build the atlas map from extracted Unity textures (atlasMapper in index.ts):
/// aId 1 → groundTiles, 2 → characters, 4 → mapObjects.
pub fn build_atlases(
    ground_tiles: RgbaTexture,
    characters: RgbaTexture,
    map_objects: RgbaTexture,
    characters_masks: RgbaTexture,
) -> AtlasMap {
    let mut map = AtlasMap::new();
    map.insert(
        1,
        Atlas {
            image: Canvas::from_texture(ground_tiles),
            mask: None,
        },
    );
    map.insert(
        2,
        Atlas {
            image: Canvas::from_texture(characters),
            mask: Some(Canvas::from_texture(characters_masks)),
        },
    );
    map.insert(
        4,
        Atlas {
            image: Canvas::from_texture(map_objects),
            mask: None,
        },
    );
    map
}

// ── Manifest ────────────────────────────────────────────────────────

#[derive(Clone, Copy)]
pub struct ManifestEntry {
    pub frame_width: u32,
    pub frame_height: u32,
    #[allow(dead_code)]
    pub mask: bool,
}

pub type Manifest = HashMap<String, ManifestEntry>;

// ── Sheet builders ──────────────────────────────────────────────────

pub struct SheetEntry {
    pub image: Canvas,
    pub mask: Option<Canvas>,
}

enum Mode {
    Static,
    Animated {
        frame_h: usize,
        /// key → next animation frame counter
        anim_counter: HashMap<String, u32>,
    },
}

pub struct SheetBuilder {
    canvas: Canvas,
    mask_canvas: Canvas,
    mask_drawn_to: bool,
    /// static: frame cell w; animated: first sprite w (action offset / advance unit)
    sprite_w: usize,
    /// expansion increment: static frame cell h, animated first sprite h
    sprite_h: usize,
    mode: Mode,
}

fn i32_trunc(v: f32) -> i32 {
    if v.is_finite() {
        v as i32
    } else {
        0
    }
}

impl SheetBuilder {
    fn atlas_image<'a>(&self, atlases: &'a AtlasMap, a_id: u64) -> Result<&'a Canvas, String> {
        atlases
            .get(&a_id)
            .map(|a| &a.image)
            .ok_or_else(|| format!("Atlas aId={a_id} not found (expected aId in {{1,2,4}})"))
    }

    fn atlas_mask<'a>(&self, atlases: &'a AtlasMap, a_id: u64) -> Option<&'a Canvas> {
        atlases.get(&a_id).and_then(|a| a.mask.as_ref())
    }

    fn set_static(&mut self, sprite: &Sprite, atlases: &AtlasMap) -> Result<(), String> {
        if sprite.is_t {
            return Ok(());
        }
        let mut w = sprite.position.w;
        let mut h = sprite.position.h;
        let x = sprite.position.x;
        let y = sprite.position.y;

        // hacky tile fix (groundTiles)
        if sprite.a_id == 1 {
            w = 8.0;
            h = 8.0;
        }

        let canvas_w = self.canvas.w as f32;
        if w <= 0.0 || canvas_w <= 0.0 {
            return Ok(());
        }
        let index = sprite.index as f32;
        let mut sheet_x = (index * w) % canvas_w;
        let mut sheet_y = (index / (canvas_w / w)).floor() * h;
        if !sheet_x.is_finite() {
            sheet_x = 0.0;
        }
        if !sheet_y.is_finite() {
            sheet_y = 0.0;
        }
        let sheet_x = i32_trunc(sheet_x);
        let sheet_y = i32_trunc(sheet_y);

        if sheet_y + i32_trunc(h) > self.canvas.h as i32 {
            let new_h = (sheet_y as usize) + self.sprite_h * 16;
            self.canvas.expand_height(new_h)?;
            self.mask_canvas.expand_height(new_h)?;
        }

        let image = self.atlas_image(atlases, sprite.a_id)?;
        self.canvas.draw_image(
            &image,
            x,
            y,
            w,
            h,
            sheet_x,
            sheet_y,
            i32_trunc(w),
            i32_trunc(h),
        );

        if sprite.mask_position.w != 0.0 {
            match self.atlas_mask(atlases, sprite.a_id) {
                Some(mask_img) => {
                    self.mask_canvas.draw_image(
                        &mask_img,
                        sprite.mask_position.x,
                        sprite.mask_position.y,
                        sprite.mask_position.w,
                        sprite.mask_position.h,
                        sheet_x,
                        sheet_y,
                        i32_trunc(sprite.mask_position.w),
                        i32_trunc(sprite.mask_position.h),
                    );
                    self.mask_drawn_to = true;
                }
                None => log::warn!(
                    "[assets] mask data missing for atlas aId={}, skipping mask draw",
                    sprite.a_id
                ),
            }
        }
        Ok(())
    }

    fn set_animated(
        &mut self,
        sprite: &Sprite,
        direction: u32,
        action: u32,
        atlases: &AtlasMap,
    ) -> Result<(), String> {
        let sprite_key = format!(
            "{}+{}+{}+{}",
            sprite.sprite_sheet_name, sprite.index, direction, action
        );
        let x = sprite.position.x;
        let y = sprite.position.y;
        let w = sprite.position.w;
        let h = sprite.position.h;

        let action_offset: f32 = match action {
            1 => self.sprite_w as f32,
            2 => self.sprite_w as f32 * 4.0,
            4 => self.sprite_w as f32 * 5.0,
            _ => 0.0,
        };

        let frame_h = match &mut self.mode {
            Mode::Animated {
                frame_h,
                anim_counter,
            } => {
                anim_counter.entry(sprite_key.clone()).or_insert(0);
                *frame_h
            }
            Mode::Static => return Err("set_animated on static sheet".to_string()),
        };

        let counter = match &self.mode {
            Mode::Animated { anim_counter, .. } => *anim_counter.get(&sprite_key).unwrap_or(&0),
            Mode::Static => 0,
        };

        let sheet_x = i32_trunc(action_offset + counter as f32 * self.sprite_w as f32);
        let sheet_y = i32_trunc(sprite.index as f32 * frame_h as f32);

        if sheet_y + i32_trunc(h) > self.canvas.h as i32 {
            let new_h = self.canvas.h + self.sprite_h * 16;
            self.canvas.expand_height(new_h)?;
            self.mask_canvas.expand_height(new_h)?;
        }

        let image = self.atlas_image(atlases, sprite.a_id)?;
        self.canvas.draw_image(
            &image,
            x,
            y,
            w,
            h,
            sheet_x,
            sheet_y,
            i32_trunc(w),
            i32_trunc(h),
        );

        if sprite.mask_position.w != 0.0 {
            if let Some(mask_img) = self.atlas_mask(atlases, sprite.a_id) {
                self.mask_canvas.draw_image(
                    &mask_img,
                    sprite.mask_position.x,
                    sprite.mask_position.y,
                    sprite.mask_position.w,
                    sprite.mask_position.h,
                    sheet_x,
                    sheet_y,
                    i32_trunc(sprite.mask_position.w),
                    i32_trunc(sprite.mask_position.h),
                );
                self.mask_drawn_to = true;
            }
        }

        if let Mode::Animated { anim_counter, .. } = &mut self.mode {
            *anim_counter.entry(sprite_key).or_insert(0) += 1;
        }
        Ok(())
    }

    fn into_entry(self) -> SheetEntry {
        SheetEntry {
            image: self.canvas,
            mask: if self.mask_drawn_to {
                Some(self.mask_canvas)
            } else {
                None
            },
        }
    }
}

fn static_sheet_frame_dims(
    name: &str,
    sprites: &[crate::assets::flatbuf::Sprite],
    manifest: &Manifest,
) -> Option<(u32, u32)> {
    let entry = manifest.get(name);
    let mut frame_w = entry.map(|e| e.frame_width).unwrap_or(8);
    let mut frame_h = entry.map(|e| e.frame_height).unwrap_or(8);

    // Validate frame dims against actual sprite sizes.
    let mut max_w = 0u32;
    let mut max_h = 0u32;
    for sprite in sprites {
        if !sprite.is_t && sprite.position.w > 0.0 {
            max_w = max_w.max(sprite.position.w as u32);
            max_h = max_h.max(sprite.position.h as u32);
        }
    }
    if max_w > 0 && max_h > 0 && (frame_w < max_w || frame_h < max_h) {
        frame_w = frame_w.max(max_w);
        frame_h = frame_h.max(max_h);
    }
    if frame_w == 0 || frame_h == 0 {
        return None;
    }
    Some((frame_w, frame_h))
}

/// Run both passes over the flatbuffer root and export final sheets.
pub fn recompile(
    root: &SpriteSheetRoot,
    atlases: AtlasMap,
    manifest: &Manifest,
    copies: &HashMap<String, Vec<String>>,
) -> Result<HashMap<String, Arc<SheetEntry>>, String> {
    let mut entries: HashMap<String, SheetBuilder> = HashMap::new();

    // Static pass (flatbuffer order).
    for sheet in &root.sprites {
        let Some((frame_w, frame_h)) = static_sheet_frame_dims(&sheet.name, &sheet.sprites, manifest)
        else {
            continue;
        };
        let mut builder = SheetBuilder {
            canvas: Canvas::new(frame_w as usize * 16, frame_h as usize * 16),
            mask_canvas: Canvas::new(frame_w as usize * 16, frame_h as usize * 16),
            mask_drawn_to: false,
            sprite_w: frame_w as usize,
            sprite_h: frame_h as usize,
            mode: Mode::Static,
        };
        for sprite in &sheet.sprites {
            builder.set_static(sprite, &atlases)?;
        }
        entries.insert(sheet.name.clone(), builder);
    }

    // Animated pass (flatbuffer order).
    let mut seen: HashMap<String, ()> = HashMap::new();
    for anim in &root.animated_sprites {
        let name = &anim.name;
        let mut frame_w = manifest.get(name.as_str()).map(|e| e.frame_width).unwrap_or(8);
        let mut frame_h = manifest.get(name.as_str()).map(|e| e.frame_height).unwrap_or(8);

        if name.contains("16x16") {
            frame_w = 16;
            frame_h = 16;
        } else if name.contains("32x32") {
            frame_w = 32;
            frame_h = 32;
        }
        if name == "playerskins32" {
            frame_w = 64;
            frame_h = 32;
        } else if name == "playerskins" {
            frame_w = 16;
            frame_h = 8;
        } else if name == "playerskins16" {
            frame_w = 32;
            frame_h = 16;
        } else if name == "players" {
            frame_w = 16;
            frame_h = 8;
        }

        let player_sheet = matches!(
            name.as_str(),
            "playerskins32" | "playerskins" | "playerskins16" | "players"
        );
        if player_sheet && !(anim.direction == 0 && anim.action == 0) {
            continue;
        }
        if player_sheet {
            let key = format!("{name}+{}", anim.index);
            if seen.contains_key(&key) {
                continue;
            }
            seen.insert(key, ());
        }

        // Shallow-merge: outer name/index/direction/action + inner rect data.
        let mut sprite = anim.sprite.clone();
        sprite.sprite_sheet_name = anim.name.clone();
        sprite.index = anim.index;
        let direction = anim.direction;
        let action = anim.action;

        if !entries.contains_key(name) {
            let sprite_w = sprite.position.w.max(0.0) as usize;
            let sprite_h = sprite.position.h.max(0.0) as usize;
            let canvas = Canvas::new(frame_w as usize, frame_h as usize * 16);
            entries.insert(
                name.clone(),
                SheetBuilder {
                    mask_canvas: Canvas::new(frame_w as usize, frame_h as usize * 16),
                    mask_drawn_to: false,
                    canvas,
                    sprite_w,
                    sprite_h,
                    mode: Mode::Animated {
                        frame_h: frame_h as usize,
                        anim_counter: HashMap::new(),
                    },
                },
            );
        }
        let builder = entries
            .get_mut(name)
            .ok_or_else(|| "sheet builder missing".to_string())?;
        match builder.mode {
            Mode::Static => builder.set_static(&sprite, &atlases)?,
            Mode::Animated { .. } => builder.set_animated(&sprite, direction, action, &atlases)?,
        }
    }

    // Alias copies (config.copy): alias names resolve to the same sheet data.
    let mut sheets: HashMap<String, Arc<SheetEntry>> = entries
        .into_iter()
        .map(|(name, builder)| (name, Arc::new(builder.into_entry())))
        .collect();
    for (src, aliases) in copies {
        if let Some(entry) = sheets.get(src).cloned() {
            for alias in aliases {
                sheets.insert(alias.clone(), Arc::clone(&entry));
            }
        }
    }
    Ok(sheets)
}
