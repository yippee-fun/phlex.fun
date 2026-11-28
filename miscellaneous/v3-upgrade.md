---
title: Upgrading to Phlex v3
---

# Upgrading to Phlex v3

Phlex v3 brings a compiler that turns your components into faster Ruby, plus a handful of breaking changes. Most apps need only a few small edits, but one of them, content blocks passed to `new`, fails silently, so it’s worth working through this guide in order.

This guide covers `phlex` 3.0.0.beta1 and `phlex-rails` 3.0.0.beta1. The full lists are in the [phlex release notes](https://github.com/yippee-fun/phlex/releases/tag/3.0.0.beta1) and the [phlex-rails release notes](https://github.com/yippee-fun/phlex-rails/releases/tag/3.0.0.beta1).

If you’d rather hand the upgrade to an AI agent, skip to the [prompt at the end](#ai-agent-prompt).

## Before you start

Upgrade to the latest 2.4 release first, run your tests, and deploy it. Then move to v3. Each step has its own kind of change, and doing them one at a time makes any difference in output easy to trace.

### Coming from 2.4.1 or earlier

[2.4.2](https://github.com/yippee-fun/phlex/releases/tag/2.4.2) fixed four security issues, and the fixes change some output. If you jump straight from 2.4.1 or earlier to v3, these arrive at the same time as the v3 changes.

- **`<` and `>` are escaped in attribute values**, as `&lt;` and `&gt;`, as well as `"` ([GHSA-6gjg-cqh9-p2xm](https://github.com/yippee-fun/phlex/security/advisories/GHSA-6gjg-cqh9-p2xm)). The browser reads the same value, but tests that compare exact HTML will fail. A typical case is a `data-` attribute that holds an HTML snippet for JavaScript to copy or insert.
- **`tag` refuses `script`, `style` and `base`** in HTML, and `script` and `style` in SVG, by raising `Phlex::ArgumentError` ([GHSA-4859-2mvh-r787](https://github.com/yippee-fun/phlex/security/advisories/GHSA-4859-2mvh-r787)). Call the element method directly instead, e.g. `script { … }`. Search for `tag(` calls whose name isn’t a literal.
- **`data` on `object` is checked as a URL** when it isn’t a Hash, so a `javascript:` URL is dropped ([GHSA-fxxw-9rf3-3f2w](https://github.com/yippee-fun/phlex/security/advisories/GHSA-fxxw-9rf3-3f2w)). A Hash still expands into `data-*` attributes.
- **The attribute cache counts its keys against its budget**, so large inputs that render to little output are no longer kept alive ([GHSA-jjpx-qcfc-pqwp](https://github.com/yippee-fun/phlex/security/advisories/GHSA-jjpx-qcfc-pqwp)). Nothing to change in your code.

### Coming from 2.4.2 or earlier

[2.4.3](https://github.com/yippee-fun/phlex/releases/tag/2.4.3) has one behaviour change: `Phlex::CSV` raises `Phlex::RuntimeError` when a row has a different number of columns from the first row. Previously it wrote a malformed row.

The usual cause is a column set generated per associated record, so the number of columns depends on the record:

```ruby
def row_template(user)
  column("name") { user.name }

  user.accounts.each.with_index(1) do |account, i| # [!code --]
    column("account_#{i}_balance") { account.balance } # [!code --]
  end # [!code --]
  AccountType.order(:position).each.with_index(1) do |type, i| # [!code ++]
    account = user.accounts.find { |a| a.account_type_id == type.id } # [!code ++]
    column("account_#{i}_balance") { account&.balance } # [!code ++]
  end # [!code ++]
end
```

Build the columns from a fixed, ordered list, and leave a cell blank when a record has nothing for it. As well as avoiding the error, this means `account_1` refers to the same thing on every row. Search your CSV classes for `each` or `if` inside `row_template`.

## Requirements <Badge type="danger" text="breaking" />

- Ruby 3.3 or later.
- `phlex-rails` needs Rails 8.0 or later.
- Phlex now depends on `refract ~> 2.0.0`, `erb >= 5.0.2` and `rake`. On CRuby 4.0 or later it also builds an optional C extension for attributes when installed. Where it can’t be built, installation carries on and Phlex uses Ruby. Set `PHLEX_NATIVE=false` at install time to skip it.

In a Rails app, `phlex-rails` brings in the matching `phlex`:

```ruby
gem "phlex-rails", "~> 2.4" # [!code --]
gem "phlex-rails", "3.0.0.beta1" # [!code ++]
```

## `new` no longer takes a content block <Badge type="danger" text="breaking" />

This is the change most likely to bite, because it doesn’t raise. In v2, Phlex overrode `new` to keep a block given to it and render it as the component’s content. In v3, `new` is plain Ruby again so it can be inlined ([#1104](https://github.com/yippee-fun/phlex/pull/1104)). A block passed to `new` goes to `initialize`, which ignores it, and the component renders without its content.

```ruby
render Card.new(title: "Hi") { p { "Body" } } # [!code --]
render(Card.new(title: "Hi")) { p { "Body" } } # [!code ++]
```

On v3 the first line renders `Card` without its body, with no error and no warning. Ruby’s `Warning[:strict_unused_block]` doesn’t catch it either, and tests that only check a component rendered something still pass.

Whether you’re affected depends on which way the block binds:

- `{ }` binds to the nearest call, so in `render Card.new { … }` it goes to `new`. **Broken.**
- `do … end` binds to the outermost call, so in `render Card.new do … end` it goes to `render`. **Fine.**
- With parentheses, `render(Card.new) { … }` and `render(Card.new) do … end` both pass the block to `render`. **Fine.**
- Building a component with a block and rendering it later, e.g. `card = Card.new { … }` or `render(Card.new do … end)`. **Broken.**

The fixes, any of which work:

```ruby
render(Card.new(title: "Hi")) { "Body" }     # pass the block to render
render Card.with_content(title: "Hi") { "Body" } # keep the block on the component
card = Card.new(title: "Hi").with_content { "Body" }
Card(title: "Hi") { "Body" }                 # Kit calls are unchanged
```

`render(Component.new) { … }` also works in v2, so you can make this change before upgrading.

### Finding them

A text search isn’t enough: calls that span several lines, and the difference between `{ }` and `do … end`, are easy to miss with a regex. Parse the code with [Prism](https://ruby.github.io/prism/) instead, and keep only receivers that are Phlex components, since `Struct.new { }`, `Class.new { }` and many library constructors take blocks legitimately.

Run this with your app loaded, e.g. as a test, so the constants resolve. This version is an RSpec spec for a Rails app; adjust the paths and the root for your project.

```ruby
# spec/phlex_content_block_spec.rb
require "rails_helper"

RSpec.describe "Phlex content blocks" do
  # Collects `Constant.new(...) { }` and `Constant.new(...) do end` calls where the block belongs to `new`.
  finder = Class.new(Prism::Visitor) do
    attr_reader :calls

    def initialize
      @calls = []
      super
    end

    def visit_call_node(node)
      if node.name == :new && node.block.is_a?(Prism::BlockNode) &&
          (node.receiver in Prism::ConstantReadNode | Prism::ConstantPathNode)
        @calls << node
      end

      super
    end
  end

  it "never passes a content block to a component's new" do
    offenders = Dir[Rails.root.join("{app,lib,spec,test}/**/*.rb")].flat_map do |path|
      visitor = finder.new
      Prism.parse_file(path).value.accept(visitor)

      visitor.calls.filter_map do |node|
        klass = node.receiver.slice.safe_constantize
        "#{path}:#{node.location.start_line}" if klass.is_a?(Class) && klass < Phlex::SGML
      end
    end

    expect(offenders).to be_empty, "Pass the block to render instead:\n#{offenders.join("\n")}"
  end
end
```

`node.block` is only set when the block belongs to `new`, so `render Card.new do … end` isn’t reported. `safe_constantize` resolves names from the top level, so a relative name like `Card` written inside `module Components` won’t resolve unless `::Card` also exists. If your components are referred to by relative names, also print the receivers that don’t resolve and check those by hand. Calls on a variable, like `component_class.new { … }`, aren’t covered either; search for them separately.

Keep the spec after the upgrade. Code written the v2 way will keep arriving from older branches, examples and habit, and without a check it renders empty.

## New public methods that your components may override

Phlex v3 adds two instance methods that a component may already define for its own purposes:

- `with_content(&block)` stores a content block on the component.
- `parent` returns the component that rendered this one, or `nil`.

Phlex doesn’t call either of them while rendering, so an override won’t break rendering. It does change what those names mean for that component. For example, `Popover.with_content { … }` would call a slot-style `with_content` defined on `Popover` and get back whatever it returns. Search for `def with_content`, `def parent` and properties named `parent`, and rename them, e.g. to `with_body`.

## Other breaking changes

Each of these raises rather than failing silently, so your tests will find any you missed. The search patterns help you find them first.

### `Phlex::CSV` deprecations removed <Badge type="danger" text="breaking" />

A custom `yielder` now raises. Rename it to `around_row` and change `yield` to `super`:

```ruby
def yielder(record) # [!code --]
def around_row(record) # [!code ++]
  I18n.with_locale(record.locale) do
    yield # [!code --]
    super # [!code ++]
  end
end
```

A CSV that defines only `view_template` no longer uses it as the row template. Rename it to `row_template`. Search for `yielder` and for `Phlex::CSV` subclasses without a `row_template`.

### `plain` raises when given a block <Badge type="danger" text="breaking" />

It used to ignore the block. Search for `plain` followed by `{` or `do`, and move the block’s content out.

### Rendering a class that isn’t a component raises <Badge type="danger" text="breaking" />

`render SomeClass` used to render nothing when `SomeClass` wasn’t a component. It now raises `Phlex::ArgumentError`.

### Custom element names must start with a lowercase letter <Badge type="danger" text="breaking" />

As the HTML spec requires. Check your `register_element` calls.

### Empty attribute names raise <Badge type="danger" text="breaking" />

For example from splatting a Hash with a `""` key, `div(**attributes)`. Check anywhere you build attribute Hashes from data.

### Nested fragments with the same name raise <Badge type="danger" text="breaking" />

A fragment that starts inside an open fragment of the same name raises `Phlex::ArgumentError`. Sibling fragments can still share a name. Search for `fragment(` and check nested ones.

### `FIFOCacheStore` uses Marshal and returns frozen values <Badge type="danger" text="breaking" />

Values are stored with Marshal instead of JSON, and hits on plain data return a frozen copy. Code that mutates a value from the cache gets a `FrozenError`; `dup` it first. This only applies if you use `Phlex::FIFOCacheStore` as your cache store. Rails apps usually use `Rails.cache`.

### `helpers` is removed <Badge type="danger" text="Rails" /><Badge type="danger" text="breaking" />

It was deprecated in `phlex-rails` v2 and now raises `NoMethodError`, with a message that says what to use. Use a [helper adapter](/rails/helpers), or `view_context` if you really need the view context. Search your components for `helpers.`, and leave alone controllers and non-Phlex view components, which have their own `helpers`.

```ruby
p { helpers.number_to_currency(@price) } # [!code --]
p { number_to_currency(@price) } # [!code ++]
```

The second form needs `include Phlex::Rails::Helpers::NumberToCurrency` in the component.

## The compiler

The compiler is on by default. It rewrites your templates into plain Ruby string appends the first time a component renders. A compiled component renders byte for byte what it would have uncompiled. Where the compiler can’t reproduce some code exactly, it leaves that code alone and the component renders as before.

`phlex-rails` sets this up for you. It compiles your components at boot once eager loading finishes, before Puma forks, and compiles components in development as Zeitwerk loads them.

Rendering is faster, especially for deeply nested components. Boot is slower when you eager load, as production and CI usually do, because that’s when components compile. Measure both on your own app.

### Seeing what it does

```sh
bin/rails phlex:compiler:explain
bin/rails 'phlex:compiler:source[Components::Card]'
```

`explain` lists what the compiler leaves to the runtime in your app’s files, and which classes say `compile false`. Lines such as “plain keeps its call because its argument isn’t a literal or an interpolation” only cost speed; you don’t need to change them. `source` prints the Ruby a component compiles to. Outside Rails, use `Phlex::Compiler.explain(component)` and `Phlex::Compiler.source(component)`.

### Turning it off

While v3 is in beta, it’s useful to know how to switch the compiler off if a component renders differently:

```ruby
# config/application.rb, or an environment file
config.phlex.compile = false
```

To opt out a single class and its subclasses, add `compile false` to it. A gem can opt its own components out without affecting the app. Outside Rails, `Phlex::Compiler.disable!` turns it off everywhere.

### Things that stop a component compiling

When a component can’t be compiled, Phlex calls a failure handler and the component renders uncompiled. These are the cases you’re most likely to hit in an app:

- **A `using` that applies to only part of a file**, such as `using SomeRefinement` inside a class body. Move it to the top of the file. The refinement still applies only to that file.

  ```ruby
  using TimeRefinements # [!code ++]

  class Components::Schedule < Components::Base
    using TimeRefinements # [!code --]
  end
  ```

- **A file edited since it was loaded.** The compiler refuses rather than compiling stale source. Reloading in development takes care of this.

Methods from mixins aren’t compiled yet either, but that isn’t a failure: they run as before and only miss the speed-up.

### Reporting compile failures

The default failure handler only writes a warning to standard error, so a component that falls back to rendering uncompiled in production can go unnoticed. Send failures to your error tracker as well:

```ruby
# config/initializers/phlex.rb
Rails.application.config.phlex.on_compile_failure = lambda do |component, error|
  Phlex::Compiler::DEFAULT_FAILURE_HANDLER.call(component, error)

  # Honeybadger
  Honeybadger.notify(error, context: { component: component.name }, fingerprint: "phlex-compile-failure-#{component.name}")
  # or Sentry
  # Sentry.capture_exception(error, extra: { component: component.name }, fingerprint: ["phlex-compile-failure", component.name])
end
```

Initializers run before `phlex-rails` enables the compiler, so setting the handler here takes effect at boot.

### Requiring files that Zeitwerk manages <Badge type="danger" text="Rails" />

In 3.0.0.beta1, calling `require` on a file that Zeitwerk manages, after boot, can raise `NameError` from the compile hook and leave the namespace it opens undefined ([phlex-rails#357](https://github.com/yippee-fun/phlex-rails/issues/357)). Apps with `config.autoload_lib` are the most likely to hit it, through a `require` of something under `lib/`. Remove the `require` and let Zeitwerk load the constant. Search for `require` and `require_relative` calls that point inside your autoload paths.

## Checking the output

Your tests are the first check, but tests that check a component rendered something won’t notice it rendering less. Two more checks are worth doing.

**Compare rendered HTML before and after.** Render the same components with the same data on v2 and v3 and diff the output. Your test suite already does the rendering. Check out the old version in a second worktree, load a small file into both test runs, and run the same specs with the same seed:

```ruby
# capture.rb: bin/rspec --require rails_helper --require ./capture.rb --seed 1234
require "json"
require "zlib"

module Capture
  OUT = File.open(ENV.fetch("CAPTURE_OUT"), "w")

  class << self
    attr_accessor :key, :seq, :rng
  end

  # Records each top-level render. Nested components render through
  # `internal_call` in 2.4 and 3.0, so they're part of their parent's output.
  module Render
    def call(*, **, &)
      html = super
      Capture::OUT.puts({key: Capture.key, seq: Capture.seq += 1, html: html.to_s}.to_json) if Capture.key
      html
    end
  end

  # The same generated IDs, nonces and tokens on both runs.
  module Random
    def gen_random(n) = Capture.rng ? Capture.rng.bytes(n) : super
    def bytes(n) = gen_random(n)
    def random_bytes(n = nil) = gen_random(n || 16)
  end
end

RSpec.configure do |config|
  config.before(:suite) do
    Phlex::SGML.prepend(Capture::Render)
    SecureRandom.singleton_class.prepend(Capture::Random)
  end

  config.around do |example|
    Capture.key = example.id
    Capture.seq = 0
    Capture.rng = ::Random.new(Zlib.crc32(example.id))
    example.run
  ensure
    Capture.key = nil
  end
end
```

Pair the two files' lines by `key` and `seq` and compare the HTML. Hook `Phlex::SGML#call`, not `render_in`: `phlex-rails` defines `render_in` in a module that comes before `Phlex::SGML` in the method lookup and doesn’t call `super`, so a hook there never runs. Leave out spec files that differ between the two branches, because extra examples shift database IDs. Anything time-based, such as the timestamp half of a ULID, still differs between runs, so normalise it before comparing. To check what users see as well, screenshot both versions of each render in a headless browser with the same stylesheet, JavaScript off and animations disabled, and compare the pixels.

These differences are expected and correct:

- `<` and `>` escaped in attribute values (from 2.4.2).
- No leading space for `class: [nil, "link"]` (from 2.4.3).
- `false` skipped in `class:` and `style:` collections, so `cond && "token"` works.
- Empty `style` entries skipped, and an empty `style` attribute left out.
- No leading separator for empty tokens, e.g. in `srcset`.
- `Date`, `Time` and `to_h` values now work in nested attributes like `data:`.
- With `phlex-rails`, `raw(safe(…))`, a block that returns `safe(…)`, and output helpers like `csrf_meta_tags` now appear where they were lost before. A block’s return value is no longer added as output after the block wrote something.

Anything else, especially content that’s missing, is worth looking at. Missing content usually means a block passed to `new`.

**Compare compiled and uncompiled output.** Run the same comparison on v3 with `config.phlex.compile = false` and with the compiler on. The output should be identical. If it isn’t, that’s a compiler bug; please [report it](https://github.com/yippee-fun/phlex/issues) with the component.

## AI agent prompt

Copy this prompt into your coding agent to have it do the upgrade. It asks the agent to check each finding rather than rewrite in bulk, because several of the patterns have false positives.

```text
Upgrade this app from Phlex 2 to Phlex 3 (phlex 3.0.0.beta1, phlex-rails 3.0.0.beta1).
Follow https://www.phlex.fun/miscellaneous/v3-upgrade. Read the whole guide before starting.

Work on a branch. For every search below, read each hit and decide for yourself whether it
needs a change; do not rewrite matches in bulk. Keep a list of what you changed and why.

1. If the app is on phlex < 2.4.3, note that the 2.4.2 and 2.4.3 changes arrive too:
   attribute values now escape < and >, `tag` refuses script/style/base, and Phlex::CSV
   raises on rows with a different column count. Check `tag(` calls with non-literal names,
   and Phlex::CSV `row_template` methods that add columns inside `each` or `if`. Make those
   build columns from a fixed, ordered list, blank when a record has nothing.
2. Check Ruby >= 3.3 and, for phlex-rails, Rails >= 8.0. Bump the gems and bundle.
3. Content blocks passed to `new` now render nothing, silently. Add the Prism guard spec from
   the guide (adjust paths and the test framework to this app), run it, and fix each hit with
   `render(X.new(...)) { ... }` or `X.with_content(...) { ... }`. `render X.new(...) do ... end`
   is fine. Also search for `.new` with a block on variable receivers and on relative constant
   names the spec can't resolve, and check those by hand. Keep the spec.
4. Search for components that define `with_content` or `parent` (methods or properties) and
   rename them.
5. Check each breaking change in the guide: `yielder` in CSVs (rename to `around_row`,
   `yield` -> `super`), CSVs with only `view_template`, `plain` with a block, `render` of a
   class that isn't a component, `register_element` names, empty attribute names, nested
   fragments with the same name, mutating values from FIFOCacheStore, and `helpers.` inside
   Phlex components (use helper adapters; leave controllers and non-Phlex components alone).
6. Move any `using` inside a component's class body to the top of its file. Remove `require`s
   of files that Zeitwerk autoloads (phlex-rails#357).
7. Boot the app with eager loading (e.g. `CI=true RAILS_ENV=test bin/rails zeitwerk:check`) and
   make sure there are no "Phlex::Compiler couldn't compile" warnings. Run
   `bin/rails phlex:compiler:explain` and report anything other than speed-only fallbacks.
8. Set `config.phlex.on_compile_failure` to call Phlex::Compiler::DEFAULT_FAILURE_HANDLER and
   report to the app's error tracker, as in the guide.
9. Run the full test suite. Then render a representative set of components and pages on the old
   and new versions and diff the HTML. Explain every difference: it should be one of the
   expected changes listed in the guide. Treat any missing content as a bug to fix.
10. Summarise what you changed, what you checked and found nothing for, and anything left to
    decide, such as whether to keep the compiler on during the beta.
```
