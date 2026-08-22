'use strict';

function document(options) {
  var config = options || {};
  var patcher = {
    fileversion: 1,
    appversion: { major: 8, minor: 6, revision: 5, architecture: 'x64', modernui: 1 },
    classnamespace: 'box',
    rect: config.rect || [0, 0, 1200, 600],
    bglocked: 0,
    openinpresentation: 1,
    default_fontsize: 12,
    default_fontface: 0,
    default_fontname: 'Arial',
    gridonopen: 1,
    gridsize: [15, 15],
    boxes: [],
    lines: [],
    dependency_cache: [],
    autosave: 0
  };
  if (config.amxdtype !== undefined && config.amxdtype !== null) {
    patcher.amxdtype = config.amxdtype;
  }
  return { patcher: patcher };
}

function add(doc, id, maxclass, text, rect, attributes) {
  var box = {
    id: id,
    maxclass: maxclass,
    patching_rect: rect || [0, 0, 80, 22]
  };
  var key;
  if (text !== undefined && text !== null && text !== '') {
    box.text = text;
  }
  attributes = attributes || {};
  for (key in attributes) {
    if (Object.prototype.hasOwnProperty.call(attributes, key)) {
      box[key] = attributes[key];
    }
  }
  doc.patcher.boxes.push({ box: box });
  return id;
}

function connect(doc, source, outlet, destination, inlet, order) {
  var patchline = {
    source: [source, outlet || 0],
    destination: [destination, inlet || 0]
  };
  if (order !== undefined && order !== null) {
    patchline.order = order;
  }
  doc.patcher.lines.push({ patchline: patchline });
}

function parameterAttributes(name, min, max, initial, unitstyle) {
  return {
    parameter_enable: 1,
    varname: name,
    saved_attribute_attributes: {
      valueof: {
        parameter_longname: name,
        parameter_shortname: name,
        parameter_mmin: min,
        parameter_mmax: max,
        parameter_initial: [initial],
        parameter_initial_enable: 1,
        parameter_unitstyle: unitstyle || 0
      }
    }
  };
}

function dial(doc, id, name, x, y, min, max, initial, unitstyle) {
  var attrs = parameterAttributes(name, min, max, initial, unitstyle);
  attrs.presentation = 1;
  attrs.presentation_rect = [x, y, 48, 48];
  attrs.floatoutput = 1;
  return add(doc, id, 'live.dial', null, [x, y, 48, 48], attrs);
}

function toggle(doc, id, name, x, y, initial) {
  var attrs = parameterAttributes(name, 0, 1, initial || 0, 0);
  attrs.presentation = 1;
  attrs.presentation_rect = [x, y, 34, 18];
  return add(doc, id, 'live.toggle', null, [x, y, 34, 18], attrs);
}

function button(doc, id, label, x, y, width) {
  return add(doc, id, 'live.text', null, [x, y, width || 92, 22], {
    presentation: 1,
    presentation_rect: [x, y, width || 92, 22],
    text: label,
    texton: label,
    mode: 1,
    parameter_enable: 0
  });
}

function menu(doc, id, name, items, x, y, width, initial) {
  var attrs = parameterAttributes(name, 0, Math.max(0, items.length - 1), initial || 0, 0);
  attrs.presentation = 1;
  attrs.presentation_rect = [x, y, width || 100, 22];
  attrs.items = items;
  return add(doc, id, 'live.menu', null, [x, y, width || 100, 22], attrs);
}

function comment(doc, id, text, x, y, width, size, bold) {
  return add(doc, id, 'comment', text, [x, y, width || 120, size ? size + 8 : 22], {
    presentation: 1,
    presentation_rect: [x, y, width || 120, size ? size + 8 : 22],
    fontsize: size || 11,
    fontface: bold ? 1 : 0
  });
}

function message(doc, id, text, x, y, width) {
  return add(doc, id, 'message', text, [x, y, width || 90, 22]);
}

function object(doc, id, text, x, y, width) {
  return add(doc, id, 'newobj', text, [x, y, width || 100, 22]);
}

function save(file, doc, fs) {
  fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
}

function allBoxTexts(doc) {
  var output = [];
  function visit(patcher) {
    (patcher.boxes || []).forEach(function (entry) {
      var box = entry.box || {};
      output.push(String(box.text || ''));
      if (box.patcher) {
        visit(box.patcher);
      }
    });
  }
  visit(doc.patcher);
  return output;
}

module.exports = {
  document: document,
  add: add,
  connect: connect,
  dial: dial,
  toggle: toggle,
  button: button,
  menu: menu,
  comment: comment,
  message: message,
  object: object,
  save: save,
  allBoxTexts: allBoxTexts
};
