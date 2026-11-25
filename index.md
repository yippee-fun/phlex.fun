---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

title: Phlex
titleTemplate: View components in Ruby
description: Phlex is a Ruby gem for building stunning server-side rendered object-oriented view components.

hero:
  name: "Phlex"
  text: "Stunning server-side rendered views"
  tagline: A little Ruby gem for building HTML and SVG view components.
  actions:
    - theme: brand
      text: Get started
      link: /introduction/getting-started
    - theme: alt
      text: Why Phlex?
      link: /introduction/
    - theme: alt
      text: GitHub Repo
      link: https://github.com/yippee-fun/phlex

features:
  - title: Pure, beautiful Ruby
    link: /introduction/
    icon: 🧑‍🍳
    details: Phlex gives you HTML semantics in Ruby so you can use your existing skills designing object-oriented views.
  - title: Fast enough
    icon: 🚀
    details: Phlex renders HTML at ~1.4gbps per core on a MacBook Pro (M3 Max) and it doesn’t slow exponentially the more components you extract.
  - title: Rails integration
    link: /rails/generators
    icon: 🚂
    details: Phlex works great with Rails. It has adapters for Rails’ view helpers and plays nicely with ERB, ViewComponent, Stimulus, Turbo and Tailwind.
  - title: Ruby tooling
    icon: 🧰
    details: Use tools like RubyLSP, RuboCop and SimpleCov.
  - title: Kits
    link: /components/kits
    icon: 🎒
    details: Package up components into Kits (Ruby modules) for easy reuse across projects.
  - title: Structural safety
    link: /miscellaneous/structural-safety
    icon: 🛡️
    details: Phlex is designed to structurally prevent cross-site-scripting (XSS) attacks.
  - title: Sensible isolation
    link: /components/testing
    icon: 🧪
    details: Phlex components only depend on the data you pass in, making them easier to test and reuse.
  - title: Selective rendering
    link: /components/fragments
    icon: 🔎
    details: Render a view targeting a specific fragment of HTML and Phlex outputs just the parts you want, then stops.
  - title: Streaming
    link: /components/streaming
    icon: 🌊
    details: Phlex can flush output as it renders to improve time-to-first-byte (TTFB). Let users see content before the database has even responded.
  - title: Fragment caching
    link: /components/caching
    icon: 💵
    details: Rails-compatible fragment caching lets you control how different parts of your view are cached.
  - title: HTML / SVG string-builder
    link: /sgml/string-builder
    icon: 🧵
    details: You can also use the Phlex DSL to build HTML and SVG strings directly, without creating a component class.
  - title: CSV
    link: /csv/
    icon: 📊
    details: Describe CSV exports with the same component model, with protection against CSV injection built in.
---

## Views in plain Ruby

A Phlex component is a Ruby class. Elements are methods, attributes are keyword arguments and content goes in a block.

```ruby
class Nav < Phlex::HTML
  def initialize(links:)
    @links = links
  end

  def view_template
    nav(class: "main-nav") do
      ul do
        @links.each do |label, url|
          li { a(href: url) { label } }
        end
      end
    end
  end
end
```

```html
<nav class="main-nav">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>
```

[Try it in one minute](/introduction/getting-started#try-it-in-one-minute) with a single Ruby file, or [build your first page](/introduction/tutorial) in a Rails app.
