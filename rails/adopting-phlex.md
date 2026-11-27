---
title: Adopting Phlex in a Rails app
---

# Adopting Phlex in a Rails app

You can go all-in on Phlex or bring it into an existing app one component at a time. Either way, start by [installing `phlex-rails` and running the install generator](/rails/generators).

## Starting from scratch

If you’re starting a new Rails app from scratch, you may want to go all-in with Phlex from the start, using Phlex for [_views_](/rails/views), [_layouts_](/rails/layouts) and _components_.

You should also consider using [Literal Properties](/miscellaneous/literal-properties), which will reduce the amount of boilerplate required for each component and add data validations at the component layer.

## Adopting Phlex in an existing Rails codebase

If you’re adopting Phlex into an existing codebase, you should start by extracting components and [using them in your existing Rails views](/components/rendering#rendering-phlex-components-in-erb). This will help you get the most out of Phlex early on without too much effort.

Eventually, you may decide to start building new [views](/rails/views) directly in Phlex or maybe even converting some of your existing views over. Phlex views render inside your existing ERB layouts, and they can [render your existing partials](/components/rendering#rendering-rails-partials-in-phlex) and use your existing [helpers](/rails/helpers) and [form builders](/rails/forms), so you don’t have to convert everything at once.

Although there is a [compatibility layer](/rails/layouts#working-with-legacy-layouts) if you need to convert them early, your layouts should probably be the last things to convert to Phlex.

## Tracking progress

I usually use `cloc` to track how much ERB is left in an application. In the Rails console, you can look at `Phlex::HTML.descendants.size` to see how many HTML components you have loaded in your app.
