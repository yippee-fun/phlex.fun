---
title: Coming to Phlex from ERB
---

# Coming from ERB

If you’ve written ERB, you already know what you want to say. This page shows how to say it in Phlex, one pattern at a time.

The Phlex snippets go inside a component’s `view_template` method, and instance variables like `@article` are set in its `initialize`. Here’s the whole thing once, so the rest of the page can skip it.

```ruby
class Views::Articles::Show < Views::Base
  def initialize(article:)
    @article = article
  end

  def view_template
    h1 { @article.title }
  end
end
```

## Elements and attributes

Each element is a method. Attributes are keyword arguments and content goes in a block.

```erb
<a href="/about" class="nav-link">About</a>
```

```ruby
a(href: "/about", class: "nav-link") { "About" }
```

Void elements, such as `img`, `input` and `br`, don’t take a block.

```erb
<img src="/logo.png" alt="Logo">
```

```ruby
img(src: "/logo.png", alt: "Logo")
```

See [HTML elements](/sgml/html-elements) and [Attributes](/sgml/attributes).

## Outputting values

In ERB, `<%= %>` outputs a value. In Phlex, when an element’s block returns a string, that string becomes the element’s text. Both escape the value.

```erb
<h1><%= @article.title %></h1>
```

```ruby
h1 { @article.title }
```

## Mixing text and elements

The return value is only used when the block hasn’t output anything else. When an element contains text _and_ other elements, use `plain` for the text.

```erb
<p>Hello, <strong><%= @name %></strong>!</p>
```

```ruby
p do
  plain "Hello, "
  strong { @name }
  plain "!"
end
```

See [Text](/sgml/text).

## Conditionals

```erb
<% if @user.admin? %>
  <p>Admin</p>
<% else %>
  <p>Guest</p>
<% end %>
```

```ruby
if @user.admin?
  p { "Admin" }
else
  p { "Guest" }
end
```

## Loops

```erb
<ul>
  <% @items.each do |item| %>
    <li><%= item.name %></li>
  <% end %>
</ul>
```

```ruby
ul do
  @items.each do |item|
    li { item.name }
  end
end
```

## Conditional classes

Pass an array. `nil` values are left out.

```erb
<a href="/" class="tab <%= "active" if @active %>">Home</a>
```

```ruby
a(href: "/", class: ["tab", ("active" if @active)]) { "Home" }
```

## Data attributes

Pass a hash. Underscores in symbol keys become dashes.

```erb
<div data-controller="menu" data-menu-target="panel"></div>
```

```ruby
div(data: { controller: "menu", menu_target: "panel" })
```

## Boolean attributes

`true` renders the attribute. `false` and `nil` leave it out.

```erb
<input type="checkbox" <%= "checked" if @done %>>
```

```ruby
input(type: "checkbox", checked: @done)
```

## Whitespace between elements

ERB keeps the whitespace you type. Phlex doesn’t output any unless you ask for it, which matters between inline elements.

```erb
<span>One</span> <span>Two</span>
```

```ruby
span { "One" }
whitespace
span { "Two" }
```

See [Whitespace](/sgml/whitespace).

## Comments

```erb
<!-- Navigation -->
```

```ruby
comment { "Navigation" }
```

## Unescaped HTML

In ERB, you’d use `raw` or `html_safe`. In Phlex, `raw` only accepts values you’ve explicitly marked as safe.

```erb
<%= raw @trusted_html %>
```

```ruby
raw safe(@trusted_html)
```

In Rails, a string that’s already `html_safe?` can be passed to `raw` directly. See [Raw output](/sgml/raw).

## Partials become components

A partial with locals becomes a class with an initializer.

```erb
<%# app/views/shared/_avatar.html.erb %>
<img src="<%= user.avatar_url %>" alt="<%= user.name %>" class="avatar">
```

```erb
<%= render "shared/avatar", user: @user %>
```

```ruby
class Components::Avatar < Components::Base
  def initialize(user:)
    @user = user
  end

  def view_template
    img(src: @user.avatar_url, alt: @user.name, class: "avatar")
  end
end
```

```ruby
render Components::Avatar.new(user: @user)
```

With a [Kit](/components/kits), that’s `Avatar(user: @user)`.

## Partials that take a block

A partial that calls `yield` becomes a component that calls `yield`.

```erb
<%# app/views/shared/_panel.html.erb %>
<section class="panel">
  <%= yield %>
</section>
```

```erb
<%= render "shared/panel" do %>
  <p>Hello</p>
<% end %>
```

```ruby
class Components::Panel < Components::Base
  def view_template
    section(class: "panel") { yield }
  end
end
```

```ruby
render Components::Panel do
  p { "Hello" }
end
```

When you need more than one content area, see [Yielding](/components/yielding).

## Instance variables from the controller

ERB views can read the controller’s instance variables. Phlex views can’t. Pass what the view needs when you create it.

```ruby
def show
  render Views::Articles::Show.new(article: Article.find(params[:id]))
end
```

See [Views](/rails/views).

## Rails helpers <Badge type="danger" text="Rails" />

Rails’ view helpers aren’t available until you include an adapter for each one. Route helpers are included in `Components::Base` by the install generator.

```erb
<%= link_to "Articles", articles_path %>
```

```ruby
class Components::Nav < Components::Base
  include Phlex::Rails::Helpers::LinkTo

  def view_template
    link_to "Articles", articles_path
  end
end
```

Often you don’t need the helper at all.

```ruby
a(href: articles_path) { "Articles" }
```

See [Helpers](/rails/helpers) for the full list of adapters and [Forms](/rails/forms) for `form_with`.

## Using both at once <Badge type="danger" text="Rails" />

You don’t have to convert everything. Phlex components render from ERB:

```erb
<%= render Components::Panel.new do %>
  <p>Hello from ERB</p>
<% end %>
```

And ERB partials render from Phlex:

```ruby
render partial("shared/footer")
```

See [Rendering](/components/rendering) and [Adopting Phlex](/rails/adopting-phlex).
