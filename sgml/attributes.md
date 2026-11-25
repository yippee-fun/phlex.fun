---
title: Rendering HTML attributes from Phlex
---

# Attributes

In Phlex, HTML elements are rendered via method calls and the keyword arguments are the attributes. Phlex has an attribute builder that handles a number of different kinds of keys and values.

```ruby
a(href: "/about", class: ["link", "active"], data: { turbo_frame: "main" }) { "About" }
```

```html
<a href="/about" class="link active" data-turbo-frame="main">About</a>
```

## Summary

| Value                              | What it renders                                               | Example                                                  |
| ---------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| [String](#strings)                 | The string, with `"`, `<` and `>` escaped                     | `class: "a b"` → `class="a b"`                           |
| [Symbol](#symbols)                 | The name, with `_` replaced by `-`                            | `dir: :auto` → `dir="auto"`                              |
| [Integer or Float](#numbers)       | The number                                                    | `tabindex: 0` → `tabindex="0"`                           |
| [`true`](#booleans)                | The attribute name on its own                                 | `disabled: true` → `disabled`                            |
| [`false` or `nil`](#booleans)      | Nothing                                                       | `disabled: false` →                                      |
| [Array or Set](#arrays-and-sets)   | The tokens joined with spaces                                 | `class: ["a", "b"]` → `class="a b"`                      |
| [Hash](#hashes)                    | One attribute per key, prefixed with the parent key and a `-` | `data: { id: 1 }` → `data-id="1"`                        |
| [Date or Time](#dates-and-times)   | ISO 8601                                                      | `datetime: Date.new(2025, 1, 2)` → `datetime="2025-01-02"` |
| [Object with `to_h`](#objects-that-respond-to-to-h) | The same as a Hash                           | `data: Point.new(x: 1)` → `data-x="1"`                   |
| [Safe value](/sgml/raw#safe)       | The string, escaped like any other, skipping the [safety checks](#safety) | `onclick: safe("go()")` → `onclick="go()"`   |

Anything else raises a `Phlex::ArgumentError`.

The `style` attribute [has its own rules](#the-style-attribute) for Hashes and Arrays, and a few attributes are [joined with commas](#comma-separated-lists) instead of spaces.

## Attribute keys

Typically, keys will be passed as Ruby Symbols. When working with symbols, Phlex will replace underscores (`_`) with dashes (`-`). This is because the convention in HTML is to use dashes to separate each word in a symbol, while on the Ruby side dashes are not allowed in unquoted symbol literals.

If you need to keep an underscore in the attribute name, you can use a String as the key instead:

::: code-group

```ruby [Phlex]
h1(data_controller: "hello") { "Hello!" }
h1("data_controller" => "hello") { "Hello!" }
```

```html [HTML]
<h1 data-controller="hello">Hello!</h1>
<h1 data_controller="hello">Hello!</h1>
```

:::

::: tip
You need to use the “hash rocket” `=>` style with String keys in Ruby.
:::

Keys must be Strings or Symbols. Anything else raises `Phlex::ArgumentError: Attribute keys should be Strings or Symbols.`

Attribute names can’t contain whitespace or any of the characters `<`, `>`, `&`, `"`, `'`, `/` or `=`. If they do, Phlex raises `Phlex::ArgumentError: Unsafe attribute name detected`. This protects you if you ever [splat untrusted data](/miscellaneous/structural-safety#attribute-keys) into an element.

### The `id` attribute

The `id` attribute must be passed with the lowercase Symbol key `:id`. Passing it as `"id"` or `:ID` raises an error.

```ruby
div("id" => "main")
# Phlex::ArgumentError: :id attribute should only be passed as a lowercase symbol.
```

## Attribute values

### Strings

Strings are output as they are, apart from three characters that are escaped.

::: code-group

```ruby [Phlex]
input(name: "first_name")
```

```html [HTML]
<input name="first_name">
```

:::

Attribute values are always wrapped in double quotes, so `"` is escaped as `&quot;` to stop a value ending early. `<` and `>` are escaped as `&lt;` and `&gt;`, so a value can’t close a [comment](/sgml/comments) or an element such as `<noscript>` that it’s rendered inside. The browser reads back the same value you passed in.

::: code-group

```ruby [Phlex]
input(value: %(Say "hi" to <b>Ada</b>))
```

```html [HTML]
<input value="Say &quot;hi&quot; to &lt;b&gt;Ada&lt;/b&gt;">
```

:::

Every kind of value is escaped this way, including Symbols, tokens in an Array, `style` values, nested attributes and [safe values](/sgml/raw#safe).

### Symbols

Phlex will replace underscores (`_`) with dashes (`-`) in Symbol values.

::: code-group

```ruby [Phlex]
div(contenteditable: :plaintext_only)
```

```html [HTML]
<div contenteditable="plaintext-only"></div>
```

:::

### Numbers

Integers and Floats are converted to Strings.

::: code-group

```ruby [Phlex]
input(type: "number", maxlength: 5, step: 0.5)
```

```html [HTML]
<input type="number" maxlength="5" step="0.5">
```

:::

### Booleans

If the value is `true`, Phlex will render the attribute without a value. If the value is `false`, Phlex will not render the attribute at all.

::: code-group

```ruby [Phlex]
textarea(disabled: true)
textarea(disabled: false)
```

```html [HTML]
<textarea disabled></textarea>
<textarea></textarea>
```

:::

::: tip
Some HTML attributes such as `contenteditable` require you to pass `"true"` or `"false"` as strings. These are not really _boolean_ attributes even though they look similar. They’re technically _“enumerated”_ attributes.

According to [the MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable), `contenteditable` accepts `"true"`, `"false"` or `"plaintext-only"`. The presence of this third option explains why `contenteditable` is not a boolean attribute. It also means new modes could be added in the future without breaking existing code.
:::

### Nil

Attributes with a `nil` value are not rendered, just like `false`. This makes conditional attributes easy to write.

```ruby
a(href: "/", aria_current: ("page" if current_page?)) { "Home" }
```

### Arrays and Sets

Arrays and Sets are treated as lists of tokens and joined with a space (` `). Each token can be a String, Symbol, Integer, Float or [safe value](/sgml/raw#safe). Symbols have underscores replaced with dashes, `nil` is skipped and nested Arrays and Sets are flattened.

::: code-group

```ruby [Phlex]
a(
  class: [
    "button",
    ("active" if is_active),
    ("disabled" if is_disabled)
  ]
) { "Click me" }
```

```html [HTML]
<a class="button active">Click me</a>
```

:::

If the list is empty, or contains nothing but `nil`, the attribute is not rendered.

::: warning
Only `nil` is skipped. Any other kind of token, including `false`, raises an error.

```ruby
a(class: ["button", is_active && "active"])
# Phlex::ArgumentError: Invalid token type: FalseClass.
```

Use a trailing `if` or a ternary that returns `nil`, rather than `&&`.
:::

### Hashes

You can nest attributes by using a `Hash` as the value. The hash will be flattened with a dash (`-`) between each level:

::: code-group

```ruby [Phlex]
h1(data: { controller: "hello" }) { "Hello!" }
```

```html [HTML]
<h1 data-controller="hello">Hello!</h1>
```

:::

Hashes can be nested as deep as you like, and the keys follow the same rules as top-level keys. The values can be Strings, Symbols, Integers, Floats, `true`, `false`, `nil`, Arrays, Sets, safe values or more Hashes.

::: code-group

```ruby [Phlex]
div(
  data: {
    controller: "menu",
    menu: {
      open_value: true,
      items: ["home", "about"]
    }
  }
)
```

```html [HTML]
<div data-controller="menu" data-menu-open-value data-menu-items="home about"></div>
```

:::

::: tip
A nested `true` renders the attribute without a value. If you’re setting a value that JavaScript will read as a string, such as a Stimulus value, pass `"true"` instead.
:::

#### The root key <Badge type="info" text="2.2.1+" />

Sometimes you need an attribute and other attributes that are prefixed with its name. Use the special key `_:` to set a value for the parent key itself.

::: code-group

```ruby [Phlex]
div(popover: { _: "manual", target: "menu" })
```

```html [HTML]
<div popover="manual" popover-target="menu"></div>
```

:::

This is what [`mix`](/sgml/helpers#mix) produces when you mix a plain value with a Hash.

### Dates and Times <Badge type="info" text="2.3+" />

`Date`, `DateTime` and `Time` objects are formatted as ISO 8601.

::: code-group

```ruby [Phlex]
time(datetime: Date.new(2025, 1, 2))
time(datetime: Time.new(2025, 1, 2, 3, 4, 5, "+01:00"))
```

```html [HTML]
<time datetime="2025-01-02"></time>
<time datetime="2025-01-02T03:04:05+01:00"></time>
```

:::

This only applies to top-level attributes. Inside a nested Hash, convert the date to a String yourself.

### Objects that respond to `to_h` <Badge type="info" text="2.4+" />

Any other object that responds to `to_h` is converted to a Hash and treated as [nested attributes](#hashes). That means you can pass a `Struct`, a `Data` object or your own attributes object. This applies to top-level attributes only. That includes `style`, where the object becomes nested attributes like `style-color`. Only a real Hash is [converted to CSS](#the-style-attribute).

::: code-group

```ruby [Phlex]
Stimulus = Data.define(:controller, :action)

div(data: Stimulus.new(controller: "menu", action: "click->menu#toggle"))
```

```html [HTML]
<div data-controller="menu" data-action="click-&gt;menu#toggle"></div>
```

:::

The `>` in the action is [escaped](#strings) as `&gt;`. The browser decodes it, so Stimulus still reads `click->menu#toggle`.

## Special cases

### The `style` attribute

The `style` attribute has special behaviour. If you pass a `Hash` as `style:`, Phlex will convert it to a CSS string rather than flattening it. Symbol keys and values have underscores replaced with dashes, and properties with a `nil` value are skipped.

::: code-group

```ruby [Phlex]
h1(style: { color: "red", font_size: "16px" }) { "Hello!" }
h1(style: { color: :dark_red, z_index: 2, margin: nil, "--gap" => "1rem" }) { "Hello!" }
```

```html [HTML]
<h1 style="color: red; font-size: 16px;">Hello!</h1>
<h1 style="color: dark-red; z-index: 2; --gap: 1rem;">Hello!</h1>
```

:::

You can also pass an Array or Set of Strings and Hashes. Each one is terminated with a semicolon if it doesn’t already have one, and `nil` is skipped, so you can add styles conditionally.

::: code-group

```ruby [Phlex]
h1(
  style: [
    "color: red",
    ("font-weight: bold;" if is_important),
    { margin: 0 }
  ]
) { "Hello!" }
```

```html [HTML]
<h1 style="color: red; font-weight: bold; margin: 0;">Hello!</h1>
```

:::

Style values must be Strings, Symbols, Integers, Floats, safe values or `nil`. Anything else raises `Phlex::ArgumentError: Invalid style value`.

### Comma-separated lists <Badge type="info" text="2.3+" />

A handful of attributes are lists separated by commas rather than spaces. When you pass an Array to one of these, Phlex joins the tokens with a comma and a space, and escapes any commas inside a token as `%2C`.

| Element | Attribute     | Condition                         |
| ------- | ------------- | --------------------------------- |
| `img`   | `srcset`      |                                   |
| `link`  | `media`       |                                   |
| `link`  | `sizes`       |                                   |
| `link`  | `imagesrcset` | Only with `rel: "preload", as: "image"` |
| `input` | `accept`      | Only with `type: "file"`          |

::: code-group

```ruby [Phlex]
img(src: "cat.png", srcset: ["cat.png 1x", "cat@2x.png 2x"])
input(type: "file", accept: ["image/png", ".jpg"])
```

```html [HTML]
<img src="cat.png" srcset="cat.png 1x, cat@2x.png 2x">
<input type="file" accept="image/png, .jpg">
```

:::

This only happens when you call the element method with an Array value and a Symbol key. Everywhere else, including elements rendered with [`tag`](/sgml/helpers#tag), Arrays are joined with spaces as usual.

## Safety

Phlex blocks a few kinds of attribute that are common vectors for cross-site-scripting (XSS) attacks. The [structural safety](/miscellaneous/structural-safety) page explains the reasoning. Here’s how it affects the attributes you write.

### `javascript:` links

For attributes that reference a URL, Phlex checks whether the value uses the `javascript:` protocol. If it does, the attribute is silently left out. The rest of the element is rendered as normal.

::: code-group

```ruby [Phlex]
a(href: "javascript:alert(1)") { "Click me" }
```

```html [HTML]
<a>Click me</a>
```

:::

This applies to `href`, `src`, `action`, `formaction`, `lowsrc`, `dynsrc`, `background`, `ping` and `data` on any element. The check ignores case and whitespace, and decodes HTML character references such as `&colon;` first.

A namespace prefix doesn’t change this. `xlink:href`, or `href` with any other prefix, is checked in the same way.

It also applies to `to`, `from`, `by` and `values`. SVG animation elements such as `set` and `animate` write these to the attribute named by `attributeName`, which can be `href`. `values` is a list separated by semicolons, so it’s left out if any entry is a `javascript:` URL.

::: code-group

```ruby [Phlex]
set(attributeName: "href", to: "javascript:alert(1)")
```

```html [HTML]
<set attributeName="href"></set>
```

:::

These attributes can’t take a Hash. Passing one raises `Phlex::ArgumentError: Invalid attribute value for href: …`. The exception is `data`, where a Hash still renders [nested `data-*` attributes](#hashes).

If you need a `javascript:` link, you can mark the value as [safe](/sgml/raw#safe) to bypass this security feature. You are responsible for the safety of strings you declare to be safe.

::: code-group

```ruby [Phlex]
a(href: safe("javascript:alert(1)")) { "Click me" }
```

```html [HTML]
<a href="javascript:alert(1)">Click me</a>
```

:::

### Event attributes

Event attributes such as `onclick` are disallowed to prevent cross-site-scripting (XSS) attacks. This covers any attribute name that starts with `on` and doesn’t contain a dash.

```ruby
button(onclick: "alert(1)")
# Phlex::ArgumentError: Unsafe attribute name detected: onclick.
```

If you need to set event attributes, you can mark the value as safe to bypass this security feature. You are responsible for the safety of strings you declare to be safe.

::: code-group

```ruby [Phlex]
button(onclick: safe("alert(1)")) { "Click me" }
```

```html [HTML]
<button onclick="alert(1)">Click me</button>
```

:::

### `srcdoc`, `sandbox` and `http-equiv`

These three attributes raise the same `Unsafe attribute name detected` error unless the value is marked as safe.

::: code-group

```ruby [Phlex]
meta(http_equiv: safe("refresh"), content: "30")
```

```html [HTML]
<meta http-equiv="refresh" content="30">
```

:::

You can’t get around this by spelling the name with a nested Hash.

```ruby
meta(http: { equiv: "refresh" })
# Phlex::ArgumentError: Unsafe attribute name detected: http-equiv.
```

### Nested names with a namespace prefix

The values in a [nested Hash](#hashes) aren’t checked for `javascript:` URLs, so a nested key can’t be a URL attribute with a namespace prefix, such as `xlink:href`. Pass it as a top-level attribute instead.

```ruby
div(x: { "xlink:href" => "/about" })
# Phlex::ArgumentError: Unsafe attribute name detected: x-xlink:href.
```

### Only `safe` skips these checks

The checks in this section are only skipped for a value returned by Phlex’s own [`safe`](/sgml/raw#safe) method. Other [safe objects](/sgml/raw#safe-objects), including Strings that Rails has marked as `html_safe`, are safe to output as HTML, but that doesn’t make them safe to run as a script. They’re checked like regular Strings.

Marking a value as safe doesn’t stop it being [escaped](#strings), either. `"`, `<` and `>` are escaped in every attribute value.

## Error reference

All of these are `Phlex::ArgumentError`s. See [errors](/miscellaneous/errors) for more about Phlex’s error classes.

| Message                                                      | Cause                                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `Attribute keys should be Strings or Symbols.`               | A key that isn’t a String or Symbol                                      |
| `Unsafe attribute name detected: …`                          | An unsafe character in a key, an [unsafe attribute](#safety) without a value from `safe`, or a nested key that spells one |
| `:id attribute should only be passed as a lowercase symbol.` | `id` passed as a String, or in another case                              |
| `Invalid attribute value for …`                              | A value Phlex doesn’t know how to render, such as an arbitrary object, or a Hash passed to a [URL attribute](#javascript-links) |
| `Invalid token type: …`                                      | Something other than a String, Symbol, number, safe value or `nil` in an Array or Set |
| `Invalid style value: …` / `Invalid style: …`                | An unsupported value in a `style` Hash or Array                          |
| `Style keys should be Strings or Symbols.`                   | A `style` Hash key that isn’t a String or Symbol                         |
