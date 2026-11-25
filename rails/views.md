---
title: Phlex Views in Rails
---

# Phlex Views in Rails

In Phlex, a view is another component. It’s the component you render from a controller action, and it stands in for the ERB template you’d otherwise have written for that action.

To help distinguish views from components, the [install generator](/rails/generators) in `phlex-rails` creates a `Views` module and loads Ruby files in `app/views` under this module. Views inherit from `Views::Base`, which inherits from `Components::Base`, so everything you can do in a component you can do in a view.

## Creating a view

You can create a view with the generator. By convention, views map to the names of your controllers and actions.

```bash
bin/rails generate phlex:view Articles::Index
```

This creates `app/views/articles/index.rb`. Here it is with a template filled in:

```ruby
class Views::Articles::Index < Views::Base
  def initialize(articles:)
    @articles = articles
  end

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

## Rendering a view

Now in your `ArticlesController`, you can render the view like this:

```ruby
class ArticlesController < ApplicationController
  def index
    render Views::Articles::Index.new(
      articles: Article.all
    )
  end
end
```

Rails treats the view like any other template. It’s rendered inside the controller’s layout, and the usual `render` options work.

```ruby
render Views::Articles::Index.new(articles:), status: :not_found
render Views::Articles::Index.new(articles:), layout: false
```

If you’d like the view to be responsible for the whole page, including the `<html>` element, turn the Rails layout off and see [Layouts](/rails/layouts).

If a view takes no arguments, you can pass the class instead of an instance.

```ruby
render Views::Pages::About
```

You can also render a view to a String from a controller with `render_to_string`, or from anywhere else with the controller’s renderer.

```ruby
ApplicationController.renderer.render(
  Views::Articles::Index.new(articles: Article.all),
  layout: false
)
```

## Passing data to a view

Controller instance variables aren’t copied into Phlex views. Pass a view the data it needs through its initializer.

```ruby
def show
  article = Article.find(params[:id])

  render Views::Articles::Show.new(
    article:,
    comments: article.comments.limit(20)
  )
end
```

This makes a view’s inputs explicit, and it means you can [test a view](/components/testing) without setting up controller state. If you’d like less boilerplate and type checking for those arguments, have a look at [Literal Properties](/miscellaneous/literal-properties).

## Using Rails helpers

Route helpers are available in every view because the generated `Components::Base` includes `Phlex::Rails::Helpers::Routes`. Other helpers need to be included before you can use them.

```ruby
class Views::Articles::Show < Views::Base
  include Phlex::Rails::Helpers::TimeAgoInWords

  def initialize(article:)
    @article = article
  end

  def view_template
    h1 { @article.title }
    p { "Published #{time_ago_in_words(@article.published_at)} ago" }
    a(href: edit_article_path(@article)) { "Edit" }
  end
end
```

See [Helpers](/rails/helpers) for the full list.

### Helpers don’t work in `initialize`

Rails helpers need a view context, and a component doesn’t have one until Rails starts rendering it. If you call a helper before then, you’ll get an error.

```ruby
class Views::Articles::Show < Views::Base
  def initialize(article:)
    @article = article
    @url = article_path(article) # 💥
  end
end
```

```text
Phlex::Rails::HelpersCalledBeforeRenderError: You can’t use Rails view helpers until after the component has started rendering.
```

Call the helper from the template instead, or from a method that the template calls.

```ruby
class Views::Articles::Show < Views::Base
  def initialize(article:)
    @article = article
  end

  def view_template
    a(href: url) { @article.title }
  end

  private def url = article_path(@article)
end
```

For the same reason, helpers that depend on the request, including route helpers, don’t work when you render a component yourself with `call`. Render it through a controller, the controller’s renderer or a view context instead.

### The view context

`view_context` returns the Rails view context that’s rendering the component. It’s the object ERB templates are evaluated against, so it responds to every helper, as well as `controller`, `request` and `params`.

```ruby
def view_template
  p { view_context.controller.class.name }
end
```

It’s an escape hatch and we don’t recommend it for helpers. Output helpers called on the view context return HTML rather than outputting it, so it’s easy to get wrong. Use an [adapter](/rails/helpers) instead. Like the helpers, `view_context` raises `Phlex::Rails::HelpersCalledBeforeRenderError` before rendering starts.

## Setting content for the layout

If your view is rendered inside an ERB layout (or a [Phlex layout that includes `Phlex::Rails::Layout`](/rails/layouts#working-with-legacy-layouts)), you can pass content up to it with `content_for` or `provide`. Include the adapters first.

::: code-group

```ruby{2,5-6} [view]
class Views::Articles::Index < Views::Base
  include Phlex::Rails::Helpers::ContentFor

  def view_template
    content_for(:title) { "Articles" }
    content_for(:sidebar) { nav { a(href: "/") { "Home" } } }

    h1 { "Articles" }
  end
end
```

```erb [app/views/layouts/application.html.erb]
<!doctype html>
<html>
  <head><title><%= yield(:title) %></title></head>
  <body>
    <%= yield(:sidebar) %>
    <%= yield %>
  </body>
</html>
```

:::

```html
<!doctype html>
<html>
  <head>
    <title>Articles</title>
  </head>
  <body>
    <nav><a href="/">Home</a></nav>
    <h1>Articles</h1>
  </body>
</html>
```

The block is a normal Phlex block, so you can use elements and render components inside it. `Phlex::Rails::Helpers::ContentFor` also gives you `content_for?(:title)`, and `Phlex::Rails::Helpers::Provide` gives you `provide(:title, "Articles")`.

If your layout is a Phlex component that the view renders itself, you don’t need any of this. Pass the title as an argument.

## Rendering models, partials and other components

Inside a view, `render` works as it does in [any other component](/components/rendering#what-you-can-render), and `phlex-rails` teaches it about a few Rails things:

```ruby
def view_template
  render Components::Sidebar.new       # a Phlex component
  Sidebar()                            # the same thing, using the Components kit

  render partial("shared/flash")       # a Rails partial
  render partial("card", title: "Hi") do
    p { "Inside the partial’s yield" }
  end

  render @article                      # an Active Record model, using articles/_article
  render @articles                     # each article in turn, using articles/_article
  render CardComponent.new             # a ViewComponent component
end
```

The details are in the rendering guide:

- [Rendering Rails partials](/components/rendering#rendering-rails-partials-in-phlex)
- [Rendering ViewComponent components](/components/rendering#rendering-viewcomponent-components-in-phlex)
- [Models and other renderables](/components/rendering#other-renderables-in-rails)
- [Rendering Phlex components in ERB](/components/rendering#rendering-phlex-components-in-erb)

## Rendering part of a view

When a request has an `X-Fragments` header, Phlex only renders the named [fragments](/components/fragments) of the view. The header is a comma-separated list of fragment names.

```ruby
class Views::Articles::Index < Views::Base
  def view_template
    h1 { "Articles" }

    fragment("list") do
      ul { li { "First" } }
    end
  end
end
```

With the header `X-Fragments: list`, the view renders this and nothing else:

```html
<ul>
  <li>First</li>
</ul>
```

Rails still applies the controller’s layout to that response, so you’ll want to [turn off the layout](/components/fragments#turn-off-the-layout) for fragment requests.

To target several fragments, separate their names with commas: `X-Fragments: list, pagination`.
