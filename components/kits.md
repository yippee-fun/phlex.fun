---
title: Component UI Kits in Phlex
---

# Kits

In the previous sections, we looked at how to [render components](/components/rendering) and [yield interfaces](/components/yielding). Kits add some Ruby magic to make this even cleaner.

A Kit is a special Ruby module that you put components in. You can create a Kit by defining a module that extends `Phlex::Kit`.

```ruby
module Components
  extend Phlex::Kit
end
```

That’s it. Now the `Components` module is a Kit. And every module defined in its namespace is also a Kit.

When you define a component in a Kit namespace, Phlex gives you a new, cleaner way to render those components.

Let’s define a card component in the `Components` kit:

```ruby
class Components::Card < Phlex::HTML
  def initialize(title)
    @title = title
  end

  def view_template
    article(class: "card") do
      h2(class: "card-title") { @title }
      yield
    end
  end
end
```

Now we have a special way to render this component from another component.

```ruby
class Example < Phlex::HTML
  def view_template
    Components::Card("Hello, World!") do
      p { "This is a card." }
    end
  end
end
```

```html
<article class="card">
  <h2 class="card-title">Hello, World!</h2>
  <p>This is a card.</p>
</article>
```

The kit detected the definition of a component and defined a special method on the kit with the same name (`Card`). Calling this method means we don’t need to use `render` or `.new`.

You can think of it like the kit has defined this:

```ruby
module Components
  def Card(...)
    render Card.new(...)
  end
end
```

Arguments go to the component’s initializer and the block becomes its content block, exactly as if you’d written `render Components::Card.new("Hello, World!") do ... end`.

## Including a kit

You can include the Kit to make all of its components available without the namespace.

```ruby
class Example < Phlex::HTML
  include Components

  def view_template
    Card("Hello, World!") do
      p { "This is a card." }
    end
  end
end
```

Components defined inside a kit don’t need the `include`. When a component is defined in a kit’s namespace, Phlex includes the kit into it, so components in the same kit can always render each other by name.

```ruby
class Components::Page < Phlex::HTML
  def view_template
    Card("Inside the kit") do
      p { "No include needed." }
    end
  end
end
```

Subclasses inherit this. In Rails, the `phlex-rails` [install generator](/rails/generators) defines a `Components` kit along with a `Components::Base` class and a `Views::Base` class that inherits from it. Because `Components::Base` is defined in the kit, every component and view that inherits from it can use `Card(...)` without including anything.

## Capital letters and parentheses

These methods always start with a capital letter so they match the constant name of the component class and to distinguish them from HTML elements. e.g. the `article` method is for the `<article>` element, but you can have an `Article` method for your `Article` component.

Ruby needs to be able to distinguish between a method call and a constant lookup. This is determined when you pass a block or arguments. To render a component without a block or other arguments, you need to use empty parentheses.

```ruby
Header()
```

Without the parentheses, Ruby looks up the `Header` constant instead of calling the method, and nothing is rendered.

## Nested kits

Modules defined inside a kit are kits too, so you can organise components into groups.

```ruby
module Components::Forms
  class Button < Phlex::HTML
    def initialize(label:)
      @label = label
    end

    def view_template
      button { @label }
    end
  end
end

class Example < Phlex::HTML
  include Components

  def view_template
    Forms::Button(label: "Save")
  end
end
```

```html
<button>Save</button>
```

A component is only given the kit it was defined in. `Components::Forms::Button` gets the methods from `Components::Forms`, but not the ones from `Components` — unless it inherits from a class that has them, such as `Components::Base`, or includes `Components` itself.

Kits work with autoloading. If your components are autoloaded by Zeitwerk, as they are in Rails, each component is loaded the first time you call its method.

## Should you use kits?

It’s up to you whether you use Kits or not. They may feel _too magical_. Capital-letter methods are rare in Ruby. I personally prefer the aesthetic, but it’s your choice.

Here’s what our `Table` component from the previous section would look like using Kits.

:::code-group

```ruby [With Kits]
Table(@people) do |t|
  t.column("Name", &:name)
  t.column("Age", &:age)
end
```

```ruby [Without Kits]
render Table.new(@people) do |t|
  t.column("Name", &:name)
  t.column("Age", &:age)
end
```

:::

## Errors

Kit methods only work while a component is rendering. If you call one from anywhere else — a controller, a test or the console — it raises.

```ruby
Components::Card("Hello")
# RuntimeError: You can't call `Card' outside of a Phlex rendering context.
```

This is also why you can’t use the simplified syntax from ERB, even if the component is in a Kit. From ERB, use `render Components::Card.new("Hello")`.

Only modules can be kits. Extending a class with `Phlex::Kit` raises.

```ruby
class Components
  extend Phlex::Kit
end
# Phlex::ArgumentError: `Phlex::Kit` was extended into Components.
#
# You should only extend modules with `Phlex::Kit` as it is not compatible with classes.
```
