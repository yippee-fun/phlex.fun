---
title: Streaming Phlex components
---

# Streaming

Streaming means sending the first part of a page to the browser before the rest has been rendered. Phlex supports it with two things: you can give `call` your own output buffer, and a component can `flush` what it has rendered so far into that buffer.

## Passing a buffer to `call`

`call` takes an optional buffer as its first argument. It can be any object that responds to `<<`. Phlex appends the output to it with `<<`, and `call` returns the result of the last `<<`. For a String or an Array, that’s the buffer.

```ruby
class Hello < Phlex::HTML
  def view_template
    h1 { "Hello" }
  end
end

buffer = []
Hello.new.call(buffer)
buffer # => ["<h1>Hello</h1>"]
```

While rendering, Phlex writes to an internal String. The contents of that String are moved to your buffer when the component flushes and once more when rendering finishes. Each of those is one `<<` call, which is one chunk of the response.

## Flushing

Call `flush` in a template to send everything rendered so far to the buffer.

```ruby
class Report < Phlex::HTML
  def view_template
    doctype

    html do
      head { title { "Report" } }

      body do
        h1 { "Report" }
        flush

        3.times do |i|
          section { "Part #{i + 1}" }
          flush
        end

        footer { "Done" }
      end
    end
  end
end

chunks = []
Report.new.call(chunks)
```

`chunks` is now an Array of six Strings:

```ruby
[
  "<!doctype html><html><head><title>Report</title></head>",
  "<body><h1>Report</h1>",
  "<section>Part 1</section>",
  "<section>Part 2</section>",
  "<section>Part 3</section>",
  "<footer>Done</footer></body></html>",
]
```

You can call `flush` from any component in the tree. Nested components share the buffer of the component that was called from the outside.

### Automatic flushing

Phlex flushes on its own in exactly one place: straight after the closing `</head>` tag. That’s the first chunk above, and there’s no `flush` in the template before it. It’s the `head` method that does this, so a head rendered with `tag(:head)` isn’t flushed.

This lets the browser start downloading your stylesheets and scripts while the body is still being rendered. Everything after `</head>` arrives as one chunk unless you call `flush` yourself.

### When `flush` does nothing

`flush` is ignored inside a [`capture`](/components/yielding) block, since captured output is being collected into a String rather than sent to the buffer. The same goes for anything built on capturing, including [`cache`](/components/caching) blocks.

If you didn’t pass a buffer, flushing is harmless. The chunks are appended to the String that `call` returns.

## Streaming a Rack response

A Rack response body is anything that responds to `each` and yields Strings. An `Enumerator` gives you that, and its yielder responds to `<<`, so you can pass it to `call` as the buffer.

```ruby
# config.ru
require "phlex"

class Report < Phlex::HTML
  def view_template
    doctype

    html do
      head { title { "Report" } }

      body do
        3.times do |i|
          sleep 1 # something slow
          section { "Part #{i + 1}" }
          flush
        end
      end
    end
  end
end

run ->(env) {
  body = Enumerator.new do |yielder|
    Report.new.call(yielder)
  end

  [200, { "content-type" => "text/html" }, body]
}
```

Nothing is rendered until the server starts iterating over the body. Each `flush` then hands one chunk to the server, which can write it to the socket before the component continues. Run under Puma, this example sends the `<head>` immediately and a section follows each second.

Whether the chunks reach the browser as they’re produced depends on everything between your app and the browser. Any middleware, server or proxy that buffers the response will hold it until it’s complete.

## Streaming from Rails <Badge type="danger" text="Rails" />

`phlex-rails` doesn’t include a streaming helper. `Phlex::Rails::Streaming` and the controller `stream` method were removed in `phlex-rails` 2.4.0.

When you `render` a Phlex component from a controller or a view, Rails captures its output as a single String, so `flush` and the automatic flush after `</head>` have no effect on how the response is sent.

You can still stream by skipping `render` and setting the response body to an `Enumerator`, as in the Rack example.

```ruby
class ReportsController < ApplicationController
  def show
    report = Views::Reports::Show.new

    headers["Content-Type"] = "text/html; charset=utf-8"

    self.response_body = Enumerator.new do |yielder|
      report.call(yielder)
    end
  end
end
```

This goes around Rails’ rendering entirely, which limits what the component can do:

- There’s no layout. The component has to render the whole document.
- There’s no view context, so [Rails helpers](/rails/helpers) can’t be used in the component or anything it renders.

## Is it worth it?

Usually not. Rendering a Phlex component is fast, so there’s little to gain from sending the first half of a page a few milliseconds before the second.

Streaming helps when a template spends a noticeable amount of time waiting, for example on slow queries or network calls made while rendering, and you’d like the browser to have the `<head>` and the top of the page in the meantime. It also has costs: once the first chunk has been sent, you can’t change the status code or headers, redirect, or show an error page if something raises further down.
