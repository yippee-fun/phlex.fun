---
title: Getting started with Phlex
---

# Getting started

You can try Phlex right now with a single file, or install it in your app. We’ll do both.

## Try it in one minute

Save this as `hello.rb`. You don’t need a Rails app or a `Gemfile`, only Ruby 3.2 or later.

```ruby
require "bundler/inline"

gemfile do
  source "https://rubygems.org"
  gem "phlex"
end

class Hello < Phlex::HTML
  def initialize(name:)
    @name = name
  end

  def view_template
    h1 { "Hello, #{@name}!" }

    ul do
      3.times do |n|
        li { "Item #{n + 1}" }
      end
    end
  end
end

puts Hello.new(name: "World").call
```

Run it:

```bash
ruby hello.rb
```

```html
<h1>Hello, World!</h1>
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
```

::: tip
Phlex doesn’t add whitespace between elements, so the real output is all on one line. Throughout these docs, we’ve formatted the HTML to make it easier to read.
:::

That’s a complete Phlex component. Change the template and run it again to get a feel for it. When you’re ready to use Phlex in an app, read on.

## Which gem do I need?

| You’re using                             | Install                                              |
| ---------------------------------------- | ---------------------------------------------------- |
| [Ruby on Rails](https://rubyonrails.org) | [`phlex-rails`](#installing-phlex-in-a-rails-app)    |
| [Hanami](https://hanakai.org/hanami)     | [`phlex-hanami`](#installing-phlex-in-a-hanami-app)  |
| Sinatra, Roda, Rack or plain Ruby        | [`phlex`](#installing-phlex-anywhere-else)           |

## Installing Phlex in a Rails app

In a Rails app, you’ll want the `phlex-rails` gem. It depends on `phlex`, so you don’t need to add that separately.

```bash
bundle add phlex-rails
```

Once that’s finished, run the install generator:

```bash
bundle exec rails generate phlex:install
```

The generator creates two modules: `Views`, for classes in `app/views`, and `Components`, for classes in `app/components`. So `app/components/card.rb` defines `Components::Card`. It also creates a base class for each. [Installation & generators](/rails/generators) describes everything it does.

That’s it. You’re ready to [build your first page](/introduction/tutorial).

<a id="already-using-viewcomponent"></a>

::: details Already using ViewComponent?
Loading `app/components` as the `Components` module may cause issues if you already have ViewComponent components in that folder.

There are a couple of ways you can fix this:

1. you could move your ViewComponent components into the `Components` module by renaming them. For example, `CardComponent` would become `Components::CardComponent`;
2. alternatively, you could move your ViewComponent components to a different directory, such as `app/view_components`, and autoload that directory at the top level.

We recommend keeping Phlex components in the `Components` module under `app/components`, because that’s what makes the shorter [Kit](/components/kits) syntax work.
:::

## Installing Phlex in a Hanami app

In a [Hanami](https://hanakai.org/hanami) app, you’ll want the `phlex-hanami` gem. It depends on `phlex`, so you don’t need to add that separately.

```bash
bundle add phlex-hanami
```

For more on how to use `phlex-hanami`, check out its [usage docs](https://github.com/aaronmallen/phlex-hanami/tree/main/docs/usage).

## Installing Phlex anywhere else

Phlex works with [Sinatra](https://sinatrarb.com), [Roda](http://roda.jeremyevans.net), plain Rack, or a script with no framework at all. Add the gem:

```bash
bundle add phlex
```

Then require it:

```ruby
require "date"
require "phlex"
```

::: info
Phlex 2.4 expects Ruby’s `date` library to be loaded when you pass a Hash or an Array as an attribute value. Rails loads it for you. Anywhere else, require it yourself.
:::

Without a framework integration, you kick off rendering yourself by calling [`call`](/components/rendering#rendering-to-a-string) on a component and sending the resulting string wherever it needs to go.

## Your first component

A component is a Ruby class that inherits from `Phlex::HTML` and defines a `view_template` method. Inside `view_template`, every HTML element is a method. Attributes are keyword arguments and content goes in a block.

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

The component takes its data through `initialize`, like any other Ruby object. To render it to a string, create an instance and call `call`.

```ruby
Greeting.new(name: "World").call
```

```html
<h1 class="greeting">Hello, World!</h1>
```

In Rails, you’d pass the instance to `render` in a controller or another view instead.

### It’s safe by default

Text is escaped unless you explicitly mark it as safe, so user input can’t inject HTML.

```ruby
Greeting.new(name: "<script>").call
```

```html
<h1 class="greeting">Hello, &lt;script&gt;!</h1>
```

[Structural safety](/miscellaneous/structural-safety) explains how far this goes.

### Components render other components

Here’s a `Card` component that wraps whatever content it’s given, and a `Page` that renders a `Greeting` inside a `Card`.

```ruby
class Card < Phlex::HTML
  def view_template
    article(class: "card") { yield }
  end
end

class Page < Phlex::HTML
  def view_template
    render Card do
      render Greeting.new(name: "World")
    end
  end
end

Page.new.call
```

```html
<article class="card">
  <h1 class="greeting">Hello, World!</h1>
</article>
```

The `yield` in `Card` is where the block passed to `render Card` gets rendered.

That’s most of what there is to know. Everything else builds on classes, methods and blocks.

## Where to go next

- [Build your first page](/introduction/tutorial) is a step-by-step tutorial.
- [Coming from ERB](/introduction/from-erb) translates the ERB you already write.
- [Rendering](/components/rendering) covers all the ways to render components, from controllers, from other components and from ERB.
- [Yielding](/components/yielding) shows how to build components that take content, including components with multiple slots.
- [HTML elements](/sgml/html-elements) and [Attributes](/sgml/attributes) cover the details of writing HTML in Ruby.
- [Kits](/components/kits) give you a shorter syntax for rendering components.
- Using Rails? Read about [views](/rails/views), [layouts](/rails/layouts), [helpers](/rails/helpers) and [forms](/rails/forms).
