---
title: Forms
---

# Forms

You can use Rails’ form helpers — `form_with`, `form_for`, `fields_for` and friends — in Phlex components. Include the adapter, and the form builder that’s yielded to your block outputs its fields straight into your template.

```ruby
class Components::SearchForm < Components::Base
  include Phlex::Rails::Helpers::FormWith

  def view_template
    form_with(url: "/search", method: :get) do |form|
      form.search_field :q
      form.submit "Search"
    end
  end
end
```

```html
<form action="/search" accept-charset="UTF-8" method="get">
  <input type="search" name="q" id="q" />
  <input type="submit" name="commit" value="Search" data-disable-with="Search" />
</form>
```

Notice there’s no `raw` or `plain` in front of `form.search_field`. Unlike ERB, where you’d write `<%= form.search_field :q %>`, calling a field method on the builder outputs the field.

The HTML on this page comes from Rails 8.1 and has been formatted. The exact markup depends on your Rails version and configuration.

## A complete form

Here’s a view with a form for a new article. Between the builder’s fields, you can use any Phlex elements and components.

::: code-group

```ruby [view]
class Views::Articles::New < Views::Base
  include Phlex::Rails::Helpers::FormWith

  def initialize(article:, categories:)
    @article = article
    @categories = categories
  end

  def view_template
    h1 { "New article" }

    form_with(model: @article, class: "article-form") do |form|
      div(class: "field") do
        form.label :title
        form.text_field :title, required: true
      end

      div(class: "field") do
        form.label :body
        form.text_area :body, rows: 5
      end

      div(class: "field") do
        form.label :status
        form.select :status, [["Draft", "draft"], ["Published", "published"]]
      end

      div(class: "field") do
        form.label :category_id, "Category"
        form.collection_select :category_id, @categories, :id, :name, prompt: true
      end

      label do
        form.check_box :featured
        plain " Featured"
      end

      form.submit
    end
  end
end
```

```ruby [controller]
class ArticlesController < ApplicationController
  def new
    render Views::Articles::New.new(
      article: Article.new,
      categories: Category.all
    )
  end
end
```

:::

```html
<h1>New article</h1>
<form class="article-form" action="/articles" accept-charset="UTF-8" method="post">
  <input type="hidden" name="authenticity_token" value="…" />
  <div class="field">
    <label for="article_title">Title</label>
    <input required="required" type="text" name="article[title]" id="article_title" />
  </div>
  <div class="field">
    <label for="article_body">Body</label>
    <textarea rows="5" name="article[body]" id="article_body"></textarea>
  </div>
  <div class="field">
    <label for="article_status">Status</label>
    <select name="article[status]" id="article_status">
      <option value="draft">Draft</option>
      <option value="published">Published</option>
    </select>
  </div>
  <div class="field">
    <label for="article_category_id">Category</label>
    <select name="article[category_id]" id="article_category_id">
      <option value="">Please select</option>
      <option value="1">News</option>
      <option value="2">Opinion</option>
    </select>
  </div>
  <label>
    <input name="article[featured]" type="hidden" value="0" />
    <input type="checkbox" value="1" name="article[featured]" id="article_featured" /> Featured
  </label>
  <input type="submit" name="commit" value="Create Article" data-disable-with="Create Article" />
</form>
```

Everything else about `form_with` is the same as in ERB. Pass it a persisted record and you get a `PATCH` form with the record’s values filled in. When the record has validation errors, Rails wraps the invalid fields in `<div class="field_with_errors">` as usual, and you can read the messages from `form.object.errors`.

## How builders work

In ERB, the methods on a form builder return HTML and you output it with `<%= %>`. In Phlex, there is no `<%= %>`, so the form helper adapters wrap the builder in a `Phlex::Rails::Builder` before yielding it to your block. The wrapper passes every method call on to the real builder, then looks at what came back:

- if it’s an HTML-safe string (an `ActiveSupport::SafeBuffer`), the wrapper outputs it;
- anything else is returned to you.

So field methods output, while methods that give you information return it.

```ruby
form_with(model: @article) do |form|
  form.text_field :title, aria: { describedby: form.field_id(:title, :hint) }

  small(id: form.field_id(:title, :hint)) do
    "Editing “#{form.object.title}”"
  end
end
```

```html
<form action="/articles/1" accept-charset="UTF-8" method="post">
  <input type="hidden" name="_method" value="patch" />
  <input type="hidden" name="authenticity_token" value="…" />
  <input aria-describedby="article_title_hint" type="text" value="First" name="article[title]" id="article_title" />
  <small id="article_title_hint">Editing “First”</small>
</form>
```

Here `form.text_field` returned HTML, so it was output. `form.field_id` and `form.object` returned a String and a model, so nothing was output and we were free to use them.

### Blocks and nested builders

Builder methods that take a block work with Phlex blocks. When the method yields another builder, as `fields_for` and `label` do, that builder is wrapped as well.

```ruby
form_with(model: @article) do |form|
  form.label(:title) do |label|
    strong { label.translation }
    plain " (required)"
  end

  form.fields_for :comments do |comment_fields|
    comment_fields.text_field :body
  end

  form.button { span { "Save" } }
end
```

```html
<form action="/articles/1" accept-charset="UTF-8" method="post">
  <input type="hidden" name="_method" value="patch" />
  <input type="hidden" name="authenticity_token" value="…" />
  <label for="article_title"><strong>Title</strong> (required)</label>
  <input type="text" value="Nice" name="article[comments_attributes][0][body]" id="article_comments_attributes_0_body" />
  <button name="button" type="submit"><span>Save</span></button>
</form>
```

`collection_radio_buttons` and `collection_checkboxes` work the same way. Their block receives a wrapped builder for each item.

```ruby
form.collection_radio_buttons(:category_id, @categories, :id, :name) do |item|
  label do
    item.radio_button
    plain item.text
  end
end
```

```html
<input type="hidden" name="article[category_id]" value="" />
<label><input type="radio" value="1" name="article[category_id]" id="article_category_id_1" />News</label>
<label><input type="radio" value="2" name="article[category_id]" id="article_category_id_2" />Opinion</label>
```

### Getting the original builder <Badge type="info" text="2.4+" />

`unwrap` returns the Rails builder that’s being wrapped.

```ruby
form.class        # => Phlex::Rails::Builder
form.unwrap.class # => ActionView::Helpers::FormBuilder
```

Methods you call on the unwrapped builder return their HTML instead of outputting it, so you’d need to output it yourself with `raw`.

## Select options

The simplest way to give a select its options is to pass the choices to `form.select`, as in the [complete form](#a-complete-form) above.

```ruby
form.select :status, [["Draft", "draft"], ["Published", "published"]]
```

If you want to build the options yourself, pass a block. Inside it, you can use `options_for_select`, `options_from_collection_for_select` or plain `option` elements.

```ruby
class Components::StatusField < Components::Base
  include Phlex::Rails::Helpers::FormWith
  include Phlex::Rails::Helpers::OptionsForSelect

  def initialize(article:)
    @article = article
  end

  def view_template
    form_with(model: @article) do |form|
      form.select(:status) do
        options_for_select(
          [["Draft", "draft"], ["Published", "published"]],
          form.object.status
        )
      end
    end
  end
end
```

```html
<form action="/articles/1" accept-charset="UTF-8" method="post">
  <input type="hidden" name="_method" value="patch" />
  <input type="hidden" name="authenticity_token" value="…" />
  <select name="article[status]" id="article_status">
    <option selected="selected" value="draft">Draft</option>
    <option value="published">Published</option>
  </select>
</form>
```

What you can’t do is pass the result of `options_for_select` as an argument, the way you would in ERB.

```ruby
form.select :status, options_for_select([["Draft", "draft"]]) # 💥
```

In Phlex, `options_for_select` outputs the options as soon as it’s called, which would put them outside the `<select>`. Since 2.3, this raises a `Phlex::ArgumentError` that explains the fix. There’s more on this in [Select options](/rails/helpers#select-options) on the helpers page.

## Custom form builders <Badge type="info" text="2.3+" />

Custom form builders work. Pass yours with `builder:` and call its methods as you would any other.

::: code-group

```ruby [builder]
class FancyFormBuilder < ActionView::Helpers::FormBuilder
  def field_group(attribute, **options)
    @template.content_tag(:div, class: "field") do
      label(attribute) + text_field(attribute, **options)
    end
  end
end
```

```ruby [component]
class Components::ArticleForm < Components::Base
  include Phlex::Rails::Helpers::FormWith

  def initialize(article:)
    @article = article
  end

  def view_template
    form_with(model: @article, builder: FancyFormBuilder) do |form|
      form.field_group :title, class: "input"
      form.submit
    end
  end
end
```

:::

```html
<form action="/articles/1" accept-charset="UTF-8" method="post">
  <input type="hidden" name="_method" value="patch" />
  <input type="hidden" name="authenticity_token" value="…" />
  <div class="field">
    <label for="article_title">Title</label>
    <input class="input" type="text" value="First" name="article[title]" id="article_title" />
  </div>
  <input type="submit" name="commit" value="Update Article" data-disable-with="Update Article" />
</form>
```

The same rule applies to your own methods: if a method returns an HTML-safe string, it’s output. If it returns a plain String, the String is returned and you decide what to do with it — `plain form.hint_text(:title)`, for example.

## Passing a builder to a component

A wrapped builder is an ordinary object, so you can pass it to other components.

::: code-group

```ruby [component]
class Components::FormGroup < Components::Base
  def initialize(form:, field:)
    @form = form
    @field = field
  end

  def view_template
    div(class: "form-group") do
      @form.label @field
      @form.text_field @field
    end
  end
end
```

```ruby [usage]
form_with(model: @article) do |form|
  FormGroup(form:, field: :title)
  FormGroup(form:, field: :body)
end
```

:::

```html
<form action="/articles/1" accept-charset="UTF-8" method="post">
  <input type="hidden" name="_method" value="patch" />
  <input type="hidden" name="authenticity_token" value="…" />
  <div class="form-group">
    <label for="article_title">Title</label>
    <input type="text" value="First" name="article[title]" id="article_title" />
  </div>
  <div class="form-group">
    <label for="article_body">Body</label>
    <input type="text" value="One" name="article[body]" id="article_body" />
  </div>
</form>
```

### Type checking a form builder

If the component defines its props with [Literal](/miscellaneous/literal-properties), the type definition must be wrapped too, because the object it receives is a `Phlex::Rails::Builder` and not a `FormBuilder`. `Phlex::Rails::Builder(type)` matches a `Phlex::Rails::Builder` that wraps an object of the given type.

```ruby
class Components::FormGroup < Components::Base
  extend Literal::Properties

  prop :form, Phlex::Rails::Builder(ActionView::Helpers::FormBuilder)
  prop :field, Symbol

  def view_template
    div(class: "form-group") do
      @form.label @field
      @form.text_field @field
    end
  end
end
```

::: warning
Builders are only wrapped when the form helper is called from Phlex. If you render this component from an ERB template’s `form_with` block, it receives the unwrapped `FormBuilder`. The type above rejects that with a `Literal::TypeError`, and without the type check you’d lose the label: an unwrapped builder’s methods return their HTML, and only the last value in the block, the text field, is output.
:::

## Other form helpers

All of these have adapters under `Phlex::Rails::Helpers`.

| Helper | Module | Notes |
| --- | --- | --- |
| `form_with` | `FormWith` | Yields a wrapped builder. |
| `form_for` | `FormFor` | Yields a wrapped builder. |
| `fields_for` | `FieldsFor` | Yields a wrapped builder, with no surrounding `<form>`. |
| `fields` | `Fields` | Yields a wrapped builder, with no surrounding `<form>`. |
| `label` | `Label` | The standalone `label(:article, :title)` helper. It replaces Phlex’s `label` element in components that include it. |
| `form_tag`, `text_field_tag`, `submit_tag`, … | `FormTag`, `TextFieldTag`, `SubmitTag`, … | Output helpers that don’t use a builder. |
| `button_to` | `ButtonTo` | Outputs a single-button form. |

The [helpers reference](/rails/helpers#all-adapters) lists every one. To use a form helper from a gem, see [Helpers that yield a builder](/rails/helpers#helpers-that-yield-a-builder).

## Writing the form yourself

You don’t have to use the Rails form helpers. A form is just HTML, and sometimes writing the elements is clearer. For a form that changes data, you’ll need to include the CSRF token, which you can get from the `form_authenticity_token` helper.

```ruby
class Components::NewArticleForm < Components::Base
  include Phlex::Rails::Helpers::FormAuthenticityToken

  def view_template
    form(action: articles_path, method: "post") do
      input(type: "hidden", name: "authenticity_token", value: form_authenticity_token)
      input(type: "text", name: "article[title]")
      button(type: "submit") { "Create" }
    end
  end
end
```

```html
<form action="/articles" method="post">
  <input type="hidden" name="authenticity_token" value="…">
  <input type="text" name="article[title]">
  <button type="submit">Create</button>
</form>
```
