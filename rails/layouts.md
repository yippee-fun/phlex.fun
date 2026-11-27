---
title: Rails Layouts in Phlex
---

# Rails Layouts in Phlex

In this world of components, where do _layouts_ fit in? Rails has a special concept for layouts where they are separate from the rest of your views and partials. ActionView renders the inner parts of your view first and then wraps it up in a layout at the last moment.

There are a couple of problems with this approach:

1. it adds complexity to the rendering process — there’s a new concept to understand with special rules; and
2. it necessitates the `content_for` helper and strange `yield` behaviours in order to hoist content from the view up into the layout.

In Phlex, layouts are just components. This page shows three ways to build them, then how to [use a Phlex component as a regular Rails layout](#working-with-legacy-layouts) for views that aren’t written in Phlex yet.

The examples assume the `Views::Base` and `Components::Base` classes created by the [install generator](/rails/generators).

## Layouts through composition

The simplest way to implement layouts in Phlex is through _composition_. You render a view from a controller and the first thing the view does is render a layout component, passing content via a block.

::: code-group

```ruby{2,5} [controller]
class ArticlesController < ApplicationController
  layout false

  def index
    render Views::Articles::Index.new(
      articles: Article.all.limit(10)
    )
  end
end
```

```ruby{7} [view]
class Views::Articles::Index < Views::Base
  def initialize(articles:)
    @articles = articles
  end

  def view_template
    Layout(title: "Articles") do
      h1 { "Articles" }

      ul do
        @articles.each do |article|
          li { article.title }
        end
      end
    end
  end
end
```

```ruby{14} [layout]
class Components::Layout < Components::Base
  def initialize(title:)
    @title = title
  end

  def view_template
    doctype

    html do
      head do
        title { @title }
      end

      body { yield }
    end
  end
end
```

:::

```html
<!doctype html>
<html>
  <head>
    <title>Articles</title>
  </head>
  <body>
    <h1>Articles</h1>
    <ul>
      <li>First</li>
      <li>Second</li>
    </ul>
  </body>
</html>
```

`Layout(...)` is the [Kit](/components/kits) way of writing `render Components::Layout.new(...)`. It works here because `Views::Base` inherits from `Components::Base`. If your base view inherits from `Phlex::HTML` instead, add `include Components` to it or you’ll get a `NoMethodError` for `Layout`.

::: tip
You can put `layout false` in your `ApplicationController` to disable Rails’ built-in layout system across all your controllers. Without it, Rails wraps your view in `app/views/layouts/application.html.erb` and you’ll end up with two `<html>` elements.
:::

### Rails helpers in the `<head>`

A real layout needs a few Rails helpers in its `<head>`. Include the [adapters](/rails/helpers) for the ones you use.

```ruby
class Components::Layout < Components::Base
  include Phlex::Rails::Helpers::CSRFMetaTags
  include Phlex::Rails::Helpers::CSPMetaTag
  include Phlex::Rails::Helpers::StyleSheetLinkTag
  include Phlex::Rails::Helpers::JavaScriptIncludeTag

  def initialize(title:)
    @title = title
  end

  def view_template
    doctype

    html do
      head do
        title { @title }
        csrf_meta_tags
        csp_meta_tag
        stylesheet_link_tag "application"
        javascript_include_tag "application", defer: true
      end

      body { yield }
    end
  end
end
```

## Layouts through inheritance

Another way to implement layouts in Phlex is through inheritance. You create an abstract base view class for your views to inherit from, and that base view actually renders the layout around the template.

::: code-group

```ruby [controller]
class ArticlesController < ApplicationController
  layout false

  def index
    render Views::Articles::Index.new(
      articles: Article.all.limit(10)
    )
  end
end
```

```ruby{6} [view]
class Views::Articles::Index < Views::Base
  def initialize(articles:)
    @articles = articles
  end

  def page_title = "Articles"

  def view_template
    h1 { "Articles" }

    ul do
      @articles.each do |article|
        li { article.title }
      end
    end
  end
end
```

```ruby{2,10} [base view (layout)]
class Views::Base < Components::Base
  def around_template
    doctype

    html do
      head do
        title { page_title }
      end

      body { super }
    end
  end
end
```

:::

Notice in the above example how we use a method to set the title of the page. The super class calls the method, requiring the subclass to implement it.

The [`around_template`](/components/callbacks#around-template) callback wraps the view’s template. Calling `super` is what renders the template, so wherever you call it is where the view’s content goes.

::: tip
Alternatively, we could have defined a `view_template` method in the base class that yields, and called `super` with a block from the `view_template` implementation in the subclass.
:::

## Combining inheritance and composition

The final approach is to combine both inheritance and composition. This final example has quite a lot going on, but it’s extremely flexible.

- the controller renders the view as normal
- the view defines `#page_title` and `#layout` methods
- the base view uses the `#around_template` hook to render the layout component that was specified by the view
- it passes a `page_info` object to the layout component containing the page title
- finally, the layout takes the `page_info` object and renders as normal

::: code-group

```ruby [controller]
class ArticlesController < ApplicationController
  layout false

  def index
    render Views::Articles::Index.new(
      articles: Article.all.limit(10)
    )
  end
end
```

```ruby{6-7} [view]
class Views::Articles::Index < Views::Base
  def initialize(articles:)
    @articles = articles
  end

  def page_title = "Articles"
  def layout = Layout

  def view_template
    h1 { "Articles" }

    ul do
      @articles.each do |article|
        li { article.title }
      end
    end
  end
end
```

```ruby{2,4-8,10-14} [base view]
class Views::Base < Components::Base
  PageInfo = Data.define(:title)

  def around_template
    render layout.new(page_info) do
      super
    end
  end

  def page_info
    PageInfo.new(
      title: page_title
    )
  end
end
```

```ruby{2,11} [layout]
class Components::Layout < Components::Base
  def initialize(page_info)
    @page_info = page_info
  end

  def view_template
    doctype

    html do
      head do
        title { @page_info.title }
      end

      body { yield }
    end
  end
end
```

:::

In the view, the constant `Layout` resolves to `Components::Layout` because the view inherits from `Components::Base`, which is part of the `Components` kit.

## Working with legacy layouts

If you’re bringing Phlex into an existing Rails app, there’s no urgent need to convert your layouts. In fact, the layouts are probably the lowest priority.

You’ll get way more benefits from extracting small, reusable components since you can immediately start rendering them in both your new Phlex views and your old Rails views. Plus, your new Phlex views will render just fine inside normal Rails layouts. They can even set `content_for` blocks for the layout — see [Setting content for the layout](/rails/views#setting-content-for-the-layout).

With that said, there _is_ a way to write your layouts in Phlex while still rendering normal non-Phlex views.

### `Phlex::Rails::Layout`

If you include `Phlex::Rails::Layout` in a component, it can be used as a normal Rails layout. Call `yield` where the view should go. You can even yield symbols to get `content_for` blocks.

```ruby{2,9,15}
class Components::Layout < Components::Base
  include Phlex::Rails::Layout

  def view_template
    doctype

    html do
      head do
        title { yield(:title) }
        csrf_meta_tags
        stylesheet_link_tag "application"
        javascript_include_tag "application", defer: true
      end

      body { yield }
    end
  end
end
```

In the controller, specify the layout with a Proc like this.

```ruby
class ArticlesController < ApplicationController
  layout -> { Components::Layout }
end
```

Now an ERB view that sets a title is rendered inside the Phlex layout.

```erb
<% content_for(:title) { "Legacy page" } %>
<h1>Hello from ERB</h1>
```

```html
<!doctype html>
<html>
  <head>
    <title>Legacy page</title>
    <meta name="csrf-param" content="authenticity_token" />
    <meta name="csrf-token" content="…" />
    <link rel="stylesheet" href="/stylesheets/application.css" />
    <script src="/javascripts/application.js" defer="defer"></script>
  </head>
  <body>
    <h1>Hello from ERB</h1>
  </body>
</html>
```

Phlex views rendered by that controller are wrapped in the layout too.

::: warning
The layout has to be given as a Proc. `layout Components::Layout`, without the `->`, doesn’t raise an error, but Rails ignores it and renders the view with no layout. Passing a component to the `layout:` option of a controller’s `render` raises an `ArgumentError`.
:::

### Included helpers

`Phlex::Rails::Layout` includes the helper adapters you’re most likely to need in a `<head>`, so you don’t have to include them yourself:

| Adapter | Helper |
| --- | --- |
| `ActionCableMetaTag` | `action_cable_meta_tag` |
| `AutoDiscoveryLinkTag` | `auto_discovery_link_tag` |
| `CSPMetaTag` | `csp_meta_tag` |
| `CSRFMetaTags` | `csrf_meta_tags` |
| `FaviconLinkTag` | `favicon_link_tag` |
| `JavaScriptImportmapModulePreloadTags` | `javascript_importmap_module_preload_tags` |
| `JavaScriptImportmapTags` | `javascript_importmap_tags` |
| `JavaScriptImportModuleTag` | `javascript_import_module_tag` |
| `JavaScriptIncludeTag` | `javascript_include_tag` |
| `JavaScriptInlineImportmapTag` | `javascript_inline_importmap_tag` |
| `PreloadLinkTag` | `preload_link_tag` |
| `StyleSheetLinkTag` | `stylesheet_link_tag` |
| `TurboRefreshMethodTag` | `turbo_refresh_method_tag` |
| `TurboRefreshScrollTag` | `turbo_refresh_scroll_tag` |
| `TurboRefreshesWith` | `turbo_refreshes_with` |

The importmap, Turbo and Action Cable helpers only work if your app uses those libraries.

### Passing parameters to layouts

The Proc is evaluated by the controller, so it can return an instance of the layout rather than the class. This lets you pass arguments to the layout based on data available in the controller.

::: code-group

```ruby [controller]
class ApplicationController < ActionController::Base
  layout -> { Components::Layout.new(banner: show_banner?) }

  def show_banner?
    cookies[:accepted] != "true"
  end
end
```

```ruby [layout]
class Components::Layout < Components::Base
  include Phlex::Rails::Layout

  def initialize(banner: false)
    @banner = banner
  end

  def view_template
    doctype

    html do
      head { title { yield(:title) } }

      body do
        div(class: "banner") { "We use cookies" } if @banner
        main { yield }
      end
    end
  end
end
```

:::

If you return the class, Rails instantiates it with no arguments, so every argument needs a default.

### HTML components only

`Phlex::Rails::Layout` can only be included in `Phlex::HTML` subclasses. Including it anywhere else raises an error.

```text
Phlex::ArgumentError: 👋 Phlex::Rails::Layout should only be included into Phlex::HTML classes.
```
