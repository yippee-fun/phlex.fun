---
title: Build your first page with Phlex
---

# Build your first page

In this tutorial, we’ll build a page that lists articles. Along the way we’ll write a view, extract a component, give it a content block and tidy things up. It takes about ten minutes.

We’ll use Rails here. If you’re not using Rails, the templates are written the same way, but the generators, base classes and controller are Rails-specific.

## Before you start

You’ll need a Rails app with [Phlex installed](/introduction/getting-started#installing-phlex-in-a-rails-app), including the install generator.

We also need some articles to list. If your app doesn’t have a suitable model, generate one:

```bash
bin/rails generate model Article title:string summary:text featured:boolean
bin/rails db:migrate
```

Add a couple of records in `bin/rails console`:

```ruby
Article.create!(title: "Hello, Phlex", summary: "Views in pure Ruby.", featured: true)
Article.create!(title: "Kits", summary: "A shorter way to render.")
```

And add a route in `config/routes.rb`:

```ruby
resources :articles, only: :index
```

## 1. Generate a view

A view is a component that represents a whole page. Let’s generate one for the articles index.

```bash
bin/rails generate phlex:view Articles::Index
```

This creates `app/views/articles/index.rb`:

```ruby
class Views::Articles::Index < Views::Base
  def view_template
    h1 { "Articles::Index" }
    p { "Find me in app/views/articles/index.rb" }
  end
end
```

`view_template` is where the HTML goes. `h1` and `p` are methods. When an element’s block returns a string, that string becomes the element’s text.

## 2. Render it from a controller

Create `app/controllers/articles_controller.rb` and render the view by passing an instance of it to `render`.

```ruby
class ArticlesController < ApplicationController
  def index
    render Views::Articles::Index.new
  end
end
```

Visit `/articles` and you’ll see the heading, inside your existing application layout.

## 3. Pass in some data

Phlex views don’t read the controller’s instance variables. They’re plain Ruby objects, so you give them data through `initialize`.

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

Update the controller to match.

```ruby
def index
  render Views::Articles::Index.new(articles: Article.all)
end
```

```html
<h1>Articles</h1>
<ul>
  <li>Hello, Phlex</li>
  <li>Kits</li>
</ul>
```

::: tip
If you view the page source, it won’t look exactly like this. Phlex doesn’t add whitespace between elements, so we’ve formatted the HTML to make it easier to read. In development, you’ll also see comments like `<!-- Before Views::Articles::Index -->`, which the generated base class adds to help you find where each piece of HTML came from.
:::

Notice the loop is an ordinary `each`. There’s no template syntax to learn for conditionals and loops.

## 4. Extract a component

A list of titles is a bit plain. Let’s show each article as a card, and make the card a component so we can use it on other pages.

```bash
bin/rails generate phlex:component Card
```

Open `app/components/card.rb` and replace the template.

```ruby
class Components::Card < Components::Base
  def initialize(title:)
    @title = title
  end

  def view_template
    article(class: "card") do
      h2 { @title }
      yield
    end
  end
end
```

The `yield` is where the card’s content will go. Whoever renders the card decides what that is by passing a block.

## 5. Render the component

Back in the view, render a card for each article with `render`.

```ruby{6-8}
def view_template
  h1 { "Articles" }

  @articles.each do |article|
    render Components::Card.new(title: article.title) do
      p { article.summary }
    end
  end
end
```

```html
<h1>Articles</h1>
<article class="card">
  <h2>Hello, Phlex</h2>
  <p>Views in pure Ruby.</p>
</article>
<article class="card">
  <h2>Kits</h2>
  <p>A shorter way to render.</p>
</article>
```

The block runs in the context of the view, not the card. That’s why it can use `article` and the view’s own instance variables.

## 6. Use the shorter syntax

The install generator set up `Components` as a [Kit](/components/kits), which means every component in it can be rendered by calling a method with its name. This does the same thing as the `render` call above.

```ruby{5-7}
def view_template
  h1 { "Articles" }

  @articles.each do |article|
    Card(title: article.title) do
      p { article.summary }
    end
  end
end
```

Now your own components read like HTML elements, with a capital letter to tell them apart.

## 7. Add an option

Let’s highlight featured articles. Add an option to the card and use it to add a class. We’ll pass the option in from the view in the next step.

```ruby{2,4,8}
class Components::Card < Components::Base
  def initialize(title:, featured: false)
    @title = title
    @featured = featured
  end

  def view_template
    article(class: ["card", ("card-featured" if @featured)]) do
      h2 { @title }
      yield
    end
  end
end
```

When you pass an array to `class`, Phlex joins the values with spaces and leaves out any `nil`s. That makes conditional classes easy to write. There’s more on this in [Attributes](/sgml/attributes).

## 8. Handle the empty case

Views are classes, so when a template gets long you can extract a method. Let’s show a message when there are no articles.

```ruby
class Views::Articles::Index < Views::Base
  def initialize(articles:)
    @articles = articles
  end

  def view_template
    h1 { "Articles" }

    if @articles.any?
      @articles.each do |article|
        Card(title: article.title, featured: article.featured?) do
          p { article.summary }
        end
      end
    else
      empty_state
    end
  end

  private def empty_state
    p(class: "empty") { "Nothing here yet." }
  end
end
```

With some articles:

```html
<h1>Articles</h1>
<article class="card card-featured">
  <h2>Hello, Phlex</h2>
  <p>Views in pure Ruby.</p>
</article>
<article class="card">
  <h2>Kits</h2>
  <p>A shorter way to render.</p>
</article>
```

And with none:

```html
<h1>Articles</h1>
<p class="empty">Nothing here yet.</p>
```

## What you’ve learned

That’s a view, a reusable component, a content block, a Kit and a conditional attribute. Those few ideas cover most of what you’ll do day to day.

From here:

- [Rendering](/components/rendering) and [Yielding](/components/yielding) go deeper on composing components, including components with several content areas.
- [Attributes](/sgml/attributes) covers classes, `data` attributes, styles and boolean attributes.
- [Helpers](/rails/helpers) and [Forms](/rails/forms) show how to use `link_to`, `form_with` and the rest of Rails’ helpers.
- [Layouts](/rails/layouts) explains how to write your layout in Phlex too.
- [Testing](/components/testing) shows how to test components.
