---
title: Snippets in Phlex components
---

# Snippets

In some component systems — e.g. [Svelte](https://svelte.dev/docs/svelte/snippet) — snippets are a framework feature. They allow you to extract a small part of your template into a reusable snippet without extracting a whole component.

In Phlex, snippets are just methods. Like with any other Ruby class, you can extract a few lines of code into a method.

```ruby
class Sidebar < Phlex::HTML
  def view_template
    aside do
      intro
      links
    end
  end

  private

  def intro
    h2 { "Welcome to the site!" }
    p { "This is the sidebar." }
  end

  def links
    nav do
      nav_link "Home", "/"
      nav_link "About", "/about"
    end
  end

  def nav_link(text, href)
    a(href:, class: "sidebar-link") { text }
  end
end
```

```html
<aside>
  <h2>Welcome to the site!</h2>
  <p>This is the sidebar.</p>
  <nav><a href="/" class="sidebar-link">Home</a><a href="/about" class="sidebar-link">About</a></nav>
</aside>
```

Because they’re methods, snippets can take arguments, as `nav_link` does above. They can take blocks too. Pass the block on to an element and it becomes that element’s content.

```ruby
class Profile < Phlex::HTML
  def view_template
    stat("Posts") { "12" }
    stat("Followers") { strong { "340" } }
  end

  private def stat(label, &)
    div(class: "stat") do
      span(class: "stat-label") { label }
      span(class: "stat-value", &)
    end
  end
end
```

```html
<div class="stat">
  <span class="stat-label">Posts</span><span class="stat-value">12</span>
</div>
<div class="stat">
  <span class="stat-label">Followers</span><span class="stat-value"><strong>340</strong></span>
</div>
```

That’s it. Use _methods_ to make your components easier to understand and avoid deep nesting. And as you’ve [already seen](/components/yielding#yielding-an-interface), if you make those methods public, you can call them in the content block from the parent component.

When a snippet is useful in more than one component, move it to a module or a shared superclass, or turn it into a component of its own.
