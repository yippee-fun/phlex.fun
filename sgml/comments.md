---
title: Rendering HTML comments in Phlex
---

# Comments

Phlex is just Ruby, so you can use regular Ruby comments to add context or disable part of your Phlex template. But if you want to output an HTML comment, you can use the `comment` method.

This method takes a block and wraps the output in an HTML comment.

::: code-group

```ruby [Phlex]
comment do
  h1 { "Hello" }
end
```

```html [HTML]
<!-- <h1>Hello</h1> -->
```

:::

`comment` only takes a block. To write a text comment, return a String from the block, the same way you would with [an element](/sgml/text#implicit-text-output-from-blocks).

::: code-group

```ruby [Phlex]
comment { "Rendered by Phlex" }
```

```html [HTML]
<!-- Rendered by Phlex -->
```

:::

Passing the text as an argument raises an `ArgumentError`.

Text inside a comment is escaped like any other text, so user data can’t close the comment early.

::: code-group

```ruby [Phlex]
comment { "a --> <b>" }
```

```html [HTML]
<!-- a --&gt; &lt;b&gt; -->
```

:::

The same goes for attributes. `>` is [escaped in attribute values](/sgml/attributes#strings), so an element inside a comment can’t close it early with `-->` in one of its attributes.

::: code-group

```ruby [Phlex]
comment { div(title: "-->") }
```

```html [HTML]
<!-- <div title="--&gt;"></div> -->
```

:::

Only [raw output](/sgml/raw) inside a comment is left as it is.
