---
title: Phlex component helpers
---

# Helpers

Phlex components come with a few helper methods for combining attributes, rendering elements dynamically and capturing output. They’re available in both `Phlex::HTML` and `Phlex::SVG` components.

| Helper                        | What it does                                              |
| ----------------------------- | --------------------------------------------------------- |
| [`mix`](#mix)                 | Merges attribute hashes, combining values such as classes |
| [`grab`](#grab)               | Reads keyword arguments that are named after Ruby keywords |
| [`tag`](#tag)                 | Renders an element whose name is decided at runtime       |
| [`capture`](#capture)         | Returns the output of a block as a String                 |
| [`json_escape`](#json-escape) | Escapes JSON for embedding in a `<script>` tag            |

## `mix`

It’s not uncommon that when building an abstract component like a Button or Card, that you will want to expose some level of control over the resulting HTML to the caller of your component. Possibly for the purpose of adding an ID, or some additional classes. Or maybe to attach behavior using a JS library like Stimulus or Alpine.js. All of this requires being able to modify the attributes being applied to the HTML _inside_ the component, from the _outside_.

We could do this by exposing every possible attribute that we want to allow being modified, and handling it manually.

```ruby
class Card < Phlex::HTML
  def initialize(id: nil, data: {})
    @id = id
    @data = data
  end

  def view_template
    div(id: @id, data: @data) do
      # ...
    end
  end
end
```

But you can imagine how this can get out of hand quickly. This method does provide the most control of _what_ is allowed to be configured, and exactly _how_ that configuration gets applied. But many times it’s easiest to be hands-off and allow access to the attributes from the caller, and the `mix` helper can help you do that.

```ruby
class Card < Phlex::HTML
  def initialize(**attributes)
    @attributes = attributes
  end

  def view_template
    div(**mix({ class: "card" }, @attributes)) do
      # ...
    end
  end
end
```

Now we can add any arbitrary attribute to the rendered Card.

```ruby
render Card.new(id: "my-card")
render Card.new(data: { controller: "fancy-card" })
render Card.new(class: "purple-card")
```

```html
<div class="card" id="my-card"></div>
<div class="card" data-controller="fancy-card"></div>
<div class="card purple-card"></div>
```

`mix` takes any number of hashes and returns a new Hash. It merges them together, but instead of replacing old values with new values, it will treat them like token lists, and combine them. So it works great for combining class lists, or Stimulus controllers.

The hashes are merged in the order they are provided. When two values can’t be combined, the last one wins.

### How values are combined

| Old value    | New value    | Result                                 |
| ------------ | ------------ | -------------------------------------- |
| String       | String       | A String, joined with a space          |
| String       | Array or Set | An Array                               |
| Array or Set | String       | An Array                               |
| Array        | Array        | An Array                               |
| Set          | Set          | A Set                                  |
| Array        | Set          | An Array (and the other way around)    |
| Hash         | Hash         | A Hash, mixed recursively              |
| Anything else | Hash        | The Hash, with the old value under `_:` |
| Hash         | Anything else | The Hash, with the new value under `_:` |
| Anything else | `nil`       | The old value                          |
| Anything else | Anything else | The new value                         |

```ruby
mix({ class: "card" }, { class: "purple", id: "x" })
# => { class: "card purple", id: "x" }

mix({ class: ["a", "b", "c"] }, { class: "my-class" })
# => { class: ["a", "b", "c", "my-class"] }

mix({ data: { controller: "card" } }, { data: { controller: "tilt", action: "click->tilt#go" } })
# => { data: { controller: "card tilt", action: "click->tilt#go" } }
```

Only Strings, Arrays, Sets and Hashes are combined. Symbols and other values are not treated as tokens, so the new value replaces the old one.

```ruby
mix({ class: :card }, { class: :purple })
# => { class: :purple }
```

When one value is a Hash and the other isn’t, the non-Hash value is kept under the `_:` key. Phlex renders this [root key](/sgml/attributes#the-root-key) as the attribute itself.

```ruby
mix({ data: "a" }, { data: { b: "c" } })
# => { data: { _: "a", b: "c" } }
```

```html
<div data="a" data-b="c"></div>
```

### Overriding values

`mix` also supports completely overriding a previous value, by appending a bang (`!`) to a Symbol key.

```ruby
mix({ class: "default classes" }, { class!: "only-use-this-class" })
# => { class: "only-use-this-class" }
```

::: details `mix` source code

```ruby
private def mix(*args)
  args.each_with_object({}) do |object, result|
    result.merge!(object) do |_key, old, new|
      case [old, new].freeze
      in [Array, Array] | [Set, Set]
        old + new
      in [Array, Set]
        old + new.to_a
      in [Array, String]
        old + [new]
      in [Hash, Hash]
        mix(old, new)
      in [Set, Array]
        old.to_a + new
      in [Set, String]
        old.to_a + [new]
      in [String, Array]
        [old] + new
      in [String, Set]
        [old] + new.to_a
      in [String, String]
        "#{old} #{new}"
      in [_, Hash]
        { _: old, **new }
      in [Hash, _]
        { **old, _: new }
      in [_, nil]
        old
      else
        new
      end
    end

    result.transform_keys! do |key|
      key.end_with?("!") ? key.name.chop.to_sym : key
    end
  end
end
```

:::

## `grab`

Sometimes when you’re designing a component’s API, you want a keyword argument whose name _is_ a keyword. This presents a problem when you’re trying to access that keyword argument.

```ruby
def initialize(class:)
  @class = class # 💥
end
```

Sure, you could work around this by slurping the offending keyword arguments into a hash, or by using `binding.local_variable_get`, or by :scream: picking a different name. Or you could `grab` it.

`grab` is a helper that will return the value of the lone supplied keyword argument.

```ruby
def initialize(class:)
  @class = grab(class:) # ✅
end
```

It can also return multiple values if you’re in the predicament of needing multiple things named after reserved words.

```ruby
def initialize(class:, if:)
  @class, @if = grab(class:, if:)
end
```

::: details `grab` source code

```ruby
private def grab(**bindings)
  if bindings.size > 1
    bindings.values
  else
    bindings.values.first
  end
end
```

:::

::: tip

You’ll probably never need to use `grab` if you use [Literal Properties](/miscellaneous/literal-properties) to generate your initializers, since it automatically escapes reserved keywords by default.

```ruby
prop :class, String
prop :if, Proc
```

:::

## `tag`

`tag` renders an element by name. Use it when the element isn’t known until runtime, such as a heading whose level is passed in. It takes the name as a Symbol, followed by the same [attributes](/sgml/attributes) and block as an element method.

```ruby
class Heading < Phlex::HTML
  def initialize(level:)
    @level = level
  end

  def view_template(&)
    tag(:"h#{@level}", class: "heading", &)
  end
end

Heading.new(level: 2).call { "Hello" }
```

```html
<h2 class="heading">Hello</h2>
```

The name can be almost any [HTML element](/sgml/html-elements#element-reference), or [SVG element](/sgml/svg-elements#element-reference) in a `Phlex::SVG` component. The [exceptions](#elements-tag-won-t-render) are `script`, `style` and `base`. Void elements are rendered without a closing tag.

```ruby
tag(:br)
```

```html
<br>
```

### Custom elements

`tag` also accepts any custom element name. Underscores are replaced with dashes, and the result must contain at least one dash and consist only of lowercase letters, numbers and dashes.

```ruby
tag(:trix_editor, input: "content")
```

```html
<trix-editor input="content"></trix-editor>
```

This works without calling [`register_element`](/sgml/html-elements#custom-elements). In fact, `tag` doesn’t look at the elements you’ve registered, so if you registered an element with a custom `tag:`, call its method instead.

### Elements `tag` won’t render

The name you give `tag` might come from a user, so it refuses to render elements whose content or attributes run as code, or change where code is loaded from. In `Phlex::HTML`, those are `script`, `style` and `base`. In `Phlex::SVG`, they’re `script` and `style`.

```ruby
tag(:script) { "alert(1)" }
# Phlex::ArgumentError: `tag` can't render <script>. Call `script` directly instead.
```

When you mean to render one of these, call its element method.

### Errors

`tag` raises a `Phlex::ArgumentError` when it’s given something it can’t render.

| Call                 | Message                                    |
| -------------------- | ------------------------------------------ |
| `tag("h1")`          | `Expected the tag name to be a Symbol.`    |
| `tag(:nope)`         | `Invalid HTML tag: nope`                   |
| `tag(:div)` in SVG   | `Invalid SVG tag: div`                     |
| `tag(:br) { "Hi" }`  | `Void elements cannot have content blocks.` |
| `tag(:script)`       | `` `tag` can't render <script>. Call `script` directly instead. `` |

::: warning Rails
In Rails, including `Phlex::Rails::Helpers::Tag` replaces this method with an adapter for the Rails `tag` helper.
:::

## `capture`

`capture` calls a block and returns what it rendered as a String, instead of adding it to the output.

```ruby
class Tooltip < Phlex::HTML
  def view_template
    content = capture { strong { "Hello" } }

    span(title: content) { "Hover me" }
  end
end
```

```html
<span title="&lt;strong&gt;Hello&lt;/strong&gt;">Hover me</span>
```

The captured HTML is [escaped as an attribute value](/sgml/attributes#strings) here, and the browser reads it back as `<strong>Hello</strong>`.

If the block doesn’t render anything, its return value is used as text, the same as with an [element](/sgml/text#implicit-text-output-from-blocks). Without a block, `capture` returns an empty String.

Any arguments you pass to `capture` are yielded to the block. With no arguments, the block is yielded the component.

The result is a regular String, not a safe value. If you output it again with `plain` or return it from a block, it will be escaped. To output it as HTML, you need to [mark it as safe](/sgml/raw).

```ruby
content = capture { strong { "Hello" } }

div { content }
div { raw safe(content) }
```

```html
<div>&lt;strong&gt;Hello&lt;/strong&gt;</div>
<div><strong>Hello</strong></div>
```

::: warning Rails
When Rails is rendering the component, `capture` returns an `ActiveSupport::SafeBuffer` instead. `plain` still escapes it, but returned from a block, it’s output as HTML.
:::

::: tip
If you want to run a block for its side effects and throw away the output, use [`vanish`](/components/yielding).
:::

## `json_escape` <Badge type="info" text="2.1+" /> <Badge type="danger" text="Rails" />

`json_escape` escapes the characters in a JSON String that could break out of a `<script>` tag: `<`, `>`, `&` and the Unicode line and paragraph separators. The result is still valid JSON.

In Phlex 2.4, this method delegates to `ERB::Util.json_escape`, which is defined by Active Support. It works in Rails apps, but in plain Ruby it raises a `NoMethodError` unless you’ve loaded `active_support/core_ext/string/output_safety`.

Given a regular String, it returns a regular String, so you need to mark the result as [safe](/sgml/raw) to stop Phlex from escaping it again.

```ruby
script(type: "application/json") do
  raw safe(json_escape(@data.to_json))
end
```

With `@data = { name: "</script>&" }`, that outputs:

```html
<script type="application/json">{"name":"\u003c/script\u003e\u0026"}</script>
```

## More component methods

These are documented on their own pages.

- [`plain`](/sgml/text), [`whitespace`](/sgml/whitespace), [`comment`](/sgml/comments), [`raw` and `safe`](/sgml/raw) and [`doctype`](/sgml/doctype) output things that aren’t elements.
- [`render`](/components/rendering) renders other components.
- [`context`](/components/context) shares data with every component in a render.
- [`before_template`, `around_template` and `after_template`](/components/callbacks) hook into rendering.
- [`fragment`](/components/fragments) and [`cache`](/components/caching) mark out parts of a template.
- [`flush`](/components/streaming) sends what’s been rendered so far when streaming.
