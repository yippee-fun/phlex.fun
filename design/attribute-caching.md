---
title: How Phlex caches HTML attributes
---

# Attribute Caching

The most expensive (performance-wise) process in Phlex is building attributes, where we turn a Ruby Hash into a String of valid HTML attributes.

Phlex supports [all kinds of attributes](/sgml/attributes) including deeply-nested hashes, arrays, sets, strings, symbols, boolean values and even custom objects. It even has special handling for the `style` attribute.

This page explains how the attribute cache is designed. It’s always on and there’s nothing to configure. It’s also separate from the [`cache`](/components/caching) method, which caches parts of your templates.

Attributes need to be calculated thousands of times per render. One advantage we have is attributes are always calculated the same way. The same attributes will always produce the same string of HTML.

This problem lends itself well to caching. If we store the result of the first calculation, we can then reuse it the next time we get the same set of attributes.

## Keying the cache

In order for the cache to work, we need to be able to look at a set of attributes and quickly determine if we’ve already calculated the HTML string for it. Ruby makes this pretty easy since Ruby hashes can be used as keys in other Hashes.

We can do something like this:

```ruby
CACHE[attributes_hash] ||= calculate_attributes(attributes_hash)
```

This works pretty well, but there’s actually a faster way. Ruby’s `Hash` objects have a `#hash` method that returns an `Integer` that is a digest of the contents of the hash. The same contents will always produce the same integer.

We can use this integer as the key in our cache which makes lookups much faster.

```ruby
CACHE[attributes_hash.hash] ||= calculate_attributes(attributes_hash)
```

There’s a catch though. The `#hash` method is not guaranteed to be unique. While it’s very, very unlikely, it is possible for two different hashes to produce the same integer. This is called a hash collision.

What we can do to avoid this is to store both the original attributes hash and the calculated HTML string in the cache keyed by this hash integer. Then, if we get a hit, we can compare the original attributes hash to the one we’re looking for to make sure they’re the same.

```ruby
key = attributes_hash.hash
cached = CACHE[key]

if cached && cached[0].eql?(attributes_hash)
  cached[1]
else
  CACHE[key] = [attributes_hash, calculate_attributes(attributes_hash)]
end
```

It’s a bit convoluted and it’s faster than using the Hash object as the key. But it still isn’t quite correct.

## When equal isn’t the same

`Hash#eql?` answers a slightly different question to the one we need to ask. Two Hashes can be equal and still render different HTML.

- **Order.** `{ a: "1", b: "2" }` and `{ b: "2", a: "1" }` are equal, but their attributes are output in a different order.
- **Safe values.** A String that has been marked as safe, such as an `html_safe` String in Rails, is equal to a regular String with the same content. So is an instance of any other String subclass. The attribute builder can treat these differently from a regular String.
- **Mutation.** If we keep the caller’s Hash and they change it later, or change a String inside it, the entry no longer describes what was cached.

A cache that confuses any of these could hand back HTML that was generated for different attributes. So instead of keeping the original Hash, Phlex takes a _snapshot_ of it: a frozen copy made of plain objects, with the keys and values of each Hash laid out in order.

A lookup is only a hit if the attributes match the snapshot exactly. Each value has to be in the same position and be exactly the same class, not a subclass. Strings also need the same encoding, and can’t be [safe objects](/sgml/raw#safe-objects).

```ruby
snapshot, html = CACHE[attributes_hash.hash]

if snapshot && matches?(snapshot, attributes_hash)
  html
else
  # generate the attributes, then store them with a new snapshot
end
```

Strings in the snapshot are interned, so a String literal in a file with `# frozen_string_literal: true` is the very same object as the one in the snapshot. Most comparisons are then an identity check, which is as cheap as it gets.

Two Hashes with the same pairs in a different order have the same `#hash`, so they compete for one slot. The first one to be rendered is cached, and the other is generated each time.

### What can be cached

A snapshot can only be made from values that are safe to copy and compare this way: plain Hashes, Arrays and Strings, Symbols, Integers, `true`, `false`, `nil` and values returned by [`safe`](/sgml/raw#safe).

If the attributes contain anything else, they aren’t cached at all. That includes Floats, Sets, Dates and Times, objects that respond to `to_h`, and instances of subclasses of String, Hash or Array, such as `ActiveSupport::SafeBuffer`. These attributes are generated on every render, which is always correct, only slower.

## Key eviction

So far we’ve been using a Hash for our cache store, but this has some problems. If you have any dynamic content in your attributes, a cache like this will grow indefinitely.

It’s actually pretty common, for example, to render something like JSON into a data attribute on a custom element. These attributes can be very large and they’re often unique for each render so there’s little benefit in caching them.

We need a way to set a limit on the size of the cache and start evicting keys when we reach the limit.

There are a few different approaches to key eviction:

- **Least Recently Used (LRU)** — with this approach, the first keys to be evicted are the ones that were least recently accessed or added to the cache.
- **Last In First Out (LIFO)** — with this approach, the first keys to be evicted are the ones that were added to the cache last.
- **First In First Out (FIFO)** — with this approach, the first keys to be evicted are the ones that were added to the cache first.

Naively, the LRU approach seems like the best one. It’s the most fair and it’s the one that’s most likely to keep the most useful keys in the cache. However the bookkeeping overhead to know which keys have been accessed most recently, also makes it slower to access.

If you think about it, with an LRU cache, you need to keep track of the order in which keys were accessed. That means every read also requires a write, which is more expensive. In order to avoid contention, you would also need to use a `Mutex` to make sure only one thread is accessing the cache at a time.

In contrast, LIFO and FIFO caches are much simpler, especially as Ruby’s `Hash` class maintains insertion order.

Phlex uses a FIFO cache. When the cache reaches a certain size, it will evict the oldest keys first. This is a simple and fast approach that works well for our use case.

## Sizing

Since attributes come in all different shapes and sizes, Phlex’ FIFO cache keeps track of how many bytes are stored in the cache. When the cache goes over its maximum size, the oldest keys are evicted until it fits again.

The snapshot is stored alongside the HTML, so it’s counted too. Otherwise a large input that renders to very little, such as an Array of a thousand `nil`s, would hold on to memory the cache couldn’t see. Each entry costs the bytes of its HTML, plus 8 bytes for every key and value in the snapshot, plus the bytes of each String in it.

For example, `div(class: "a")` generates ` class="a"`, which is 10 bytes. Its snapshot holds a Hash, a Symbol and a one-byte String, which is 25 bytes. The entry costs 35 bytes.

We also set a maximum size for a single entry. If the HTML and its snapshot together cost more than 2,000 bytes, the attributes aren’t cached at all. Phlex stops building the snapshot as soon as it goes over, so it doesn’t waste time copying a huge input. Larger attributes are more likely to be unique (e.g. JSON data) and caching them is less helpful.

But how do we determine the size of the cache itself? Ideally, it would be just large enough to hold all the static, reused attributes but not waste any space on dynamic attributes that will probably only be used just once.

This is a very tricky problem and one that we haven’t entirely solved, however we do have an approach that works pretty well.

The cache starts with room for 2,000 bytes. Then, each time a file defines a component with a `view_template` method, the cache is expanded by the size of that file. Each file is only counted once, and only real files count, so components defined with `eval` don’t expand the cache.

That makes the total file size of your components, plus the initial 2,000 bytes, the upper bound for the cache size. This is probably a bit much — it’s very unlikely the entire file was made up of attributes. But remember we’re talking kilobytes here. It’s a pretty good approximation that has a fixed limit and expands predictably with your app.

## Avoiding race conditions

The Phlex attribute cache is global, which allows for maximum reuse of calculated attributes. However, this also means that it’s shared between all threads in your application.

Inside the FIFO cache, we use a `Monitor` to make sure only one thread is writing to the cache or modifying its size at a time. Reads don’t take the lock.

Because we can expire keys we also need to be careful to not do something like this:

```ruby
if CACHE[key]
  do_something_with(CACHE[key])
end
```

Another thread could evict the key between the first read and the second, so the second read might return `nil`. Instead, Phlex reads from the cache once and falls back to generating the attributes if it gets nothing back. Entries are frozen and never modified, so a reader sees a whole entry or nothing.

```ruby
buffer << (CACHE[attributes] ||= generate_attributes(attributes))
```

Writes never replace an existing entry. If two threads generate the same attributes at the same time, the first one to take the lock stores its result and the second write is ignored. Both threads still use the String they generated, which is identical either way.
