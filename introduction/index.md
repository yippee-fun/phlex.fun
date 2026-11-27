---
prev: false
title: What is Phlex?
---

# What is Phlex?

Phlex is a Ruby gem for building views in plain Ruby. You write a class called a component, and inside it each HTML element is a method call.

Here’s a component. Phlex calls its `view_template` method to produce the HTML.

```ruby
class Nav < Phlex::HTML
  def initialize(links:)
    @links = links
  end

  def view_template
    nav(class: "main-nav") do
      ul do
        @links.each do |label, url|
          li { a(href: url) { label } }
        end
      end
    end
  end
end
```

Create an instance with the data it needs, and `call` returns the HTML as a string.

```ruby
Nav.new(links: { "Home" => "/", "About" => "/about" }).call
```

```html
<nav class="main-nav">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>
```

Elements are methods, attributes are keyword arguments and content goes in a block. If you know Ruby and you know HTML, you already know most of Phlex.

::: tip Want to see it run?
[Try Phlex in one minute](/introduction/getting-started#try-it-in-one-minute) with a single Ruby file. No app required.
:::

## Why you might like it

**It’s one language.** There’s no switching between HTML and `<% %>` tags. Conditionals, loops and variables are ordinary Ruby, so your editor, RuboCop, Ruby LSP and SimpleCov all understand your views.

**Views are objects.** A component is a class with an initializer, so it says exactly what data it needs. You can extract private methods, inherit from a base class, include modules and write unit tests, the same way you would for any other Ruby object.

**Small pieces compose.** Components render other components and take blocks of content. A design system of buttons, cards and form fields is a folder of small classes.

**It’s safe by default.** Text and attribute values are escaped. You can’t forget to close a tag, and you have to go out of your way to output unescaped HTML. See [Structural safety](/miscellaneous/structural-safety).

**It’s fast.** Rendering a component costs very little, so you’re not trading performance for tidiness when you extract one.

**You can adopt it gradually.** In Rails, Phlex components render from ERB and ERB partials render from Phlex. Start with one component in an existing view and [go from there](/rails/adopting-phlex).

## What it’s for

Phlex supports **HTML**, **SVG** and [**CSV**](/csv/). Most of this guide is about HTML.

You’d typically have components for the big pieces of a page, such as a _layout_, _header_ and _footer_, as well as small reusable parts like _buttons_, _tables_ and _form inputs_. In a Rails app, whole pages can be Phlex [views](/rails/views) too.

Phlex is a standalone library. It works well with Rails through the `phlex-rails` gem, and it works without a framework.

## Why build HTML in Ruby?

When your browser parses an HTML file, it builds up a tree of elements, attributes, comments and text nodes. The text file is one way of serializing that tree so it can be stored and sent over the network. As long as there’s a reliable path to the browser, it doesn’t matter how the tree is written down in your source code.

To include dynamic data, you need some kind of templating. There are two main approaches.

With **string-based templating**, such as ERB, you concatenate strings and hope the result parses as valid HTML. This means switching between modes: one where everything is output, one where you’re running Ruby, and one where you’re running Ruby and outputting the result.

With **structural templating**, you build the tree directly in the host language. Ruby is a great fit for this because of blocks and the implicit `self` receiver.

Phlex takes the structural approach. Because you’re describing a tree instead of gluing strings together, it’s much easier to produce valid, safe HTML. The source isn’t HTML syntax, but it has the same semantics, and there’s no mode-switching.

## Next steps

- [Getting started](/introduction/getting-started) gets Phlex installed.
- [Build your first page](/introduction/tutorial) walks through a view and a component, step by step.
- [Coming from ERB](/introduction/from-erb) shows how the things you already write in ERB look in Phlex.
