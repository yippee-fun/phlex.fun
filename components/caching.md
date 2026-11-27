---
title: Fragment caching in Phlex Components
---

# Caching

`cache` stores the HTML produced by part of a template so that the next render can reuse it instead of running the block again. Use it for parts of a page that are expensive to render and change rarely.

Phlex doesn’t pick a cache store for you. Before you can use `cache`, you need to [configure one](#configuring-a-cache-store).

::: tip
This page is about caching parts of your templates. Phlex also has an internal cache for HTML attributes, which is always on and needs no configuration. You can read about it in [Attribute caching](/design/attribute-caching).
:::

## Caching part of a template

Wrap part of a template in `cache`.

```ruby
require "json" # for Phlex::FIFOCacheStore

CACHE = Phlex::FIFOCacheStore.new

class Components::Base < Phlex::HTML
  def cache_store = CACHE
end

class Components::Greeting < Components::Base
  def initialize(name)
    @name = name
  end

  def view_template
    cache(@name) do
      h1 { "Hello, #{@name}!" }
      p { "Rendered at #{Time.now.strftime('%H:%M:%S')}" }
    end
  end
end
```

The first render runs the block and stores the result.

```ruby
Components::Greeting.new("Joel").call
```

```html
<h1>Hello, Joel!</h1>
<p>Rendered at 10:15:00</p>
```

A second render a few seconds later returns the stored HTML, old timestamp included. The block isn’t called at all.

```html
<h1>Hello, Joel!</h1>
<p>Rendered at 10:15:00</p>
```

Rendering with a different name is a different cache key, so the block runs again.

```ruby
Components::Greeting.new("Jill").call
```

```html
<h1>Hello, Jill!</h1>
<p>Rendered at 10:15:07</p>
```

## Cache keys

The positional arguments you pass to `cache` are your cache keys. They should be whatever the content of the block depends on.

```ruby
cache(@user, @article) do
  h1 { @article.title }
end
```

Phlex adds a few keys of its own in front of yours. The full key passed to the store is an Array of:

1. The app version key, `Phlex::DEPLOYED_AT` by default. See [below](#the-app-version-key).
2. The name of the component class, so different components don’t collide.
3. The class’ `object_id` when [cache reloading](#reloading-the-cache-during-development) is enabled, otherwise `nil`.
4. The name of the method that called `cache`, so different methods in the same class don’t collide.
5. The line number `cache` was called on, so different `cache` calls in the same method don’t collide.
6. An Array of the keys you passed.

For example, this call in a class named `Components::Card`

```ruby
cache(:a, 1) do
  # ...
end
```

fetches this key from the store:

```ruby
[895222741, "Components::Card", nil, "view_template", 14, [:a, 1]]
```

Because of the class, method and line, you can call `cache` with no keys at all when the content depends on nothing else.

```ruby
cache do
  footer { "© Acme Ltd" }
end
```

::: warning
The class, method and line are the same for every pass through a loop, so they can’t tell one iteration from another. Inside a loop, always pass something that identifies the item.

```ruby
@products.each do |product|
  cache(product) do
    h2 { product.name }
  end
end
```
:::

### The app version key

A cached block must be thrown away when the template that produced it changes. To do this, the first part of every key is the value of `app_version_key`, which returns `Phlex::DEPLOYED_AT` by default.

`Phlex::DEPLOYED_AT` is a reading of the process’ monotonic clock, in milliseconds, taken when Phlex is loaded. It’s different each time your app boots, so everything cached with it is effectively invalidated on every restart.

That’s what you want for an in-memory store, which is empty after a restart anyway. It’s not what you want for a store shared between processes or servers, such as Redis, Memcached or a database. Each process that loads Phlex separately gets its own value, so they can’t read each other’s entries, and every restart leaves the old entries behind to expire.

If you use a shared store, override `app_version_key` to return something that’s the same in every process and changes when you deploy, such as a Git revision.

```ruby
class Components::Base < Phlex::HTML
  private def app_version_key
    ENV.fetch("APP_REVISION")
  end
end
```

## Low-level caching

`low_level_cache` is `cache` without the keys Phlex adds. You give it one cache key, which is passed to the store as is. It’s up to you to make sure the key is unique and that it changes when the content should.

```ruby
low_level_cache([Commonmarker::VERSION, Digest::MD5.hexdigest(@content)]) do
  markdown(@content)
end
```

It takes a single key rather than a list, but that key can be an Array.

## Store options

Keyword arguments to `cache` and `low_level_cache` are passed on to the store’s `fetch` method. Which options exist depends on the store.

A [Rails cache store](#expiry) understands options such as `expires_in`. `Phlex::FIFOCacheStore` takes no options at all, and passing one raises an `ArgumentError`.

## Configuring a cache store

Define a `cache_store` method that returns the store, usually in a base component so that everything inherits it.

```ruby
class Components::Base < Phlex::HTML
  CACHE = Phlex::FIFOCacheStore.new

  def cache_store
    CACHE
  end
end
```

If you call `cache` in a component with no `cache_store`, Phlex raises a `RuntimeError` with the message `Cache store not implemented.`

### `Phlex::FIFOCacheStore`

Phlex comes with one store, `Phlex::FIFOCacheStore`. It keeps entries in memory in the current process and, once it’s full, evicts the oldest entries first.

::: warning
In Phlex 2.4, the store uses `JSON` without requiring it, and calls `JSON.fast_generate`, which `json` 3.0 removed. Outside Rails, add `require "json"` before the first render. Either way, keep the `json` gem below 3.0 with `gem "json", "< 3"` in your Gemfile.
:::

```ruby
CACHE = Phlex::FIFOCacheStore.new(
  max_bytesize: 20_000_000 # 20MB
)
```

- `max_bytesize` is the total size of the stored values. It defaults to `2 ** 20` bytes (1 MiB). A single entry larger than this isn’t stored.
- `clear` empties the store.
- Entries never expire. They stay until they’re evicted to make room, or the process exits. There’s no `expires_in`.

Keep the store in a constant or somewhere else that outlives the component. If you create it inside the `cache_store` method, you get a new, empty store every time and nothing is ever cached.

The store accepts these as cache keys:

1. `String`, `Symbol`, `Integer`, `Float`, `Time`, `true`, `false` and `nil`
2. Objects that respond to `cache_key_with_version` or `cache_key`
3. `Array` and `Hash` collections of the above

Anything else raises an `ArgumentError`, for example `Invalid cache key: Date`.

### Writing your own store

A cache store is any object with a `fetch` method that takes a key, optional keyword arguments and a block.

```ruby
class MyCacheStore
  def initialize
    @entries = {}
  end

  def fetch(key, **options)
    @entries[key] ||= yield
  end
end
```

`fetch` must return either the result of yielding the block, or the result of a previous yield for the same key.

- The **key** is the Array [described above](#cache-keys) when you use `cache`, or exactly what you passed when you use `low_level_cache`.
- The **options** are the keyword arguments passed to `cache` or `low_level_cache`.
- The **value** returned by the block is not a plain String. It’s a two-element Array: the HTML String, followed by a Hash that maps the name of each [fragment](/components/fragments#fragments-and-caching) in the block to its position in that String.

```ruby
["<p>x</p><i>y</i>", { "f" => [8, 8, []] }]
```

Each entry in the Hash is the fragment’s byte offset, its byte length and the names of the fragments nested inside it.

Your store must return this value in the same shape. If you serialize it, the Arrays, the Hash and the Integers have to survive the round trip. `Phlex::FIFOCacheStore` serializes to JSON, which is why fragment names should be Strings.

## Using the Rails cache <Badge type="danger" text="Rails" />

A Rails cache store has the `fetch` method Phlex needs, so you can return `Rails.cache` from `cache_store`.

The install generator does this for you, but only in `Views::Base`:

```ruby
class Views::Base < Components::Base
  def cache_store = Rails.cache
end
```

`phlex-rails` doesn’t set a store anywhere else. If you want to use `cache` in components that inherit from `Components::Base` rather than `Views::Base`, move this method to `Components::Base`.

### Keys

Rails turns the key Array into a String, calling `cache_key` and `cache_version` on objects that have them. That means you can pass ActiveRecord models as keys, and the entry is replaced when the record is updated.

```ruby
cache(@article) do
  h1 { @article.title }
end
```

Rails cache stores are usually shared between processes, so remember to override [`app_version_key`](#the-app-version-key).

### Expiry

Keyword arguments are passed to `Rails.cache.fetch`, so you can use any option your Rails cache store supports.

```ruby
cache(@article, expires_in: 12.hours) do
  h1 { @article.title }
end
```

### Caching is skipped unless `perform_caching` is on <Badge type="info" text="2.1.3+" />

`cache` and `low_level_cache` only use the store when your app sets `config.action_controller.perform_caching` to `true`. Otherwise the block is rendered every time and the store is never touched.

A new Rails app sets it to `true` in production. In development it’s `false` until you run `bin/rails dev:cache`. If an environment doesn’t set it at all, Phlex treats that as off.

## Reloading the cache during development

Phlex has an `enable_cache_reloading?` method that returns `false` by default. When it returns `true`, `cache` includes the class’ `object_id` in the key. If your code reloader replaces the class with a new one when you edit it, as Zeitwerk does, the new class has a new `object_id` and its old cache entries are no longer used.

```ruby
class Components::Base < Phlex::HTML
  private def enable_cache_reloading?
    ENV["RACK_ENV"] == "development"
  end
end
```

`phlex-rails` overrides `enable_cache_reloading?` to return `true` when the Rails environment is `development`.

`low_level_cache` isn’t affected by this, since Phlex adds nothing to its key.
