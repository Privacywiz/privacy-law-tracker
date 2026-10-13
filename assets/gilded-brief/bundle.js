/* @ds-bundle: {"format":4,"namespace":"GildedBrief","components":[{"name":"Button"},{"name":"ClauseCallout"},{"name":"Disclaimer"},{"name":"AsOfStamp"},{"name":"StatusTag"},{"name":"SearchField"},{"name":"FilterSelect"},{"name":"JurisdictionCard"}]} */
(function () {
  var h = window.React.createElement;
  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(" "); }

  function Button(props) {
    var variant = props.variant || "primary";
    var size = props.size || "md";
    var rest = {};
    for (var k in props) if (k !== "variant" && k !== "size" && k !== "className" && k !== "children") rest[k] = props[k];
    rest.className = cx("gb-btn", "gb-btn-" + variant, "gb-btn-" + size, props.className);
    if (!rest.type) rest.type = "button";
    return h("button", rest, props.children);
  }

  function StarIcon() {
    return h("svg", { viewBox: "0 0 24 24", width: 20, height: 20, "aria-hidden": "true", className: "gb-callout-icon" },
      h("path", { d: "M12 2 L14.2 9.8 L22 12 L14.2 14.2 L12 22 L9.8 14.2 L2 12 L9.8 9.8 Z", fill: "currentColor" }));
  }
  function AlertIcon() {
    return h("svg", { viewBox: "0 0 24 24", width: 20, height: 20, "aria-hidden": "true", className: "gb-callout-icon" },
      h("circle", { cx: 12, cy: 12, r: 9.25, fill: "none", stroke: "currentColor", strokeWidth: 1.5 }),
      h("path", { d: "M12 7v6", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" }),
      h("circle", { cx: 12, cy: 16.5, r: 1.1, fill: "currentColor" }));
  }
  function QuillIcon() {
    return h("svg", { viewBox: "0 0 24 24", width: 20, height: 20, "aria-hidden": "true", className: "gb-callout-icon" },
      h("path", { d: "M20 4c-6 0-11 4-13 11l-2 5M7 15c3 0 6-1 8-4", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" }));
  }

  var TONE_WORD = { note: "Note", warning: "Warning", featured: "Key term" };
  var TONE_ICON = { note: QuillIcon, warning: AlertIcon, featured: StarIcon };

  function ClauseCallout(props) {
    var tone = props.tone || "note";
    var Icon = TONE_ICON[tone] || QuillIcon;
    var word = TONE_WORD[tone] || "Note";
    return h("aside", { className: cx("gb-callout", "gb-callout-" + tone, props.className), role: tone === "warning" ? "note" : undefined },
      h("div", { className: "gb-callout-head" },
        h(Icon),
        h("span", { className: "label gb-callout-label" }, word + (props.clause ? " · " + props.clause : ""))),
      props.title ? h("h3", { className: "heading-3 gb-callout-title" }, props.title) : null,
      h("div", { className: "body gb-callout-body" }, props.children));
  }

  function svg(size, children, cls) {
    return h.apply(null, ["svg", { viewBox: "0 0 24 24", width: size, height: size, "aria-hidden": "true", className: cls, fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" }].concat(children));
  }

  function Disclaimer(props) {
    var heading = props.heading || "Informational only.";
    return h("aside", { className: cx("gb-disclaimer", props.className) },
      svg(20, [
        h("path", { key: 1, d: "M12 3v18M7 21h10M4 7h16M12 5l-1-2h2z" }),
        h("path", { key: 2, d: "M6 7l-3 6a3 3 0 0 0 6 0zM18 7l-3 6a3 3 0 0 0 6 0z" })
      ], "gb-disclaimer-icon"),
      h("p", { className: "body-small gb-disclaimer-text" },
        h("strong", null, heading), " ", props.children));
  }

  function AsOfStamp(props) {
    return h("p", { className: cx("label gb-asof", props.className) },
      svg(14, [h("path", { key: 1, d: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z", fill: "currentColor", stroke: "none" })], "gb-asof-icon"),
      h("span", null, "Current as of ", h("time", { dateTime: props.dateTime }, props.date)),
      props.source ? h("span", { className: "gb-asof-source" }, "· " + props.source) : null);
  }

  function StatusTag(props) {
    var tone = props.tone || "neutral";
    var icon = tone === "yes" ? [h("path", { key: 1, d: "M5 12.5l4.5 4.5L19 7.5" })]
      : tone === "no" ? [h("path", { key: 1, d: "M7 7l10 10M17 7L7 17" })]
      : [h("circle", { key: 1, cx: 12, cy: 12, r: 3, fill: "currentColor", stroke: "none" })];
    return h("span", { className: cx("label gb-tag", "gb-tag-" + tone, props.className) },
      svg(12, icon, "gb-tag-icon"), props.children);
  }

  function SearchField(props) {
    var rest = {};
    for (var k in props) if (k !== "label" && k !== "className") rest[k] = props[k];
    rest.type = "search"; rest.className = "gb-search-input"; rest.autoComplete = "off";
    rest["aria-label"] = props.label || props.placeholder || "Search";
    return h("label", { className: cx("gb-search", props.className) },
      svg(16, [h("circle", { key: 1, cx: 11, cy: 11, r: 7 }), h("path", { key: 2, d: "m21 21-4.3-4.3" })], "gb-search-icon"),
      h("input", rest));
  }

  function FilterSelect(props) {
    var rest = {};
    for (var k in props) if (k !== "label" && k !== "options" && k !== "className") rest[k] = props[k];
    rest.className = "body gb-select-input"; rest["aria-label"] = props.label;
    return h("span", { className: cx("gb-select", props.className) },
      h.apply(null, ["select", rest].concat((props.options || []).map(function (o) {
        return h("option", { key: o.value, value: o.value }, o.label);
      }))),
      svg(14, [h("path", { key: 1, d: "M6 9l6 6 6-6" })], "gb-select-icon"));
  }

  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function mark(text, term) {
    if (!term || typeof text !== "string") return text;
    var parts = text.split(new RegExp("(" + escRe(term) + ")", "ig"));
    return parts.map(function (p, i) { return i % 2 ? h("mark", { key: i, className: "gb-mark" }, p) : p; });
  }
  function isNone(v) { return typeof v === "string" && /^none\b/i.test(v.trim()); }

  function JurisdictionCard(props) {
    var R = window.React;
    var st = R.useState(!!props.defaultOpen), open = props.open != null ? props.open : st[0];
    var term = props.highlight;
    return h("details", {
      className: cx("gb-jx", props.className), open: open,
      onToggle: function (e) { if (props.open == null) st[1](e.currentTarget.open); if (props.onToggle) props.onToggle(e.currentTarget.open); }
    },
      h("summary", { className: "gb-jx-summary" },
        svg(16, [h("path", { key: 1, d: "M9 6l6 6-6 6" })], "gb-jx-chevron"),
        h("span", { className: "gb-jx-name" }, mark(props.name, term)),
        props.status ? h(StatusTag, { tone: props.status.tone }, props.status.label) : null,
        props.citation ? h("span", { className: "body-small gb-jx-cite" }, mark(props.citation, term)) : null),
      h("dl", { className: "gb-jx-fields" }, (props.fields || []).map(function (f, i) {
        var none = isNone(f.value);
        return h("div", { key: i, className: "gb-jx-field" },
          h("dt", { className: "label gb-jx-label" }, f.label),
          h("dd", { className: cx("body-small gb-jx-value", none && "gb-jx-none") }, mark(f.value, term)));
      })));
  }

  window.GildedBrief = window.GildedBrief || {};
  window.GildedBrief.Button = Button;
  window.GildedBrief.ClauseCallout = ClauseCallout;
  window.GildedBrief.Disclaimer = Disclaimer;
  window.GildedBrief.AsOfStamp = AsOfStamp;
  window.GildedBrief.StatusTag = StatusTag;
  window.GildedBrief.SearchField = SearchField;
  window.GildedBrief.FilterSelect = FilterSelect;
  window.GildedBrief.JurisdictionCard = JurisdictionCard;
})();
