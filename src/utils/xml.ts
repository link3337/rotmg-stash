export function xmlToJson(xml: any) {
  var X = {
    toObj: function (xml: any) {
      var o: any = {};
      if (xml.nodeType == 1) {
        // element node ..
        if (xml.attributes.length)
          // element with attributes  ..
          for (var i = 0; i < xml.attributes.length; i++)
            o[xml.attributes[i].nodeName] = (xml.attributes[i].nodeValue || '').toString();
        if (xml.firstChild) {
          // element has child nodes ..
          var textChild = 0,
            cdataChild = 0,
            hasElementChild = false;
          for (var n = xml.firstChild; n; n = n.nextSibling) {
            if (n.nodeType == 1) hasElementChild = true;
            else if (n.nodeType == 3 && n.nodeValue.match(/[^ \f\n\r\t\v]/))
              textChild++; // non-whitespace text
            else if (n.nodeType == 4) cdataChild++; // cdata section node
          }
          if (hasElementChild) {
            if (textChild < 2 && cdataChild < 2) {
              // structured element with evtl. a single text or/and cdata node ..
              X.removeWhite(xml);
              for (var n = xml.firstChild; n; n = n.nextSibling) {
                if (n.nodeType == 3)
                  // text node
                  o['#text'] = X.escape(n.nodeValue);
                else if (n.nodeType == 4)
                  // cdata node
                  o['#cdata'] = X.escape(n.nodeValue);
                else if (o[n.nodeName]) {
                  // multiple occurence of element ..
                  if (o[n.nodeName] instanceof Array)
                    o[n.nodeName][o[n.nodeName].length] = X.toObj(n);
                  else o[n.nodeName] = [o[n.nodeName], X.toObj(n)];
                } // first occurence of element..
                else o[n.nodeName] = X.toObj(n);
              }
            } else {
              // mixed content
              if (!xml.attributes.length) o = X.escape(X.innerXml(xml));
              else o['#text'] = X.escape(X.innerXml(xml));
            }
          } else if (textChild) {
            // pure text
            if (!xml.attributes.length) o = X.escape(X.innerXml(xml));
            else o['#text'] = X.escape(X.innerXml(xml));
          } else if (cdataChild) {
            // cdata
            if (cdataChild > 1) o = X.escape(X.innerXml(xml));
            else
              for (var n = xml.firstChild; n; n = n.nextSibling)
                o['#cdata'] = X.escape(n.nodeValue);
          }
        }
        if (!xml.attributes.length && !xml.firstChild) o = null;
      } else if (xml.nodeType == 9) {
        // document.node
        o = X.toObj(xml.documentElement);
      } else alert('unhandled node type: ' + xml.nodeType);
      return o;
    },
    innerXml: function (node: any) {
      var s = '';
      if ('innerHTML' in node) s = node.innerHTML;
      else {
        var asXml = function (n: any) {
          var s = '';
          if (n.nodeType == 1) {
            s += '<' + n.nodeName;
            for (var i = 0; i < n.attributes.length; i++)
              s +=
                ' ' +
                n.attributes[i].nodeName +
                '="' +
                (n.attributes[i].nodeValue || '').toString() +
                '"';
            if (n.firstChild) {
              s += '>';
              for (var c = n.firstChild; c; c = c.nextSibling) s += asXml(c);
              s += '</' + n.nodeName + '>';
            } else s += '/>';
          } else if (n.nodeType == 3) s += n.nodeValue;
          else if (n.nodeType == 4) s += '<![CDATA[' + n.nodeValue + ']]>';
          return s;
        };
        for (var c = node.firstChild; c; c = c.nextSibling) s += asXml(c);
      }
      return s;
    },
    escape: function (txt: any) {
      return txt
        .replace(/[\\]/g, '\\\\')
        .replace(/[\"]/g, '\\"')
        .replace(/[\n]/g, '\\n')
        .replace(/[\r]/g, '\\r');
    },

    removeWhite: function (e: any) {
      e.normalize();
      for (var n = e.firstChild; n; ) {
        if (n.nodeType == 3) {
          // text node
          if (!n.nodeValue.match(/[^ \f\n\r\t\v]/)) {
            // pure whitespace text node
            var nxt = n.nextSibling;
            e.removeChild(n);
            n = nxt;
          } else n = n.nextSibling;
        } else if (n.nodeType == 1) {
          // element node
          X.removeWhite(n);
          n = n.nextSibling;
        } // any other node
        else n = n.nextSibling;
      }
      return e;
    }
  };
  if (xml.nodeType == 9)
    // document node
    xml = xml.documentElement;
  return X.toObj(X.removeWhite(xml));
}
