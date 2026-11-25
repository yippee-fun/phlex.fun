---
title: Callbacks in Phlex components
---

# Callbacks

Callbacks are methods that Phlex calls at set points while rendering a component. You can define them to output something before or after the template, to wrap the template, or to skip rendering altogether.

There are four:

| Method | When it runs |
| --- | --- |
| `render?` | First. If it returns a falsy value, nothing else runs. |
| `before_template` | Before the template. |
| `around_template` | Around the template. The template is rendered when you call `super`. |
| `after_template` | After the template. |

They run for every component, whether it’s rendered with `call` or with `render` from another component.

## Order

Here’s a component that defines all three template callbacks.

```ruby
class Example < Phlex::HTML
  def before_template
    plain "1 "
    super
  end

  def around_template
    plain "2 "
    super
    plain "4 "
  end

  def after_template
    super
    plain "5"
  end

  def view_template
    plain "3 "
  end
end

Example.call
```

```html
1 2 3 4 5
```

`before_template` and `after_template` run outside `around_template`.

## Calling `super`

The default `before_template` and `after_template` do nothing, and the default `around_template` renders the template. You should call `super` in each of them so callbacks defined in a superclass or an included module still run.

In `around_template`, `super` is what renders the template. `yield` renders it too, but skips any `around_template` further up the ancestor chain, so prefer `super`. If you call neither, the template is not rendered.

```ruby
class Wrapped < Phlex::HTML
  def around_template
    div(class: "wrapper") { super }
  end

  def view_template
    h1 { "Hi" }
  end
end

Wrapped.call
```

```html
<div class="wrapper">
  <h1>Hi</h1>
</div>
```

Because callbacks are ordinary methods, you can stack them with modules. Each `super` calls the next one up the ancestor chain.

```ruby
module Boxed
  def around_template
    div(class: "box") { super }
  end
end

module Labelled
  def around_template
    span { "Label" }
    super
  end
end

class Field < Phlex::HTML
  include Labelled
  include Boxed

  def view_template
    input(type: "text")
  end
end

Field.call
```

```html
<div class="box"><span>Label</span><input type="text"></div>
```

`Boxed` was included last, so it’s the outermost.

## `before_template` and `after_template`

Use these to output something on either side of the template. A common use is an abstract base component that adds debugging comments in development.

```ruby
class Base < Phlex::HTML
  def before_template
    comment { "Before #{self.class.name}" }
    super
  end

  def after_template
    super
    comment { "After #{self.class.name}" }
  end
end

class Thing < Base
  def view_template
    h1 { "Thing" }
  end
end

Thing.call
```

```html
<!-- Before Thing -->
<h1>Thing</h1>
<!-- After Thing -->
```

The `Components::Base` class created by the [phlex-rails install generator](/rails/generators) defines a `before_template` like this one in development.

Both callbacks are passed the component’s content block, if it was given one. That lets you yield the content early, before the template runs. Here, `before_template` uses [`vanish`](/components/yielding#vanishing-the-yield) to yield the block and throw away its output, so the `item` calls happen before the template is rendered.

```ruby
class List < Phlex::HTML
  def initialize
    @items = []
  end

  def before_template(&)
    vanish(&)
    super
  end

  def view_template
    ul do
      @items.each { |item| li { item } }
    end
  end

  def item(text)
    @items << text
    nil
  end
end

class Page < Phlex::HTML
  def view_template
    render List do |list|
      list.item "One"
      list.item "Two"
    end
  end
end

Page.call
```

```html
<ul>
  <li>One</li>
  <li>Two</li>
</ul>
```

## `around_template`

Use `around_template` when you need to do something on both sides of the template with shared state, such as wrapping it in an element, timing it, or cleaning up afterwards.

```ruby
module Timed
  def around_template
    start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    super
  ensure
    elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - start
    warn "#{self.class.name} rendered in #{(elapsed * 1000).round(2)}ms"
  end
end
```

If the template raises, `after_template` is not called. Use `ensure` in `around_template`, as above, for anything that must always run.

## Conditional rendering

Define `render?` to let a component decide whether it should be rendered. When it returns `false` or `nil`, the component outputs nothing and none of the other callbacks run.

This moves the condition out of every place the component is used and into the component itself.

```ruby
class NotificationsBadge < Phlex::HTML
  def initialize(notifications:)
    @notifications = notifications
  end

  def render?
    @notifications.any?
  end

  def view_template
    span(class: "badge") { @notifications.size }
  end
end

NotificationsBadge.new(notifications: ["You are awesome!"]).call
# => "<span class=\"badge\">1</span>"

NotificationsBadge.new(notifications: []).call
# => ""
```

The same applies when the component is rendered from another component. The parent carries on as normal.

```ruby
class Toolbar < Phlex::HTML
  def view_template
    nav do
      render NotificationsBadge.new(notifications: [])
    end
  end
end

Toolbar.call
```

```html
<nav></nav>
```

::: warning
In Phlex 2.4, there’s one exception. After a component has been skipped, calling a [kit](/components/kits) component through its module, like `Components::Badge()`, raises ``You can't call `Badge' outside of a Phlex rendering context.`` for the rest of the parent’s template. `Badge()` and `render Components::Badge.new` still work.
:::

A content block passed to a component that doesn’t render is never called.
