---
title: HTML elements DSL in Phlex
---

# HTML elements

For every HTML element, `Phlex::HTML` has an instance method with the same name. Keyword arguments become [attributes](/sgml/attributes) and the block becomes the element’s content.

```ruby
div(class: "card") do
  h1 { "Hello" }
  img(src: "/cat.png", alt: "A cat")
end
```

```html
<div class="card">
  <h1>Hello</h1>
  <img src="/cat.png" alt="A cat">
</div>
```

## Standard and void elements

Most elements are **standard elements**. They always render an opening and a closing tag, with or without a block.

```ruby
div
div { "Hello" }
```

```html
<div></div>
<div>Hello</div>
```

Twelve elements are **void elements**: `area`, `base`, `br`, `col`, `embed`, `hr`, `img`, `input`, `link`, `meta`, `source` and `track`. They can’t have content, so they never render a closing tag and any block you pass is ignored.

```ruby
br
input(type: "text", name: "email")
```

```html
<br><input type="text" name="email">
```

## Content goes in the block

Element methods only accept keyword arguments and a block. There is no positional argument for content.

```ruby
h1 "Hello" # ArgumentError: wrong number of arguments (given 1, expected 0)
h1 { "Hello" } # <h1>Hello</h1>
```

If the block doesn’t output anything itself, its return value is used as [text](/sgml/text#implicit-text-output-from-blocks).

## Blocks yield the component

The block is called with the current component, which lets you use the same block style whether you’re writing a template or [yielding an interface](/components/yielding) to someone else.

```ruby
div { |component| component.h1 { "Hello" } }
```

```html
<div>
  <h1>Hello</h1>
</div>
```

The one exception is [`svg`](#svg), which yields a `Phlex::SVG` component so you can use the [SVG elements](/sgml/svg-elements).

## Custom elements

To use a custom element, such as a web component, register it with the class method `register_element`. This defines an instance method that works like any other standard element. Underscores (`_`) in the name are replaced with dashes (`-`) in the tag.

```ruby
class Example < Phlex::HTML
  register_element :trix_editor

  def view_template
    trix_editor(input: "content") { "Loading…" }
  end
end
```

```html
<trix-editor input="content">Loading…</trix-editor>
```

If you want the method name and the tag name to differ, pass the tag name with `tag:`.

```ruby
class Example < Phlex::HTML
  register_element :editor, tag: "trix-editor"

  def view_template
    editor
  end
end
```

```html
<trix-editor></trix-editor>
```

Registered elements are inherited, so you can register your custom elements once in a base component. `register_element` is only available on `Phlex::HTML`. It isn’t available on `Phlex::SVG`.

::: tip
If you only need a custom element in one place, or its name is dynamic, you can use [`tag`](/sgml/helpers#tag) without registering anything.

```ruby
tag(:trix_editor, input: "content")
```

:::

## Element reference

Every element registered in Phlex 2.4.2 is listed here.

### `a`

Renders an [`<a>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a) element.

### `abbr`

Renders an [`<abbr>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/abbr) element.

### `address`

Renders an [`<address>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/address) element.

### `area`

Renders an [`<area>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/area) void element.

### `article`

Renders an [`<article>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/article) element.

### `aside`

Renders an [`<aside>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/aside) element.

### `audio`

Renders an [`<audio>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/audio) element.

### `b`

Renders a [`<b>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/b) element.

### `base`

Renders a [`<base>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/base) void element.

### `bdi`

Renders a [`<bdi>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/bdi) element.

### `bdo`

Renders a [`<bdo>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/bdo) element.

### `blockquote`

Renders a [`<blockquote>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/blockquote) element.

### `body`

Renders a [`<body>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/body) element.

### `br`

Renders a [`<br>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/br) void element.

### `button`

Renders a [`<button>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button) element.

### `canvas`

Renders a [`<canvas>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/canvas) element.

### `caption`

Renders a [`<caption>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/caption) element.

### `cite`

Renders a [`<cite>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/cite) element.

### `code`

Renders a [`<code>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/code) element.

### `col`

Renders a [`<col>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/col) void element.

### `colgroup`

Renders a [`<colgroup>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/colgroup) element.

### `data`

Renders a [`<data>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/data) element.

### `datalist`

Renders a [`<datalist>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/datalist) element.

### `dd`

Renders a [`<dd>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dd) element.

### `del`

Renders a [`<del>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/del) element.

### `details`

Renders a [`<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details) element.

### `dfn`

Renders a [`<dfn>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dfn) element.

### `dialog`

Renders a [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) element.

### `div`

Renders a [`<div>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/div) element.

### `dl`

Renders a [`<dl>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dl) element.

### `dt`

Renders a [`<dt>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dt) element.

### `em`

Renders an [`<em>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/em) element.

### `embed`

Renders an [`<embed>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/embed) void element.

### `fencedframe`

Renders a [`<fencedframe>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/fencedframe) element.

### `fieldset`

Renders a [`<fieldset>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/fieldset) element.

### `figcaption`

Renders a [`<figcaption>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/figcaption) element.

### `figure`

Renders a [`<figure>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/figure) element.

### `footer`

Renders a [`<footer>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/footer) element.

### `form`

Renders a [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form) element.

### `h1`

Renders an [`<h1>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/Heading_Elements) element.

### `h2`

Renders an [`<h2>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/Heading_Elements) element.

### `h3`

Renders an [`<h3>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/Heading_Elements) element.

### `h4`

Renders an [`<h4>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/Heading_Elements) element.

### `h5`

Renders an [`<h5>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/Heading_Elements) element.

### `h6`

Renders an [`<h6>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/Heading_Elements) element.

### `head`

Renders a [`<head>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/head) element. When [streaming](/components/streaming), Phlex flushes the buffer after the closing `</head>` tag.

### `header`

Renders a [`<header>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/header) element.

### `hgroup`

Renders a [`<hgroup>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/hgroup) element.

### `hr`

Renders an [`<hr>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/hr) void element.

### `html`

Renders an [`<html>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/html) element.

### `i`

Renders an [`<i>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/i) element.

### `iframe`

Renders an [`<iframe>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe) element.

### `img`

Renders an [`<img>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img) void element. An Array passed as `srcset:` is [joined with commas](/sgml/attributes#comma-separated-lists).

### `input`

Renders an [`<input>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input) void element. When `type:` is `file`, an Array passed as `accept:` is [joined with commas](/sgml/attributes#comma-separated-lists).

### `ins`

Renders an [`<ins>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ins) element.

### `kbd`

Renders a [`<kbd>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/kbd) element.

### `label`

Renders a [`<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label) element.

### `legend`

Renders a [`<legend>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/legend) element.

### `li`

Renders an [`<li>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/li) element.

### `link`

Renders a [`<link>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/link) void element. Arrays passed as `media:`, `sizes:` and `imagesrcset:` are [joined with commas](/sgml/attributes#comma-separated-lists).

### `main`

Renders a [`<main>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/main) element.

### `map`

Renders a [`<map>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/map) element.

### `mark`

Renders a [`<mark>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/mark) element.

### `menu`

Renders a [`<menu>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/menu) element.

### `meta`

Renders a [`<meta>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta) void element.

### `meter`

Renders a [`<meter>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meter) element.

### `nav`

Renders a [`<nav>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/nav) element.

### `noscript`

Renders a [`<noscript>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/noscript) element.

### `object`

Renders an [`<object>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/object) element.

### `ol`

Renders an [`<ol>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ol) element.

### `optgroup`

Renders an [`<optgroup>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/optgroup) element.

### `option`

Renders an [`<option>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/option) element.

### `output`

Renders an [`<output>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/output) element.

### `p`

Renders a [`<p>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/p) element.

### `picture`

Renders a [`<picture>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/picture) element.

### `pre`

Renders a [`<pre>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/pre) element.

### `progress`

Renders a [`<progress>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress) element.

### `q`

Renders a [`<q>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/q) element.

### `rp`

Renders an [`<rp>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/rp) element.

### `rt`

Renders an [`<rt>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/rt) element.

### `ruby`

Renders a [`<ruby>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ruby) element.

### `s`

Renders an [`<s>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/s) element.

### `samp`

Renders a [`<samp>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/samp) element.

### `script`

Renders a [`<script>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script) element.

### `search`

Renders a [`<search>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/search) element.

### `section`

Renders a [`<section>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/section) element.

### `select`

Renders a [`<select>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/select) element.

### `selectedcontent`

Renders a [`<selectedcontent>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/selectedcontent) element.

### `slot`

Renders a [`<slot>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/slot) element.

### `small`

Renders a [`<small>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/small) element.

### `source`

Renders a [`<source>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/source) void element.

### `span`

Renders a [`<span>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/span) element.

### `strong`

Renders a [`<strong>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/strong) element.

### `style`

Renders a [`<style>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/style) element.

### `sub`

Renders a [`<sub>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/sub) element.

### `summary`

Renders a [`<summary>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/summary) element.

### `sup`

Renders a [`<sup>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/sup) element.

### `svg`

Renders an [`<svg>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/svg) element. The block yields a `Phlex::SVG` component. See [inline SVG in HTML](/sgml/svg-elements#inline-svg-in-html).

```ruby
svg(viewBox: "0 0 120 120") do |s|
  s.rect(x: 10, y: 10, width: 100, height: 100)
end
```

### `table`

Renders a [`<table>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/table) element.

### `tbody`

Renders a [`<tbody>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/tbody) element.

### `td`

Renders a [`<td>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/td) element.

### `template`

Renders a [`<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/template) element.

### `textarea`

Renders a [`<textarea>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/textarea) element.

### `tfoot`

Renders a [`<tfoot>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/tfoot) element.

### `th`

Renders a [`<th>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/th) element.

### `thead`

Renders a [`<thead>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/thead) element.

### `time`

Renders a [`<time>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/time) element.

### `title`

Renders a [`<title>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/title) element.

### `tr`

Renders a [`<tr>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/tr) element.

### `track`

Renders a [`<track>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/track) void element.

### `u`

Renders a [`<u>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/u) element.

### `ul`

Renders a [`<ul>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ul) element.

### `var`

Renders a [`<var>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/var) element.

### `video`

Renders a [`<video>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video) element.

### `wbr`

Renders a [`<wbr>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/wbr) element.
