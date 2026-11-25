---
title: Context in Phlex components
---

# Context

Context is an object shared by every component in a single render. Use it for ambient state that many components need but that would be tedious to pass through every layer as a property, such as the current user or a theme.

## Passing context in

Pass a `context:` to `call` when you render the outermost component. Every component rendered inside it can read it with the `context` method.

```ruby
class UserBadge < Phlex::HTML
  def view_template
    span(class: "badge") { context[:current_user] }
  end
end

class Toolbar < Phlex::HTML
  def view_template
    nav { render UserBadge }
  end
end

class Page < Phlex::HTML
  def view_template
    header { render Toolbar }
  end
end

Page.new.call(context: { current_user: "Ada" })
```

```html
<header>
  <nav><span class="badge">Ada</span></nav>
</header>
```

Neither `Page` nor `Toolbar` knows anything about the current user. `UserBadge` reads it straight from the context.

If you don’t pass one, the context is an empty Hash. A Hash is the usual choice, but Phlex doesn’t care what the object is. You can pass any object you like and `context` will return it. The exception is an app with `phlex-rails` loaded, where the context has to be a Hash.

::: tip
`context:` is an option for `call` on a component instance. The class-level shortcut `Page.call(...)` passes all of its arguments to `new`, so use `Page.new.call(context: ...)`.
:::

## Sharing state between components

The context is the same object for the whole render, so a component can write to it and components rendered later will see the change.

Here, a `Section` bumps the heading level while its content is rendered, and `Heading` picks the right element for wherever it happens to be.

```ruby
class Section < Phlex::HTML
  def view_template
    context[:heading_level] += 1
    section { yield }
    context[:heading_level] -= 1
  end
end

class Heading < Phlex::HTML
  def view_template(&)
    tag(:"h#{context[:heading_level]}", &)
  end
end

class Article < Phlex::HTML
  def view_template
    context[:heading_level] = 1

    render(Heading) { "Title" }

    render Section do
      render(Heading) { "Subtitle" }

      render Section do
        render(Heading) { "Detail" }
      end
    end
  end
end

Article.call
```

```html
<h1>Title</h1>
<section>
  <h2>Subtitle</h2>
  <section>
    <h3>Detail</h3>
  </section>
</section>
```

Components render in order, so a component only sees what was written before it rendered.

## Context isn’t available before rendering

The context belongs to a render, not to a component. Calling `context` before the component has started rendering — in `initialize`, for example — raises an error. Once rendering has started, `context` keeps working, even after the render has finished.

```ruby
Page.new.context
# Phlex::ArgumentError: You can’t access the context before the component has started rendering.
```

Read the context from `view_template`, from a method it calls, or from a [callback](/components/callbacks).

## Context in Rails <Badge type="danger" text="Rails" />

When Rails renders a component, phlex-rails creates the context for you. It’s a Hash, and phlex-rails stores the Rails view context in it under the `:rails_view_context` and `:capture_context` keys. Leave those two alone.

You can’t pass your own context through Rails’ `render`, but you can still write your own keys to the Hash — in a view or a [layout](/rails/layouts), for example — and read them from the components rendered inside it.

```ruby
class Views::Base < Components::Base
  def before_template
    context[:theme] = :dark
    super
  end
end
```

## Context or properties?

Reach for properties first. A property is visible in the component’s `initialize`, it’s easy to test, and anyone reading `render Avatar.new(user: @user)` can see exactly what the component depends on.

Context is a hidden dependency. A component that reads `context[:current_user]` only works when something further up has put it there, and nothing tells you so until it renders `nil`. Hash context won’t raise when a key is missing, so use `context.fetch(:current_user)` if you’d rather it did.

Context is a good fit when:

- the value is the same for the whole page, or for a whole subtree, such as the current user, the locale, a theme or the nesting depth;
- it would otherwise be passed through several components that don’t use it themselves;
- a parent and the components inside its content block need to coordinate, such as a form and its fields.

When you test a component that depends on context, pass the context to `call`.

```ruby
UserBadge.new.call(context: { current_user: "Ada" })
# => "<span class=\"badge\">Ada</span>"
```
