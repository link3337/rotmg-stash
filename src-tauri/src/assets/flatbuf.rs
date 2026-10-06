//! Minimal FlatBuffers reader for the `Deca.SpriteSheetRoot` schema
//! (`rotmg-asset-creator/src/schema.fbs`). Generated accessors would need
//! `flatc`, so the ~150 lines of vtable plumbing are written by hand here.

#[derive(Debug, Clone, Copy, Default)]
pub struct Rect {
    pub x: f32,
    pub y: f32,
    pub h: f32,
    pub w: f32,
}

#[derive(Debug, Clone)]
pub struct Sprite {
    pub position: Rect,
    pub mask_position: Rect,
    #[allow(dead_code)]
    pub padding: i32,
    pub index: u32,
    pub is_t: bool,
    pub sprite_sheet_name: String,
    pub a_id: u64,
}

#[derive(Debug, Clone)]
pub struct SpriteSheet {
    pub name: String,
    #[allow(dead_code)]
    pub atlas_id: u64,
    pub sprites: Vec<Sprite>,
}

#[derive(Debug, Clone)]
pub struct AnimatedSprite {
    pub name: String,
    pub index: u32,
    #[allow(dead_code)]
    pub set: u32,
    pub direction: u32,
    pub action: u32,
    pub sprite: Sprite,
}

#[derive(Debug, Clone)]
pub struct SpriteSheetRoot {
    pub sprites: Vec<SpriteSheet>,
    pub animated_sprites: Vec<AnimatedSprite>,
}

struct Reader<'a> {
    buf: &'a [u8],
}

impl<'a> Reader<'a> {
    fn u16(&self, pos: usize) -> Result<u16, String> {
        self.buf
            .get(pos..pos + 2)
            .map(|b| u16::from_le_bytes([b[0], b[1]]))
            .ok_or_else(|| format!("flatbuffer u16 out of bounds at {pos}"))
    }

    fn u32(&self, pos: usize) -> Result<u32, String> {
        self.buf
            .get(pos..pos + 4)
            .map(|b| u32::from_le_bytes([b[0], b[1], b[2], b[3]]))
            .ok_or_else(|| format!("flatbuffer u32 out of bounds at {pos}"))
    }

    fn i32(&self, pos: usize) -> Result<i32, String> {
        self.buf
            .get(pos..pos + 4)
            .map(|b| i32::from_le_bytes([b[0], b[1], b[2], b[3]]))
            .ok_or_else(|| format!("flatbuffer i32 out of bounds at {pos}"))
    }

    fn u64(&self, pos: usize) -> Result<u64, String> {
        self.buf
            .get(pos..pos + 8)
            .map(|b| u64::from_le_bytes([b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7]]))
            .ok_or_else(|| format!("flatbuffer u64 out of bounds at {pos}"))
    }

    fn f32(&self, pos: usize) -> Result<f32, String> {
        self.buf
            .get(pos..pos + 4)
            .map(|b| f32::from_le_bytes([b[0], b[1], b[2], b[3]]))
            .ok_or_else(|| format!("flatbuffer f32 out of bounds at {pos}"))
    }

    fn bool_at(&self, pos: usize) -> Result<bool, String> {
        self.buf
            .get(pos)
            .map(|b| *b != 0)
            .ok_or_else(|| format!("flatbuffer bool out of bounds at {pos}"))
    }

    /// Absolute position of a field inside a table, or None when the field
    /// is absent (vtable slot 0 / slot beyond vtable end).
    fn field(&self, table_pos: usize, slot: u16) -> Result<Option<usize>, String> {
        let soffset = self.i32(table_pos)? as i64;
        let vtable_pos = (table_pos as i64 - soffset) as usize;
        let vtable_size = self.u16(vtable_pos)? as usize;
        let entry = 2 + slot as usize;
        if entry * 2 + 2 > vtable_size {
            return Ok(None);
        }
        let field_off = self.u16(vtable_pos + entry * 2)? as usize;
        if field_off == 0 {
            return Ok(None);
        }
        Ok(Some(table_pos + field_off))
    }

    fn field_offset(&self, table_pos: usize, slot: u16) -> Result<usize, String> {
        self.field(table_pos, slot)?
            .ok_or_else(|| format!("flatbuffer field slot {slot} missing at table {table_pos}"))
    }

    /// Offset-table field (string, table, vector): indirection through u32.
    fn indirect(&self, table_pos: usize, slot: u16) -> Result<usize, String> {
        let abs = self.field_offset(table_pos, slot)?;
        Ok(abs + self.u32(abs)? as usize)
    }

    fn string(&self, table_pos: usize, slot: u16) -> Result<String, String> {
        match self.field(table_pos, slot)? {
            None => Ok(String::new()),
            Some(abs) => {
                let s = abs + self.u32(abs)? as usize;
                let len = self.u32(s)? as usize;
                let bytes = self
                    .buf
                    .get(s + 4..s + 4 + len)
                    .ok_or_else(|| format!("flatbuffer string out of bounds at {s}"))?;
                Ok(String::from_utf8_lossy(bytes).into_owned())
            }
        }
    }

    fn vector_len(&self, table_pos: usize, slot: u16) -> Result<usize, String> {
        let vec = self.indirect(table_pos, slot)?;
        Ok(self.u32(vec)? as usize)
    }

    /// Vector of offsets to tables: element position for `index`.
    fn vector_elem(&self, table_pos: usize, slot: u16, index: usize) -> Result<usize, String> {
        let vec = self.indirect(table_pos, slot)?;
        let len = self.u32(vec)? as usize;
        if index >= len {
            return Err(format!("flatbuffer vector index {index} out of range ({len})"));
        }
        let elem_slot = vec + 4 + index * 4;
        Ok(elem_slot + self.u32(elem_slot)? as usize)
    }

    fn rect(&self, table_pos: usize, slot: u16) -> Result<Rect, String> {
        let abs = self.field_offset(table_pos, slot)?;
        Ok(Rect {
            x: self.f32(abs)?,
            y: self.f32(abs + 4)?,
            h: self.f32(abs + 8)?,
            w: self.f32(abs + 12)?,
        })
    }
}

fn read_sprite(r: &Reader, pos: usize) -> Result<Sprite, String> {
    let padding = match r.field(pos, 2)? {
        Some(abs) => r.i32(abs)?,
        None => 0,
    };
    let index = match r.field(pos, 3)? {
        Some(abs) => r.u32(abs)?,
        None => 0,
    };
    let is_t = match r.field(pos, 5)? {
        Some(abs) => r.bool_at(abs)?,
        None => false,
    };
    let a_id = match r.field(pos, 7)? {
        Some(abs) => r.u64(abs)?,
        None => 0,
    };
    Ok(Sprite {
        position: r.rect(pos, 0)?,
        mask_position: r.rect(pos, 1)?,
        padding,
        index,
        is_t,
        sprite_sheet_name: r.string(pos, 6)?,
        a_id,
    })
}

/// Parse the root `SpriteSheetRoot` from a `spritesheetf.bytes` buffer.
pub fn parse_sprite_sheet_root(buf: &[u8]) -> Result<SpriteSheetRoot, String> {
    let r = Reader { buf };
    let root_pos = r.u32(0)? as usize;

    let mut sprites = Vec::new();
    if let Ok(sheet_count) = r.vector_len(root_pos, 0) {
        for i in 0..sheet_count {
            let sheet_pos = r.vector_elem(root_pos, 0, i)?;
            let name = r.string(sheet_pos, 0)?;
            let atlas_id = match r.field(sheet_pos, 1)? {
                Some(abs) => r.u64(abs)?,
                None => 0,
            };
            let mut elements = Vec::new();
            let sprite_count = r.vector_len(sheet_pos, 2)?;
            for j in 0..sprite_count {
                let sprite_pos = r.vector_elem(sheet_pos, 2, j)?;
                elements.push(read_sprite(&r, sprite_pos)?);
            }
            sprites.push(SpriteSheet {
                name,
                atlas_id,
                sprites: elements,
            });
        }
    }

    let mut animated_sprites = Vec::new();
    if let Ok(anim_count) = r.vector_len(root_pos, 1) {
        for i in 0..anim_count {
            let anim_pos = r.vector_elem(root_pos, 1, i)?;
            let name = r.string(anim_pos, 0)?;
            let get_u32 = |slot: u16| -> Result<u32, String> {
                Ok(match r.field(anim_pos, slot)? {
                    Some(abs) => r.u32(abs)?,
                    None => 0,
                })
            };
            let sprite_pos = r.indirect(anim_pos, 5)?;
            animated_sprites.push(AnimatedSprite {
                name,
                index: get_u32(1)?,
                set: get_u32(2)?,
                direction: get_u32(3)?,
                action: get_u32(4)?,
                sprite: read_sprite(&r, sprite_pos)?,
            });
        }
    }

    Ok(SpriteSheetRoot {
        sprites,
        animated_sprites,
    })
}
