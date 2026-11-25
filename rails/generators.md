---
title: Installation and generators
---

# Installation and generators

`phlex-rails` is the gem that connects Phlex to Rails. It lets you render components from controllers and ERB, adapts Rails’ view helpers, and comes with three generators: one to set your app up, one for views and one for components.

## Requirements

`phlex-rails` 2.4 works with:

- Ruby 3.2 or later
- Rails 7.1 or later (below 9)
- Phlex 2.4

## Installing

Add the gem to your app, then run the install generator.

```bash
bundle add phlex-rails
bin/rails generate phlex:install
```

The install generator takes no arguments. It creates three files:

```text
create  config/initializers/phlex.rb
create  app/components/base.rb
create  app/views/base.rb
```

### The initializer

`config/initializers/phlex.rb` defines two modules, `Views` and `Components`, and tells the Rails autoloader to load `app/views` and `app/components` under those namespaces.

```ruby
# frozen_string_literal: true

module Views
end

module Components
  extend Phlex::Kit
end

Rails.autoloaders.main.push_dir(
  Rails.root.join("app/views"), namespace: Views
)

Rails.autoloaders.main.push_dir(
  Rails.root.join("app/components"), namespace: Components
)
```

That means `app/components/sidebar.rb` should define `Components::Sidebar` and `app/views/articles/index.rb` should define `Views::Articles::Index`. Your ERB templates can stay in `app/views` alongside your Phlex views.

`Components` is a [Kit](/components/kits). Any component defined under it can be rendered from another component by calling a method with its name, such as `Sidebar()`.

::: tip
If you also use ViewComponent, you’ll already have classes in `app/components` that aren’t in a `Components` namespace. See [Already using ViewComponent?](/introduction/getting-started#already-using-viewcomponent) in Getting started.
:::

### The base component

`app/components/base.rb` is the abstract class that all your components inherit from.

```ruby
# frozen_string_literal: true

class Components::Base < Phlex::HTML
  # Include any helpers you want to be available across all components
  include Phlex::Rails::Helpers::Routes

  if Rails.env.development?
    def before_template
      comment { "Before #{self.class.name}" }
      super
    end
  end
end
```

It includes the [routes adapter](/rails/helpers#routes), so you can use helpers like `articles_path` in every component.

In development, it also defines a [`before_template` callback](/components/callbacks) that outputs an HTML comment before each component. You can see where each component starts when you inspect the page:

```html
<!-- Before Components::Sidebar -->
<aside>…</aside>
```

This file is yours. Delete the `before_template` method if you don’t want the comments.

### The base view

`app/views/base.rb` is the abstract class for your [views](/rails/views).

```ruby
# frozen_string_literal: true

class Views::Base < Components::Base
  # The `Views::Base` is an abstract class for all your views.

  # By default, it inherits from `Components::Base`, but you
  # can change that to `Phlex::HTML` if you want to keep views and
  # components independent.

  # More caching options at https://www.phlex.fun/components/caching
  def cache_store = Rails.cache
end
```

Because it inherits from `Components::Base`, views get the same helpers and can render your components with the Kit syntax.

It also sets the [cache store](/components/caching) to `Rails.cache`, so you can use `cache` in views. `Components::Base` doesn’t define a cache store. If you want to use `cache` in components too, move the `cache_store` method up into `Components::Base`.

::: warning
If you change `Views::Base` to inherit from `Phlex::HTML`, views will no longer be able to call components as `Sidebar()`. You’ll need to add `include Components` to `Views::Base` to get that back.
:::

## Generating a view

```bash
bin/rails generate phlex:view Articles::Index
```

This creates `app/views/articles/index.rb`:

```ruby
# frozen_string_literal: true

class Views::Articles::Index < Views::Base
  def view_template
    h1 { "Articles::Index" }
    p { "Find me in app/views/articles/index.rb" }
  end
end
```

The generator takes one argument, the name of the view. You can also write it as a path: `articles/index`. By convention, views are named after the controller and action that render them.

See [Views](/rails/views) for how to render it.

## Generating a component

```bash
bin/rails generate phlex:component Sidebar
```

This creates `app/components/sidebar.rb`:

```ruby
# frozen_string_literal: true

class Components::Sidebar < Components::Base
  def view_template
    h1 { "Sidebar" }
    p { "Find me in app/components/sidebar.rb" }
  end
end
```

Namespaced names create nested folders: `phlex:component Forms::TextField` creates `app/components/forms/text_field.rb`, which defines `Components::Forms::TextField`.

Both generators accept the standard Rails generator options, such as `--pretend`, `--force` and `--skip`. You can undo them with `bin/rails destroy phlex:view Articles::Index` and `bin/rails destroy phlex:component Sidebar`.

## Customising the generator templates <Badge type="info" text="2.3+" />

You can replace the templates used by the view and component generators by adding your own to `lib/generators/phlex/templates` in your app.

| Generator | Template file |
| --- | --- |
| `phlex:component` | `lib/generators/phlex/templates/component.rb.erb` |
| `phlex:view` | `lib/generators/phlex/templates/view.rb.erb` |

Each generator checks for its own file, so you can override one without the other.

For example, to generate components with an empty template:

```erb
# frozen_string_literal: true

class Components::<%= class_name %> < Components::Base
  def view_template
  end
end
```

Now `bin/rails generate phlex:component Custom` creates:

```ruby
# frozen_string_literal: true

class Components::Custom < Components::Base
  def view_template
  end
end
```

The templates are ERB files rendered by the Rails generator, so the usual generator methods are available: `class_name`, `file_name`, `class_path` and so on.

The install generator doesn’t look in that folder. Like any Rails generator, it uses a template from `lib/templates/phlex/install` if one exists there, such as `lib/templates/phlex/install/base_component.rb.erb`.

## Ruby LSP add-on <Badge type="info" text="2.3+" />

`phlex-rails` ships with an add-on for [Ruby LSP](https://shopify.github.io/ruby-lsp/). There’s nothing to configure: Ruby LSP discovers it when `phlex-rails` is in your bundle.

The add-on teaches Ruby LSP about helpers you register with [`register_value_helper` and `register_output_helper`](/rails/helpers#registering-your-own-helpers), so Ruby LSP knows about them as methods on the class or module that registered them and can offer them in autocomplete. It picks up the form that takes a Symbol, such as `register_value_helper :format_release_date`.

## Where to go next

- [Adopting Phlex](/rails/adopting-phlex) in a new or existing app
- [Views](/rails/views)
- [Layouts](/rails/layouts)
- [Helpers](/rails/helpers)
- [Forms](/rails/forms)
