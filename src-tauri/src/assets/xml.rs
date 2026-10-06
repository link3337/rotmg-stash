//! Small XML DOM parser with `fast-xml-parser`-compatible semantics
//! (the reference renderer is written against its output shape):
//! - element values are trimmed text
//! - repeated child tags produce sibling entries (arrays)
//! - attributes are stored as `("@name", value)` pairs
//! - an element is "falsy" when it would serialize as `""` in JS truthiness

use quick_xml::events::Event;
use quick_xml::Reader;

#[derive(Debug, Clone, Default)]
pub struct Element {
    pub name: String,
    pub attrs: Vec<(String, String)>,
    pub children: Vec<Element>,
    pub text: Option<String>,
}

impl Element {
    pub fn attr(&self, name: &str) -> Option<&str> {
        self.attrs
            .iter()
            .find(|(k, _)| k == name)
            .map(|(_, v)| v.as_str())
    }

    pub fn child(&self, name: &str) -> Option<&Element> {
        self.children.iter().find(|c| c.name == name)
    }

    pub fn children_named<'a>(&'a self, name: &'a str) -> impl Iterator<Item = &'a Element> {
        self.children.iter().filter(move |c| c.name == name)
    }

    pub fn has_child(&self, name: &str) -> bool {
        self.children.iter().any(|c| c.name == name)
    }

    /// Equivalent of the renderer's `getTextContent(node)`:
    /// leaf elements yield their text (empty leaf → `""`), elements that
    /// only contain child elements (no text) yield `None`.
    pub fn text(&self) -> Option<&str> {
        match &self.text {
            Some(t) => Some(t.as_str()),
            None if self.children.is_empty() => Some(""),
            None => None,
        }
    }

    /// JS truthiness of the fast-xml-parser value for this element.
    /// `""`, missing values, and the number `0` are falsy; anything else truthy.
    pub fn is_truthy(&self) -> bool {
        if !self.attrs.is_empty() || !self.children.is_empty() {
            return true; // an object is always truthy in JS
        }
        match self.text.as_deref() {
            None => false,
            Some(t) => {
                // fast-xml-parser converts numeric strings to numbers;
                // the number 0 (in any textual spelling) is falsy in JS.
                let t = t.trim();
                if t.is_empty() {
                    return false;
                }
                !(t.parse::<f64>().is_ok_and(|n| n == 0.0))
            }
        }
    }
}

/// Parse a whole XML document into top-level elements.
pub fn parse_document(xml: &str) -> Result<Vec<Element>, String> {
    let mut reader = Reader::from_str(xml);
    reader.config_mut().trim_text(true);

    let mut stack: Vec<Element> = Vec::new();
    let mut doc: Vec<Element> = Vec::new();

    loop {
        let event = reader
            .read_event()
            .map_err(|e| format!("XML parse error: {e}"))?;
        match event {
            Event::Start(e) => {
                let name = String::from_utf8_lossy(e.name().as_ref()).into_owned();
                let mut el = Element {
                    name,
                    ..Default::default()
                };
                for attr in e.attributes().with_checks(false) {
                    let attr = attr.map_err(|err| format!("XML attr error: {err}"))?;
                    let key = String::from_utf8_lossy(attr.key.as_ref()).into_owned();
                    // fast-xml-parser `trimValues` also applies to attributes.
                    let value = attr
                        .unescape_value()
                        .map_err(|err| format!("XML attr unescape error: {err}"))?
                        .trim()
                        .to_string();
                    el.attrs.push((key, value));
                }
                stack.push(el);
            }
            Event::Empty(e) => {
                let name = String::from_utf8_lossy(e.name().as_ref()).into_owned();
                let mut el = Element {
                    name,
                    ..Default::default()
                };
                for attr in e.attributes().with_checks(false) {
                    let attr = attr.map_err(|err| format!("XML attr error: {err}"))?;
                    let key = String::from_utf8_lossy(attr.key.as_ref()).into_owned();
                    let value = attr
                        .unescape_value()
                        .map_err(|err| format!("XML attr unescape error: {err}"))?
                        .trim()
                        .to_string();
                    el.attrs.push((key, value));
                }
                push_child(&mut stack, &mut doc, el);
            }
            Event::Text(t) => {
                if let Some(cur) = stack.last_mut() {
                    let decoded = t
                        .decode()
                        .map_err(|err| format!("XML text decode error: {err}"))?;
                    let value = quick_xml::escape::unescape(&decoded)
                        .map_err(|err| format!("XML text unescape error: {err}"))?;
                    let raw = cur.text.get_or_insert_with(String::new);
                    raw.push_str(&value);
                }
            }
            Event::CData(t) => {
                if let Some(cur) = stack.last_mut() {
                    let raw = cur.text.get_or_insert_with(String::new);
                    raw.push_str(&String::from_utf8_lossy(&t));
                }
            }
            Event::End(_) => {
                let mut el = stack
                    .pop()
                    .ok_or_else(|| "XML: unexpected closing tag".to_string())?;
                if let Some(t) = el.text.take() {
                    let trimmed = t.trim();
                    if !trimmed.is_empty() {
                        el.text = Some(trimmed.to_string());
                    }
                }
                push_child(&mut stack, &mut doc, el);
            }
            Event::Decl(_) | Event::PI(_) | Event::DocType(_) | Event::Comment(_) => {}
            Event::Eof => break,
            _ => {}
        }
    }

    Ok(doc)
}

fn push_child(stack: &mut Vec<Element>, doc: &mut Vec<Element>, el: Element) {
    match stack.last_mut() {
        Some(parent) => parent.children.push(el),
        None => doc.push(el),
    }
}

/// Find the root element (first top-level element), skipping `<?xml?>` decls.
pub fn root_element(doc: &[Element]) -> Option<&Element> {
    doc.first()
}
