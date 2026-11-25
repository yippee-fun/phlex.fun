---
title: Rendering Phlex Components
---

# Rendering

A Phlex component is a Ruby class that describes a piece of HTML (or SVG). This page covers how to write one, how to turn it into a string, and how to render components inside other components.

## Anatomy of a component

A component has three parts: a class, an optional initializer and a `view_template` method.

```ruby
class Greeting < Phlex::HTML
  def initialize(name:)
    @name = name
  end

  def view_template
    h1(class: "greeting") { "Hello, #{@name}!" }
  end
end
```

- The **class** inherits from `Phlex::HTML`, which gives it a method for [every HTML element](/sgml/html-elements). For SVG, inherit from `Phlex::SVG` instead.
- **`initialize`** takes the data the component needs — its properties — and stores it in instance variables. It’s a normal Ruby initializer, so you can use positional arguments, keyword arguments and defaults. If your component doesn’t need any data, you can leave it out.
- **`view_template`** describes the output. Each element method outputs a tag. Keyword arguments become [attributes](/sgml/attributes) and the block is the content. When the block returns a String, it’s output as [text](/sgml/text) and escaped.

Create an instance with `new` and render it to a String with `call`.

```ruby
Greeting.new(name: "Ada").call
```

```html
<h1 class="greeting">Hello, Ada!</h1>
```

That’s the whole model. Everything else builds on these three parts.

## Rendering to a string

`call` renders the component and returns the output. Framework integrations such as [phlex-rails](/rails/views) call it for you, but you can use it directly anywhere you need a String of HTML — in a test, a Rake task or a Rack app.

```ruby
component = Greeting.new(name: "Ada")
component.call # => "<h1 class=\"greeting\">Hello, Ada!</h1>"
```

There’s also a class-level shortcut. `Greeting.call(...)` passes its arguments to `new` and then calls `call` on the instance.

```ruby
Greeting.call(name: "Ada") # => "<h1 class=\"greeting\">Hello, Ada!</h1>"
```

`call` on an instance accepts a few options:

- a **buffer** as its first argument (see [below](#using-a-custom-buffer)),
- `context:` to share state with every component in the render — see [Context](/components/context),
- `fragments:` to render only parts of the template — see [Fragments](/components/fragments).

Because the class-level `call` passes everything to `new`, you need an instance to use these options.

### Using a custom buffer

By default, Phlex writes to a new mutable String. You can pass your own buffer as the first argument to `call`. The output is appended to it with `<<`, and `call` returns the result of that `<<`. For a String or an Array, that’s the buffer.

```ruby
buffer = []
Greeting.new(name: "Ada").call(buffer)
buffer # => ["<h1 class=\"greeting\">Hello, Ada!</h1>"]
```

The buffer can be any object that responds to `<<`, such as a String, an Array or an `Enumerator::Yielder`. This is the basis of [streaming](/components/streaming), where `flush` pushes what’s been rendered so far to the buffer before the component has finished.

### A component renders once

A component instance can only be rendered once. Rendering it a second time raises a `Phlex::DoubleRenderError`.

```ruby
component = Greeting.new(name: "Ada")
component.call
component.call
# Phlex::DoubleRenderError: You can't render a Greeting more than once.
```

Instances are cheap, so create a new one each time. This also applies when you pass an instance to `render` from another component.

If you need to know whether a component has started rendering, ask it with `rendering?`. It returns `false` before rendering and `true` from the moment rendering starts. It doesn’t go back to `false` afterwards.

```ruby
component = Greeting.new(name: "Ada")
component.rendering? # => false
component.call
component.rendering? # => true
```

## Rendering from a Rails controller <Badge type="danger" text="Rails" />

In Rails, you won’t usually call `call` yourself. Pass the component to `render` in your controller action instead.

```ruby
def index
  render Views::Articles::Index.new(
    articles: Article.all
  )
end
```

Rails passes its view context to the component, which is what makes [Rails helpers](/rails/helpers) available. See [Views](/rails/views) for more.

## Rendering from another component

Inside a component, use the `render` method to render another component.

```ruby{13,14}
class Card < Phlex::HTML
  def view_template
    article(class: "card") { yield }
  end
end

class Welcome < Phlex::HTML
  def initialize(name:)
    @name = name
  end

  def view_template
    render Card do
      render Greeting.new(name: @name)
      p { "Signed in as #{@name}." }
    end
  end
end

Welcome.call(name: "Ada")
```

```html
<article class="card">
  <h1 class="greeting">Hello, Ada!</h1>
  <p>Signed in as Ada.</p>
</article>
```

There are two things to notice here.

First, if a component doesn’t need any arguments, you can pass the class to `render` and leave out `.new`. Phlex creates the instance for you. `render Card` is the same as `render Card.new`.

Second, you can pass a block of content to a component. The block is output wherever the component calls `yield`. See [Yielding](/components/yielding) for everything you can do with content blocks.

Inside the block, `self` is still the outer component — `Welcome` in this example. That’s why `@name` is available in the block even though it was never passed to `Card`.

::: tip
If you pass a block to `new`, your `initialize` method doesn’t receive it. Phlex keeps hold of it and uses it as the content block when the component is rendered. This means `render Card.new { ... }` and `render(Card.new) { ... }` behave the same way.
:::

If your components live in a [Kit](/components/kits), you can also render them by calling a method with the component’s name, such as `Card { ... }`.

### Passing a component as a block

Components respond to `to_proc`, so you can pass an instance in place of a block with `&`. The component is rendered as the content.

```ruby
class Item < Phlex::HTML
  def view_template
    li { "Item" }
  end
end

class List < Phlex::HTML
  def view_template
    ul(&Item.new)
  end
end

List.call
```

```html
<ul>
  <li>Item</li>
</ul>
```

This works for anything that takes a content block, including other components: `render Card.new, &Item.new`.

## What you can render

`render` accepts more than components. This makes it easy to write a component that takes “something renderable” as a property and renders it without caring what it is.

```ruby
class Panel < Phlex::HTML
  def initialize(header:, body:)
    @header = header
    @body = body
  end

  def view_template
    header { render @header }
    main { render @body }
  end
end

Panel.call(header: "Tom & Jerry", body: Greeting.new(name: "Ada"))
```

```html
<header>Tom &amp; Jerry</header>
<main>
  <h1 class="greeting">Hello, Ada!</h1>
</main>
```

Here’s everything `render` accepts:

| You pass | What happens |
| --- | --- |
| A component instance (`Phlex::HTML` or `Phlex::SVG`) | The component is rendered. A block given to `render` becomes its content block. |
| A component class | A new instance is created with no arguments and rendered. |
| A `String` | Output as plain text, with HTML escaped. |
| A `Proc` or `Method` | Called, and whatever it outputs is rendered. See [below](#procs-and-methods). |
| An `Enumerable`, such as an `Array` | Each item is passed to `render` in turn. |
| `nil` | Nothing is output. If you also pass a block, the block is rendered. |
| A class that isn’t a Phlex component | Nothing is output. |
| Anything else | Raises a `Phlex::ArgumentError`. |

For example, rendering an Integer raises:

```ruby
render 1
# Phlex::ArgumentError: You can't render a 1.
```

`render` always returns `nil`.

### Procs and methods

When you render a `Proc` or a `Method`, Phlex looks at its arity:

- if it takes **no arguments**, it’s called with none;
- otherwise, it’s called with the component that’s rendering it.

Like any other content block, if it doesn’t output anything itself, its return value is output as text.

```ruby
class Menu < Phlex::HTML
  def view_template
    render method(:home_link)
    render ["Docs", -> { " | " }, ->(component) { component.em { "Blog" } }]
  end

  def home_link
    a(href: "/") { "Home" }
  end
end

Menu.call
```

```html
<a href="/">Home</a>Docs | <em>Blog</em>
```

### Rendering a block

You can call `render` with only a block. The block is treated as a content block: it’s yielded the component and, if it doesn’t output anything, its return value is output as text.

```ruby
render { strong { "Hello" } }
```

```html
<strong>Hello</strong>
```

This is mostly useful when the thing you’re rendering might be `nil` and the block is a fallback.

## Rendering Phlex components in ERB <Badge type="danger" text="Rails" />

Phlex components are Rails renderables, so you can render them from ERB — and from other templating languages such as [Slim](https://slim-template.github.io) and [Haml](https://haml.info) — with Rails’ own `render` helper. This works in views, partials and [ViewComponent](https://viewcomponent.org) components.

```erb
<%= render Components::Card.new(title: "Hello") do %>
  <p>Inside the card</p>
<% end %>
```

The markup inside the block is output where the component yields. The component writes to the same output buffer as the ERB template, so the block doesn’t need to return anything special.

Component classes are renderables too. If a component takes no arguments, you can leave out `.new`, in ERB or in a controller.

```erb
<%= render Components::Sidebar %>
```

If your component yields an interface, see [Yielding from ERB](/components/yielding#rendering-interface-yielding-components-from-erb).

### `render_in`

Rails renders a component by calling its `render_in` method with the view context. You don’t normally need to call it, but it’s there if you have a view context and want HTML.

```ruby
html = Components::Sidebar.new.render_in(view_context)
```

`render_in` returns an HTML-safe String. It also reads the `X-Fragments` request header to decide which [fragments](/components/fragments) to render.

## Rendering Rails partials in Phlex <Badge type="danger" text="Rails" />

To render a Rails partial from a component, use `render` and `partial` together. `partial` takes the partial’s name and its locals, and returns an object that `render` knows how to render.

```ruby{7-9}
class Components::Article < Components::Base
  def initialize(article:)
    @article = article
  end

  def view_template
    render partial("card", title: "Hello") do
      h1 { @article.title }
    end
  end
end
```

You need `partial` because `render` outputs a plain String as text.

## Rendering ViewComponent components in Phlex <Badge type="danger" text="Rails" />

You can render ViewComponent components in the same way you render Phlex components.

```ruby{7-9}
class Components::Article < Components::Base
  def initialize(article:)
    @article = article
  end

  def view_template
    render CardComponent.new(title: "Hello") do
      h1 { @article.title }
    end
  end
end
```

## Other renderables in Rails <Badge type="danger" text="Rails" />

With phlex-rails, `render` accepts a few more things. They’re handed to Rails’ own `render` and the result is output.

| You pass | What happens |
| --- | --- |
| An object that responds to `render_in`, such as a ViewComponent component or the result of `partial(...)` | Rails renders it. |
| An object that responds to `to_partial_path`, such as an Active Record model | Rails renders the model’s partial. |

```ruby
render @article  # renders articles/_article
render @articles # renders articles/_article once for each article
```

A collection of models, whether it’s an Array or an `ActiveRecord::Relation`, is [iterated by Phlex](#what-you-can-render), with each model rendered through its partial.

::: warning
This isn’t Rails’ collection rendering. Each partial is rendered on its own, so it doesn’t get the `article_counter` and `article_iteration` locals.
:::

If you pass a block, Phlex captures its output and gives it to Rails as the block’s content.

Anything else still raises a `Phlex::ArgumentError`.

## Deciding whether to render

A component can decide for itself whether it should be rendered by defining a `render?` method. See [Callbacks](/components/callbacks#conditional-rendering) for `render?` and for the `before_template`, `around_template` and `after_template` hooks.
