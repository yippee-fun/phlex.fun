---
title: Errors in Phlex
---

# Errors

Phlex raises its own error classes when you use it in a way it can’t support. This page lists them, what causes each one, and how to rescue them.

## The error classes

Each Phlex error inherits from the matching Ruby error, so existing `rescue ArgumentError` or `rescue RuntimeError` clauses still catch them. Each one also includes the `Phlex::Error` module.

| Class | Inherits from |
| --- | --- |
| `Phlex::ArgumentError` | `ArgumentError` |
| `Phlex::DoubleRenderError` | `RuntimeError` |
| `Phlex::RuntimeError` | `RuntimeError` |
| `Phlex::NameError` | `NameError` |

## Rescuing any Phlex error

`Phlex::Error` is a module rather than a class, but you can still use it with `rescue`. It matches every error in the table above.

```ruby
begin
  Phlex.html { render 1 }
rescue Phlex::Error => error
  error.class   # => Phlex::ArgumentError
  error.message # => "You can't render a 1."
end
```

## `Phlex::ArgumentError`

This is the one you’ll see most. It means a Phlex method was given something it doesn’t accept.

| Message | Cause |
| --- | --- |
| `You can't render a 1.` | [`render`](/components/rendering#what-you-can-render) was given something it doesn’t know how to render. |
| `You can’t access the context before the component has started rendering.` | [`context`](/components/context) was called before rendering, for example in `initialize`. |
| `You've passed an object to plain that is not handled by format_object.` | [`plain`](/sgml/text) was given something other than a String, Symbol, Integer, Float or `nil`. |
| ``You passed an unsafe object to `raw`.`` | [`raw`](/sgml/raw) was given something that wasn’t marked as safe, such as a plain String. |
| `Expected a String.` | [`safe`](/sgml/raw) was given something other than a String. |
| `Attribute keys should be Strings or Symbols.`, `Unsafe attribute name detected: …`, `:id attribute should only be passed as a lowercase symbol.`, `Invalid attribute value for …`, `Invalid token type: …`, `Invalid style: …`, `Invalid style value: …`, `Style keys should be Strings or Symbols.` | An attribute key or value that Phlex won’t output. See the [attribute error reference](/sgml/attributes#error-reference). |
| `Expected the tag name to be a Symbol.`, `Invalid HTML tag: foo`, `Invalid SVG tag: foo`, `Void elements cannot have content blocks.`, `` `tag` can't render <script>. Call `script` directly instead. `` | [`tag`](/sgml/helpers#tag) was given a name it doesn’t accept, a block for a void element, or an [element it won’t render](/sgml/helpers#elements-tag-won-t-render). |
| `Expected a String or block.` | [`cdata`](/sgml/svg-elements) in a `Phlex::SVG` component was given both a String and a block, or neither. |
| `` `Phlex::Kit` was extended into Foo. `` | A class extended [`Phlex::Kit`](/components/kits#errors). Only modules can be kits. |
| `Delimiter must be a single character` | A [`Phlex::CSV`](/csv/) was given a delimiter that isn’t one character long. |

## `Phlex::DoubleRenderError`

Raised when you render the same component instance twice. A component [renders once](/components/rendering#a-component-renders-once), so create a new instance for each render.

```ruby
component = Greeting.new(name: "Ada")
component.call
component.call
# Phlex::DoubleRenderError: You can't render a Greeting more than once.
```

The same happens if you pass one instance to `render` twice from another component.

## `Phlex::RuntimeError`

Raised by [`Phlex::CSV`](/csv/) when a row’s headers don’t match the headers of the first row.

```ruby
# Phlex::RuntimeError: Header mismatch at index 0: expected a, got b.
```

## `Phlex::NameError`

Nothing in Phlex 2.4 raises `Phlex::NameError` yet.

## Errors that aren’t Phlex errors

A few failures raise Ruby’s built-in errors, so `rescue Phlex::Error` won’t catch them.

| Error | Cause |
| --- | --- |
| `NoMethodError: undefined method 'dvi'` | You called an element or helper method that doesn’t exist. Often a typo, or a custom element that hasn’t been [registered](/sgml/html-elements). |
| `ArgumentError: wrong number of arguments (given 1, expected 0)` | You passed content to an element as an argument, as in `h1 "Hello"`. Content goes in a block: `h1 { "Hello" }`. |
| `LocalJumpError: no block given (yield)` | A `view_template` called `yield`, but the component was rendered without a content block. See [Yielding](/components/yielding#optional-content). |
| `RuntimeError: Cache store not implemented.` | [`cache`](/components/caching) was called on a component that doesn’t define `cache_store`. |
| ``RuntimeError: You can't call `Card' outside of a Phlex rendering context.`` | A [kit](/components/kits#errors) method was called when no component was rendering. |
| ``RuntimeError: You need to define `escape_csv_injection?` in ...`` | A [`Phlex::CSV`](/csv/) class hasn’t decided how to handle CSV injection. |
| `ArgumentError: Invalid cache key: Object` | `Phlex::FIFOCacheStore` was given a [cache key](/components/caching) it doesn’t support. |

If a component has no `view_template` and is rendered without a content block, Phlex doesn’t raise. It renders a warning as text in the output instead.

## Errors from phlex-rails <Badge type="danger" text="Rails" />

phlex-rails adds one error class of its own. `Phlex::Rails::HelpersCalledBeforeRenderError` is raised when you use a [Rails helper](/rails/helpers) before the component has started rendering — in `initialize`, for example.

```ruby
# Phlex::Rails::HelpersCalledBeforeRenderError: You can’t use Rails view helpers until after the component has started rendering.
```

It inherits from `StandardError` and doesn’t include `Phlex::Error`.

If you call a Rails helper that you haven’t included, you get a `NoMethodError` that tells you which module to include. See [Rails helpers](/rails/helpers).
