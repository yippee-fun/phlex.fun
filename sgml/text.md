---
title: Rendering plain text in Phlex
---

# Text

There are two ways to output text: call the `plain` method, or return the text from an element’s block. Either way, the text is HTML-escaped.

## `plain`

You can output plain text with the `plain` method.

```ruby
plain "Hello, world!"
plain "<b> & co"
```

```html
Hello, world!&lt;b&gt; &amp; co
```

`plain` accepts Strings, Symbols, Integers and Floats. `nil` outputs nothing.

```ruby
plain "a"
plain :b
plain 1
plain 1.5
plain nil
```

```html
ab11.5
```

Anything else raises an error, unless you’ve taught Phlex how to format it with [`format_object`](#formatting-other-objects).

```ruby
plain Time.now
# Phlex::ArgumentError: You've passed an object to plain that is not handled by format_object. …
```

This includes [safe values](/sgml/raw#safe). If you want to output a safe value without escaping it, use [`raw`](/sgml/raw).

## Implicit text output from blocks

When passing a block, if the block doesn’t render any HTML elements (or otherwise modify the buffer), Phlex will output the return value of the block as plain text.

```ruby
h1 { "Hello World" }
```

```html
<h1>Hello World</h1>
```

If you wanted to wrap “Hello” in a `<strong>` tag, you would need to use `strong` and `plain` together.

```ruby
h1 do
  strong { "Hello" }
  plain " World"
end
```

```html
<h1><strong>Hello</strong> World</h1>
```

This is because `strong` outputs HTML, so the return value of the block passed to `h1` will not be rendered.

The same types are supported as with `plain`: Strings, Symbols, Integers and Floats.

```ruby
span { 42 }
span { :ok }
```

```html
<span>42</span><span>ok</span>
```

Unlike `plain`, a block that returns something else doesn’t raise an error. The return value is silently ignored, because blocks return all kinds of things that were never meant to be text.

```ruby
p { Time.now }
p { [1, 2, 3] }
p { true }
```

```html
<p></p>
<p></p>
<p></p>
```

There is one more difference: a [safe value](/sgml/raw#safe) returned from a block is output without being escaped.

## Formatting other objects

Phlex decides how to turn a non-String object into text by calling the private `format_object` method. By default, it formats Integers and Floats with `to_s` and returns `nil` for everything else.

You can override `format_object` to support other types. Return a String for the objects you want to handle and call `super` for the rest. The String you return will be escaped.

```ruby
class Components::Base < Phlex::HTML
  private def format_object(object)
    case object
    when Date then object.strftime("%-d %B %Y")
    else super
    end
  end
end

class Post < Components::Base
  def view_template
    p { Date.new(2025, 1, 2) }
    plain Date.new(2025, 1, 3)
  end
end
```

```html
<p>2 January 2025</p>3 January 2025
```

`format_object` is used by both `plain` and implicit block output. It’s not used for [attribute values](/sgml/attributes).
