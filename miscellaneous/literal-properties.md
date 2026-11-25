---
title: Literal Properties
---

# Literal Properties

When you build views with Phlex components, you end up creating a lot of small classes. And there can be quite a lot of boilerplate.

At one point, Phlex had a solution to this, but it has subsequently been extracted into a separate gem called [Literal](https://literal.fun). Literal and Phlex go well together, specifically [Literal Properties](https://literal.fun/docs/properties).

Literal isn’t a dependency of Phlex, so add it to your bundle first.

```bash
bundle add literal
```

To use Literal Properties in Phlex, extend the `Literal::Properties` module. If you do this in your base component, you’ll be able to use `prop` in any of your component classes.

```ruby
class Components::Base < Phlex::HTML
  extend Literal::Properties
end
```

Now in your components, you can use `prop`. Each prop becomes a keyword argument to the initializer and is assigned to an instance variable of the same name.

```ruby
class Components::LinkButton < Components::Base
  Size = _Union(:small, :medium, :large)
  Variant = _Union(:primary, :success, :danger)

  prop :href, String
  prop :size, Size, default: :medium
  prop :variant, Variant, default: :primary
  prop :disabled, _Boolean, default: false

  def view_template(&)
    a(href: @href, class: ["button", @size, @variant], aria_disabled: @disabled, &)
  end
end
```

```ruby
Components::LinkButton.new(href: "/articles", variant: :success).call { "Articles" }
```

```html
<a href="/articles" class="button medium success">Articles</a>
```

The props are checked when the component is initialized. If you pass a value of the wrong type, you’ll get a `Literal::TypeError` that names the prop, the expected type and the value it received.

```ruby
Components::LinkButton.new(href: "/articles", size: :huge)
```

```text
Literal::TypeError: Type mismatch

Components::LinkButton#initialize
  size:
    Expected: _Union(:small, :medium, :large)
    Actual (Symbol): :huge
```

Check the [Literal docs](https://literal.fun) for usage guides.

## Rails form builders <Badge type="danger" text="Rails" />

In Rails, the form builders and tag builders that Phlex gives you are wrapped, so their types need wrapping too. See [Type checking a form builder](/rails/forms#type-checking-a-form-builder) and [Type checking a buffered object](/rails/helpers#type-checking-a-buffered-object).
