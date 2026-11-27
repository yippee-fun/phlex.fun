---
title: Raw HTML output in Phlex
---

# Raw output

For the most part, you should be able to build your views using Phlex’ element methods. But sometimes you need to output raw HTML. Maybe it’s from another Gem such as a Markdown renderer.

## `raw`

To do this, you can use the `raw` method. As an extra precaution, `raw` will only output strings that are branded as safe. In Phlex, you can brand a string as safe with the `safe` method.

```ruby
raw safe(
  Commonmarker.to_html(@markdown)
)
```

If you pass `raw` a regular String, or any other object that isn’t safe, it raises an error. This is to stop you from accidentally outputting user data without escaping it.

```ruby
raw "<b>Hello</b>"
# Phlex::ArgumentError: You passed an unsafe object to `raw`.
```

`nil` and empty Strings are allowed and output nothing, so you don’t need to guard against missing content.

## `safe`

`safe` takes a String and returns a `Phlex::SGML::SafeValue` that wraps it. It doesn’t escape, sanitize or check the String in any way. It’s a promise from you that the String is safe to output as it is.

```ruby
raw safe("<b>Hello</b>")
```

```html
<b>Hello</b>
```

`safe` only accepts Strings. Anything else raises `Phlex::ArgumentError: Expected a String.`

If you enjoy emoji, `safe` is aliased as `🦺`.

```ruby
raw 🦺("<b>Hello</b>")
```

### Where safe values are used

Safe values bypass Phlex’ safety features in three places:

1. Passed to `raw`, they’re output without escaping, as you’ve seen above.
2. Returned from an element’s block, they’re output without escaping. A regular String [would be escaped](/sgml/text#implicit-text-output-from-blocks).
3. As an attribute value, they skip the [attribute safety checks](/sgml/attributes#safety), so you can set event attributes like `onclick`, the `srcdoc`, `sandbox` and `http-equiv` attributes, and `javascript:` URLs. The value is still [escaped](/sgml/attributes#strings) like any other attribute value.

The second is the way to write inline scripts and styles. Phlex doesn’t treat `script` and `style` differently from other elements, so a regular String returned from their block is escaped.

::: code-group

```ruby [Phlex]
script { "if (a < b) { start() }" }
script { safe("if (a < b) { start() }") }
```

```html [HTML]
<script>if (a &lt; b) { start() }</script>
<script>if (a < b) { start() }</script>
```

:::

[`plain`](/sgml/text#plain) doesn’t accept a value returned by `safe`. It raises an error rather than guessing whether you wanted the value escaped.

## Safe objects

`raw` and element blocks accept any object that includes the `Phlex::SGML::SafeObject` module. These objects must respond to `to_s`, which is what gets output. `Phlex::SGML::SafeValue`, which `safe` returns, is one such object.

A safe object is safe to output as HTML. That doesn’t make it safe to run as a script, so as an attribute value, only a value returned by `safe` skips the [attribute safety checks](/sgml/attributes#safety). Any other safe object is treated like a regular String there: `onclick:` raises an error, and a `javascript:` URL is left out.

In Rails, `ActiveSupport::SafeBuffer` is a safe object too, so Strings that Rails has marked as `html_safe`, including the output of Rails helpers, can be passed straight to `raw`. It’s still a String, though, so `plain` accepts it and escapes it. Here, `sanitize` comes from the [`Phlex::Rails::Helpers::Sanitize`](/rails/helpers) adapter.

```ruby
raw sanitize(@comment.body)
```

You can include `Phlex::SGML::SafeObject` in your own classes if they produce HTML you trust.

```ruby
class Icon
  include Phlex::SGML::SafeObject

  def to_s
    %(<svg class="icon"></svg>)
  end
end
```

```ruby
raw Icon.new
```

```html
<svg class="icon"></svg>
```

## Be careful

You should avoid using `raw`. If you have to use it, you should avoid using `safe`. Most Rails gems that provide HTML will already mark it as safe if it is safe.

When you mark a string as `safe`, you are responsible for ensuring there is no unsafe HTML user content in that string. Phlex’ `raw` method completely bypasses its HTML safety features when given a safe string. See [structural safety](/miscellaneous/structural-safety) for more about what those features protect you from.
