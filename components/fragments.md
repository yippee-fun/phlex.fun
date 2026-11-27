---
title: Fragments and selective rendering in Phlex
---

# Fragments

A fragment is a named part of a template that you can render on its own. You mark it with `fragment` and ask for it by name when you call the component.

Fragments are for partial page updates. When a Turbo Frame, an htmx request or a `fetch` call only needs one piece of a page, you don’t have to extract that piece into a second template and a second endpoint. You render the same component and ask for the fragment.

## Defining fragments

Wrap part of a template in `fragment`, giving it a name.

```ruby
class Inbox < Phlex::HTML
  def initialize(messages:)
    @messages = messages
  end

  def view_template
    h1 { "Inbox" }

    fragment("unread-count") do
      span(id: "unread-count") { "#{@messages.size} unread" }
    end

    fragment("messages") do
      ul(id: "messages") do
        @messages.each do |message|
          li { message }
        end
      end
    end

    footer { "You’re all caught up." }
  end
end
```

`fragment` outputs nothing of its own. It also ignores its block’s return value, so output text with `plain` rather than returning a String. A normal render is exactly what it would be without the fragments:

```ruby
Inbox.new(messages: ["Hello", "Lunch?"]).call
```

```html
<h1>Inbox</h1>
<span id="unread-count">2 unread</span>
<ul id="messages">
  <li>Hello</li>
  <li>Lunch?</li>
</ul>
<footer>You’re all caught up.</footer>
```

## Rendering fragments

Pass the names you want to `call` with the `fragments:` keyword.

```ruby
Inbox.new(messages: ["Hello", "Lunch?"]).call(fragments: ["unread-count"])
```

```html
<span id="unread-count">2 unread</span>
```

Only the content of the fragment is output. The `<h1>`, the list and the footer are left out.

You can ask for more than one fragment. They come out in the order they appear in the template, whatever order you list them in.

```ruby
Inbox.new(messages: ["Hello", "Lunch?"]).call(fragments: ["messages", "unread-count"])
```

```html
<span id="unread-count">2 unread</span>
<ul id="messages">
  <li>Hello</li>
  <li>Lunch?</li>
</ul>
```

`fragments:` takes an Array or a Set of names. Passing `nil`, the default, renders the whole component.

## Fragments in nested components

Fragment names are looked up across the whole render, not only in the component you called. A fragment can be defined several components deep, or inside a block you passed to another component, and you still ask for it from the outside.

```ruby
class Message < Phlex::HTML
  def initialize(id:, subject:)
    @id = id
    @subject = subject
  end

  def view_template
    fragment("message-#{@id}") do
      li(id: "message-#{@id}") { @subject }
    end
  end
end

class Messages < Phlex::HTML
  def view_template
    h1 { "Inbox" }

    fragment("messages") do
      ul(id: "messages") do
        render Message.new(id: 1, subject: "Hello")
        render Message.new(id: 2, subject: "Lunch?")
      end
    end
  end
end
```

```ruby
Messages.new.call(fragments: ["message-2"])
```

```html
<li id="message-2">Lunch?</li>
```

Here `message-2` is nested inside `messages`. Fragments can be nested as deeply as you like and you can target any level. Asking for the outer fragment includes the inner ones as part of its content:

```ruby
Messages.new.call(fragments: ["messages"])
```

```html
<ul id="messages">
  <li id="message-1">Hello</li>
  <li id="message-2">Lunch?</li>
</ul>
```

## What is skipped

Phlex doesn’t jump straight to a fragment. It runs the template from the top with output switched off, switches output on inside the fragments you asked for, and stops as soon as it has found them all.

```ruby
class Dashboard < Phlex::HTML
  def view_template
    header { h1 { page_title } }

    fragment("stats") do
      section(id: "stats") { stats }
    end

    footer { small { copyright } }
  end

  private def page_title
    puts "page_title called"
    "Dashboard"
  end

  private def stats
    puts "stats called"
    "42 sales"
  end

  private def copyright
    puts "copyright called"
    "© Acme"
  end
end

Dashboard.new.call(fragments: ["stats"])
```

This prints `page_title called` and `stats called`, but not `copyright called`, and returns:

```html
<section id="stats">42 sales</section>
```

There are three stages.

**Before the fragment**, your Ruby still runs. Element blocks are called, nested components are rendered and their [callbacks](/components/callbacks) fire, so `page_title` was called above. What is skipped is the output: Phlex doesn’t build tags, attributes or text for anything outside a requested fragment.

**Inside the fragment**, everything renders as normal.

**After the last requested fragment closes**, rendering halts. Phlex unwinds straight out of the template, so the rest of it never runs. `copyright` was never called. This includes the remainder of every component on the way out: the code after `yield` or `super` in `around_template`, and `after_template`, don’t run. `ensure` blocks do.

This has a few practical consequences:

- A fragment near the top of a template is cheaper to render than one near the bottom.
- Keep expensive work inside the fragment that needs it, or make it lazy, so a request for a different fragment doesn’t pay for it.
- Don’t rely on `after_template` for anything that must happen on a fragment render.

### Names that aren’t found

If you ask for a name that never appears, there’s no error. Phlex runs the whole template looking for it and outputs nothing for that name.

```ruby
Inbox.new(messages: ["Hello"]).call(fragments: ["nope"]) # => ""
```

### Duplicate names

Each name is rendered once: the first fragment with that name wins and later ones are ignored. If you define fragments in a loop, give each one a unique name, as `Message` does above.

### Captured content

Content rendered inside [`capture`](/components/yielding) is always rendered in full, because you’re asking for it as a string. A `fragment` inside a `capture` block can’t be targeted.

## Naming fragments

- **Use Strings.** Names are compared exactly, so `fragment(:stats)` is not found by `fragments: ["stats"]`. Names that arrive from an HTTP header are always Strings, and fragment names stored in a [cache](#fragments-and-caching) may come back as Strings too.
- **Make names unique within a page**, including across nested components. A name built from a record id, like `"message-#{@id}"`, works well.
- **Match the element id** where you can. The fragment usually wraps a single element that the client is going to replace, so using the same name for both keeps the client code obvious. Remember that `fragment` doesn’t output a wrapper. If you want an element with an id, put one inside the fragment.
- **Avoid commas** in names if you’re using Rails, since the request header is a comma-separated list.

## Fragments and caching

`fragment` works inside [`cache`](/components/caching). When Phlex caches a block, it also records the byte range of each fragment inside it. On a cache hit, Phlex slices the fragment you asked for out of the cached HTML, without running the block.

```ruby
require "json" # for Phlex::FIFOCacheStore

CACHE = Phlex::FIFOCacheStore.new

class Sidebar < Phlex::HTML
  def cache_store = CACHE

  def view_template
    h1 { "Sidebar" }

    cache do
      nav do
        fragment("links") do
          ul { li { "Home" } }
        end
      end
    end
  end
end

Sidebar.new.call(fragments: ["links"])
```

```html
<ul>
  <li>Home</li>
</ul>
```

On a cache miss, the whole cached block is rendered and stored, even though you only asked for one fragment of it, so the next request for any part of it is a hit.

Two things are different when the fragment you asked for is inside a `cache` block. Rendering doesn’t halt afterwards, so the rest of the template and `after_template` still run. And if a name is used more than once inside the block, you get the last one rather than the first.

## Using fragments from Rails <Badge type="danger" text="Rails" /> <Badge type="info" text="2.0.1+" />

In Rails you don’t call `call` yourself, so `phlex-rails` reads the fragment names from an `X-Fragments` request header. Your controller doesn’t change:

```ruby
class MessagesController < ApplicationController
  def index
    render Views::Messages::Index.new(messages: Message.all)
  end
end
```

A request to `/messages` with the header `X-Fragments: unread-count` renders only that fragment.

### How the header is read

- The value is split on commas and whitespace around each name is removed. `X-Fragments: unread-count, messages` asks for both fragments.
- A missing or empty header means a normal, full render.
- Names that don’t match any fragment are ignored, as described [above](#names-that-aren-t-found). If nothing matches, the body is empty.
- The header is applied every time Rails renders a Phlex component: from a controller, from an ERB template or as a layout. Components rendered by another Phlex component are part of their parent’s render, so their fragments are found too.

### Turn off the layout

Rails still wraps the response in the controller’s layout. An ERB layout will be wrapped around your fragment. A [Phlex layout](/rails/layouts) reads the same header, finds nothing to render and leaves you with an empty response. Either way, you want fragment requests to skip the layout:

```ruby
class MessagesController < ApplicationController
  def index
    render Views::Messages::Index.new(messages: Message.all),
      layout: request.headers["X-Fragments"].blank?
  end
end
```

With this view:

```ruby
class Views::Messages::Index < Views::Base
  def initialize(messages:)
    @messages = messages
  end

  def view_template
    h1 { "Inbox" }

    fragment("unread-count") do
      span(id: "unread-count") { "#{@messages.size} unread" }
    end

    fragment("messages") do
      ul(id: "messages") do
        @messages.each do |message|
          li { message.subject }
        end
      end
    end
  end
end
```

a request with `X-Fragments: unread-count` gets this as the whole response body:

```html
<span id="unread-count">2 unread</span>
```

### Requesting a fragment with `fetch`

On the client, send the header and swap the response into the page.

```javascript
const response = await fetch("/messages", {
  headers: { "X-Fragments": "unread-count" },
})

document.querySelector("#unread-count").outerHTML = await response.text()
```

Any client that can set a request header works the same way.

If the response can be cached by a browser or a CDN, add `Vary: X-Fragments` to it, since the same URL now returns different bodies depending on the header.

### Turbo Frames

When Turbo loads a frame, it sends the frame’s id in a `Turbo-Frame` request header and only uses the matching `<turbo-frame>` from the response. If you name a fragment after the frame it wraps, you can copy one header to the other and render only the frame that was asked for.

```ruby
class ApplicationController < ActionController::Base
  before_action :render_turbo_frame_as_fragment

  private def render_turbo_frame_as_fragment
    if (frame = request.headers["Turbo-Frame"])
      request.headers["X-Fragments"] = frame
    end
  end
end
```

```ruby
class Views::Messages::Show < Views::Base
  include Phlex::Rails::Helpers::TurboFrameTag

  def initialize(message:)
    @message = message
  end

  def view_template
    h1 { @message.subject }

    fragment("message-body") do
      turbo_frame_tag("message-body") do
        p { @message.body }
      end
    end
  end
end
```

A frame request for `message-body` now receives only the frame, as long as the layout is turned off as shown above:

```html
<turbo-frame id="message-body">
  <p>Hi there</p>
</turbo-frame>
```

Only do this if every frame in your app has a fragment with the same name. A frame request for a name with no matching fragment gets an empty response.
