---
title: Rendering an HTML doctype in Phlex
---

# Doctype (HTML only)

In `Phlex::HTML` components, you can output an HTML5 doctype with the `doctype` method. It takes no arguments.

::: code-group

```ruby [Phlex]
doctype
```

```html [HTML]
<!doctype html>
```

:::

You’ll usually call it once, at the top of a [layout](/rails/layouts).

::: code-group

```ruby [Phlex]
class Layout < Phlex::HTML
  def view_template(&)
    doctype

    html do
      head { title { "My app" } }
      body(&)
    end
  end
end
```

```html [HTML]
<!doctype html>
<html>
  <head>
    <title>My app</title>
  </head>
  <body></body>
</html>
```

:::

`doctype` isn’t available in `Phlex::SVG` components.
