---
title: SVG elements DSL in Phlex
---

# SVG elements

`Phlex::SVG` works like `Phlex::HTML`, but with a method for each SVG element instead of each HTML element. You can use it to write standalone SVG components, such as icons and charts, and you get the same SVG methods inside the [`svg`](/sgml/html-elements#svg) element of an HTML component.

## SVG components

Subclass `Phlex::SVG` and define a `view_template`, just like you would with an HTML component.

```ruby
class Circle < Phlex::SVG
  def initialize(size:)
    @size = size
  end

  def view_template
    svg(
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 #{@size} #{@size}",
      width: @size,
      height: @size
    ) do
      circle(cx: @size / 2, cy: @size / 2, r: @size / 2, fill: "currentColor")
    end
  end
end

Circle.new(size: 24).call
```

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <circle cx="12" cy="12" r="12" fill="currentColor"></circle>
</svg>
```

Everything you know from HTML components carries over: [attributes](/sgml/attributes), [`plain`](/sgml/text), [`whitespace`](/sgml/whitespace), [`comment`](/sgml/comments), [`raw` and `safe`](/sgml/raw), [`tag`, `mix` and the other helpers](/sgml/helpers), and [rendering other components](/components/rendering). An SVG component’s `content_type` is `"image/svg+xml"`.

You can render an SVG component from an HTML component.

```ruby
div { render Circle.new(size: 24) }
```

### Element and attribute names

SVG is case-sensitive, so element methods use the same camel case as the elements: `clipPath`, `linearGradient`, `foreignObject`, `feGaussianBlur` and so on.

Symbol attribute keys have underscores replaced with dashes, which suits attributes like `stroke_width:`. Camel case attributes such as `viewBox:` and `stdDeviation:` don’t contain underscores, so you can write them as they are.

```ruby
clipPath(id: "clip") { rect(width: 10, height: 10) }
path(d: "M0 0 L10 10", stroke_width: 2)
feGaussianBlur(stdDeviation: 2)
```

```html
<clipPath id="clip">
  <rect width="10" height="10"></rect>
</clipPath>
<path d="M0 0 L10 10" stroke-width="2"></path>
<feGaussianBlur stdDeviation="2"></feGaussianBlur>
```

All SVG elements are standard elements, so they always render a closing tag.

## Inline SVG in HTML

In a `Phlex::HTML` component, the `svg` element yields a `Phlex::SVG` component. Call the SVG element methods on the object that’s yielded.

```ruby
class Icon < Phlex::HTML
  def view_template
    svg(viewBox: "0 0 10 10", class: "icon") do |s|
      s.circle(cx: 5, cy: 5, r: 4)
    end
  end
end
```

```html
<svg viewBox="0 0 10 10" class="icon">
  <circle cx="5" cy="5" r="4"></circle>
</svg>
```

Inside the block, `self` is still your HTML component, so calling `circle` without the receiver raises a `NoMethodError`. The yielded SVG component has only SVG elements, so `s.div` raises too. To embed HTML in an SVG, use `foreignObject`.

If you only need a string of SVG and don’t want to define a component, see [`Phlex.svg`](/sgml/string-builder).

## CDATA sections <Badge type="info" text="2.1+" />

`cdata` outputs a [CDATA section](https://developer.mozilla.org/en-US/docs/Web/API/CDATASection), which is useful for inline styles and scripts that contain characters like `<` and `&`. Pass it a String.

```ruby
style { cdata("a > b { fill: red }") }
```

```html
<style><![CDATA[a > b { fill: red }]]></style>
```

Or pass a block, and whatever the block renders is wrapped in a CDATA section.

```ruby
cdata { circle(r: 1) }
```

```html
<![CDATA[<circle r="1"></circle>]]>
```

If the content contains `]]>`, it’s split across two sections so it can’t end the section early. In Phlex 2.4, the `>` is lost in the split, so `a]]>b` is read back as `a]]b`. `cdata` takes a String or a block, not both. Anything else raises `Phlex::ArgumentError: Expected a String or block.`

::: warning
The content of a CDATA section isn’t escaped, and it’s only a CDATA section inside an `<svg>` element or in an SVG document. Anywhere else in an HTML page, the browser reads it as a comment that ends at the first `>`, and parses the rest of the content as markup. Don’t render a `Phlex::SVG` component that uses `cdata` outside an `<svg>` element.
:::

## What’s different from HTML

A few things on `Phlex::HTML` aren’t available on `Phlex::SVG`:

- There’s no `register_element`. To render an element Phlex doesn’t know about, use [`tag`](/sgml/helpers#tag) with a name that contains a dash, e.g. `tag(:my_shape)`. In SVG, `tag` won’t render `script` or `style`.
- There’s no `doctype`.
- There are no void elements.

And `cdata` is only available on `Phlex::SVG`.

## Element reference

Every element registered in Phlex 2.4.2 is listed here.

### `a`

Renders an [`<a>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/a) element.

### `animate`

Renders an [`<animate>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/animate) element.

### `animateMotion`

Renders an [`<animateMotion>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/animateMotion) element.

### `animateTransform`

Renders an [`<animateTransform>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/animateTransform) element.

### `circle`

Renders a [`<circle>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/circle) element.

### `clipPath`

Renders a [`<clipPath>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/clipPath) element.

### `defs`

Renders a [`<defs>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/defs) element.

### `desc`

Renders a [`<desc>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/desc) element.

### `discard`

Renders a [`<discard>`](https://svgwg.org/specs/animations/#DiscardElement) element.

### `ellipse`

Renders an [`<ellipse>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/ellipse) element.

### `feBlend`

Renders a [`<feBlend>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feBlend) element.

### `feColorMatrix`

Renders a [`<feColorMatrix>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feColorMatrix) element.

### `feComponentTransfer`

Renders a [`<feComponentTransfer>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feComponentTransfer) element.

### `feComposite`

Renders a [`<feComposite>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feComposite) element.

### `feConvolveMatrix`

Renders a [`<feConvolveMatrix>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feConvolveMatrix) element.

### `feDiffuseLighting`

Renders a [`<feDiffuseLighting>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feDiffuseLighting) element.

### `feDisplacementMap`

Renders a [`<feDisplacementMap>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feDisplacementMap) element.

### `feDistantLight`

Renders a [`<feDistantLight>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feDistantLight) element.

### `feDropShadow`

Renders a [`<feDropShadow>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feDropShadow) element.

### `feFlood`

Renders a [`<feFlood>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feFlood) element.

### `feFuncA`

Renders a [`<feFuncA>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feFuncA) element.

### `feFuncB`

Renders a [`<feFuncB>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feFuncB) element.

### `feFuncG`

Renders a [`<feFuncG>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feFuncG) element.

### `feFuncR`

Renders a [`<feFuncR>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feFuncR) element.

### `feGaussianBlur`

Renders a [`<feGaussianBlur>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feGaussianBlur) element.

### `feImage`

Renders a [`<feImage>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feImage) element.

### `feMerge`

Renders a [`<feMerge>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feMerge) element.

### `feMergeNode`

Renders a [`<feMergeNode>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feMergeNode) element.

### `feMorphology`

Renders a [`<feMorphology>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feMorphology) element.

### `feOffset`

Renders a [`<feOffset>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feOffset) element.

### `fePointLight`

Renders a [`<fePointLight>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/fePointLight) element.

### `feSpecularLighting`

Renders a [`<feSpecularLighting>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feSpecularLighting) element.

### `feSpotLight`

Renders a [`<feSpotLight>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feSpotLight) element.

### `feTile`

Renders a [`<feTile>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feTile) element.

### `feTurbulence`

Renders a [`<feTurbulence>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feTurbulence) element.

### `filter`

Renders a [`<filter>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/filter) element.

### `foreignObject`

Renders a [`<foreignObject>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/foreignObject) element.

### `g`

Renders a [`<g>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/g) element.

### `image`

Renders a [`<image>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/image) element.

### `line`

Renders a [`<line>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/line) element.

### `linearGradient`

Renders a [`<linearGradient>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/linearGradient) element.

### `marker`

Renders a [`<marker>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/marker) element.

### `mask`

Renders a [`<mask>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/mask) element.

### `metadata`

Renders a [`<metadata>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/metadata) element.

### `mpath`

Renders a [`<mpath>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/mpath) element.

### `path`

Renders a [`<path>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/path) element.

### `pattern`

Renders a [`<pattern>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/pattern) element.

### `polygon`

Renders a [`<polygon>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/polygon) element.

### `polyline`

Renders a [`<polyline>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/polyline) element.

### `radialGradient`

Renders a [`<radialGradient>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/radialGradient) element.

### `rect`

Renders a [`<rect>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/rect) element.

### `script`

Renders a [`<script>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/script) element.

### `set`

Renders a [`<set>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/set) element.

### `stop`

Renders a [`<stop>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/stop) element.

### `style`

Renders a [`<style>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/style) element.

### `svg`

Renders a [`<svg>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/svg) element.

### `switch`

Renders a [`<switch>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/switch) element.

### `symbol`

Renders a [`<symbol>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/symbol) element.

### `text`

Renders a [`<text>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/text) element.

### `textPath`

Renders a [`<textPath>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/textPath) element.

### `title`

Renders a [`<title>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/title) element.

### `tspan`

Renders a [`<tspan>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/tspan) element.

### `use`

Renders a [`<use>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/use) element.

### `view`

Renders a [`<view>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/view) element.
