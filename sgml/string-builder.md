---
title: Building HTML and SVG strings without a component
---

# Building HTML without a component

You don’t always need a component class. `Phlex.html` and `Phlex.svg` take a block of Phlex code and return the rendered String. They’re handy for one-off snippets, scripts, tests and anywhere else that defining a class would be overkill.

```ruby
Phlex.html do
  h1 { "Hello" }
  p(class: "intro") { "Welcome to the site." }
end
```

```html
<h1>Hello</h1>
<p class="intro">Welcome to the site.</p>
```

`Phlex.svg` does the same with [SVG elements](/sgml/svg-elements).

```ruby
Phlex.svg do
  svg(viewBox: "0 0 10 10") do
    circle(cx: 5, cy: 5, r: 4)
  end
end
```

```html
<svg viewBox="0 0 10 10">
  <circle cx="5" cy="5" r="4"></circle>
</svg>
```

Both methods require a block and return a regular Ruby String.

## What you can use in the block

The block is evaluated in the context of a new `Phlex::HTML` (or `Phlex::SVG`) component, so `self` is that component. Everything a component can do is available: [elements](/sgml/html-elements), [`plain`](/sgml/text), [`raw`](/sgml/raw), [helpers](/sgml/helpers) like `mix` and `tag`, and [`render`](/components/rendering) for rendering other components.

```ruby
Phlex.html do
  div(**mix({ class: "card" }, { class: "wide" })) do
    render Avatar.new(user)
  end
end
```

Because `self` changes inside the block, Phlex does a few things to keep the code around the block within reach.

```ruby
class WelcomeEmail
  def initialize(user)
    @user = user
  end

  def subject
    "Welcome!"
  end

  def body
    greeting = "Hello"

    Phlex.html do |email|
      h1 { email.subject }
      p { "#{greeting}, #{@user.name}" }
    end
  end
end

WelcomeEmail.new(user).body
```

```html
<h1>Welcome!</h1>
<p>Hello, Joel</p>
```

### Local variables

Local variables work as they do in any Ruby block. `greeting` above is a local.

### Instance variables

The instance variables of the object that called `Phlex.html` are copied to the component before the block runs, which is how `@user` works above.

They’re copies of the references, not a live link. Assigning to an instance variable inside the block doesn’t change it on the calling object, and new instance variables set in the block aren’t copied back.

### Methods

Methods are looked up on the component, not on the calling object. Calling `subject` on its own in the example above would raise a `NameError`.

Instead, the calling object is yielded to the block. In the example, we named it `email` and called `email.subject`. Since you’re calling from the outside, only public methods are available this way.

This also means element methods always win. If your object has its own method called `p` or `title`, the block calls Phlex’ element, and you get to yours through the block argument.

## When to define a component instead

The string builder creates a throwaway component every time it’s called. It has no initializer, can’t be [yielded to](/components/yielding) and can’t be rendered by other components. Once you find yourself passing data into the block from several places, or wanting to reuse it, it’s time to [write a component](/components/rendering).

::: tip Rails
The result is a regular String, not an `ActiveSupport::SafeBuffer`. If you output it in an ERB template, Rails will escape it. In Rails, you’re usually better off [rendering a component](/rails/views).
:::
