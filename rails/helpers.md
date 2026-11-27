---
title: Rails view helpers in Phlex
---

# Working with Rails view helpers in Phlex

Rails view helpers such as `link_to` and `number_to_currency` aren’t available in Phlex components until you include an _adapter_ for them. `phlex-rails` comes with an adapter for nearly every built-in helper, and you can register adapters for your own.

```ruby
class Components::ArticleListItem < Components::Base
  include Phlex::Rails::Helpers::DOMID
  include Phlex::Rails::Helpers::LinkTo

  def initialize(article:)
    @article = article
  end

  def view_template
    li(id: dom_id(@article)) do
      link_to @article.title, article_path(@article)
    end
  end
end
```

```html
<li id="article_1"><a href="/articles/1">First</a></li>
```

## Output helpers and value helpers

There are primarily two kinds of Rails view helpers. _Output_ helpers return HTML to be rendered raw while _value_ helpers return a value to be used in a conditional or output in an HTML attribute.

There are also helpers that don’t return anything, but we treat them as value helpers with no return value. The key distinction is whether or not the helper is expected to output its return value.

Here’s an example that combines the two: `link_to` is an _output_ helper while `article_path` is a _value_ helper.

```ruby
link_to "Article", article_path(@article)
```

`link_to` should take the return value from the helper and push it to the buffer immediately. If it didn’t do this, you would have to prefix it with `raw`. Conversely, `article_path` shouldn’t push anything. Instead, it should return the value.

To handle these differences, `phlex-rails` uses adapters, which know what kind of helper they’re adapting.

In practice, this means you call an output helper as a statement and use a value helper as an expression.

```ruby
def view_template
  link_to "Home", root_path         # outputs an <a>
  span { number_to_currency(1234.5) } # returns "$1,234.50", which the span outputs
  number_to_currency(1234.5)        # returns "$1,234.50" and outputs nothing
end
```

Both kinds accept blocks. Inside the block you write Phlex as usual.

```ruby
link_to article_path(@article) do
  strong { @article.title }
end
```

```html
<a href="/articles/1"><strong>First</strong></a>
```

## Built-in adapters

None of the adapters are included by default because you probably don’t need that many helpers if you’re using Phlex. For example, do you really need `link_to` when you have `a`?

The adapters are modules under the `Phlex::Rails::Helpers` namespace. Include the ones you need in the component that needs them, or in your base component if you use them everywhere.

### Routes

The one you probably _will_ need is the routes adapter, which makes all the routes helpers available. The [install generator](/rails/generators) includes it in your base component so it’s available everywhere.

```ruby
class Components::Base < Phlex::HTML
  include Phlex::Rails::Helpers::Routes
end
```

It gives you every `_path` and `_url` helper for your app’s routes, along with `main_app` and the helpers for any mounted engines.

```ruby
a(href: articles_path) { "Articles" }
a(href: article_url(@article)) { "Permalink" }
```

### Finding the right module

The module is named after the helper method in CamelCase: `link_to` is `Phlex::Rails::Helpers::LinkTo`, `number_to_currency` is `Phlex::Rails::Helpers::NumberToCurrency`.

If you try to use a Rails helper that you haven’t included, Phlex tells you which module to include.

````text
NoMethodError: Try including `Phlex::Rails::Helpers::LinkTo` in Components::Nav, like so:
```ruby
include Phlex::Rails::Helpers::LinkTo
```
````

You won’t get the hint for a helper that shares its name with an HTML element, such as `label`, `select` or `textarea`. Until you include the adapter, that name is the element method, so `label(:article, :title)` raises an `ArgumentError` about the number of arguments.

A few names aren’t what you’d guess, mostly because of acronyms.

| Helper | Module |
| --- | --- |
| `dom_id`, `dom_class` | `DOMID`, `DOMClass` |
| `field_id` | `FieldID` |
| `url_for`, `url_field`, `url_field_tag` | `URLFor`, `URLField`, `URLFieldTag` |
| `asset_url`, `image_url`, `audio_url`, `video_url`, `font_url` | `AssetURL`, `ImageURL`, `AudioURL`, `VideoURL`, `FontURL` |
| `url_to_asset`, `url_to_image`, … | `URLToAsset`, `URLToImage`, … |
| `csp_meta_tag` | `CSPMetaTag` |
| `csrf_meta_tags` | `CSRFMetaTags` |
| `sms_to` | `SMSTo` |
| `utf8_enforcer_tag` | `UTF8EnforcerTag` |
| `sanitize_css` | `SanitizeCSS` |
| `javascript_include_tag`, `javascript_path`, `javascript_url`, … | `JavaScriptIncludeTag`, `JavaScriptPath`, `JavaScriptURL`, … |
| `stylesheet_link_tag`, `stylesheet_path`, `stylesheet_url` | `StyleSheetLinkTag`, `StyleSheetPath`, `StyleSheetURL` |
| `path_to_javascript`, `path_to_stylesheet` | `PathToJavaScript`, `PathToStyleSheet` |
| `textarea`, `text_area` | `TextArea` |
| `textarea_tag`, `text_area_tag` | `TextAreaTag` |
| `rich_textarea`, `rich_text_area` | `RichTextArea` |
| `checkbox`, `check_box` | `Checkbox` |
| `checkbox_tag`, `check_box_tag` | `CheckboxTag` |
| `collection_checkboxes`, `collection_check_boxes` | `CollectionCheckboxes` |
| `current_page?` | `CurrentPage` |
| `content_for`, `content_for?` | `ContentFor` |
| `translate`, `t` | `Translate` (or `T`) |
| `localize` | `Localize` |
| `l` | `L` |

Older spellings still work. `StylesheetLinkTag`, `StylesheetPath`, `StylesheetURL`, `JavascriptIncludeTag`, `JavascriptImportmapTags`, `JavascriptImportModuleTag`, `JavascriptPath`, `JavascriptTag`, `JavascriptURL`, `PathToJavascript`, `PathToStylesheet`, `URLToJavascript`, `URLToStylesheet`, `Textarea`, `TextareaTag`, `RichTextarea`, `CheckBox`, `CheckBoxTag` and `CollectionCheckBoxes` resolve to the modules above.

### All adapters

In the tables below, the _kind_ tells you how the helper behaves:

- **output** — outputs HTML where you call it
- **value** — returns a value and outputs nothing
- **builder** — outputs HTML and yields a [wrapped builder](/rails/forms#how-builders-work) to its block
- **buffered** — returns a [buffered proxy](#tag-and-turbo-stream) whose methods output HTML

Each module name is under `Phlex::Rails::Helpers`.

::: details Links and URLs (12)

| Module | Methods | Kind |
| --- | --- | --- |
| `ButtonTo` | `button_to` | output |
| `CurrentPage` | `current_page?` | value |
| `DefaultURLOptions` | `default_url_options` | value |
| `LinkTo` | `link_to` | output |
| `LinkToIf` | `link_to_if` | output |
| `LinkToUnless` | `link_to_unless` | output |
| `LinkToUnlessCurrent` | `link_to_unless_current` | output |
| `MailTo` | `mail_to` | output |
| `PhoneTo` | `phone_to` | output |
| `SMSTo` | `sms_to` | output |
| `URLFor` | `url_for` | value |
| `URLOptions` | `url_options` | value |

:::

::: details Assets (45)

| Module | Methods | Kind |
| --- | --- | --- |
| `AssetPath` | `asset_path` | value |
| `AssetURL` | `asset_url` | value |
| `AudioPath` | `audio_path` | value |
| `AudioTag` | `audio_tag` | output |
| `AudioURL` | `audio_url` | value |
| `AutoDiscoveryLinkTag` | `auto_discovery_link_tag` | output |
| `ComputeAssetExtname` | `compute_asset_extname` | value |
| `ComputeAssetHost` | `compute_asset_host` | value |
| `ComputeAssetPath` | `compute_asset_path` | value |
| `FaviconLinkTag` | `favicon_link_tag` | output |
| `FontPath` | `font_path` | value |
| `FontURL` | `font_url` | value |
| `ImagePath` | `image_path` | value |
| `ImageTag` | `image_tag` | output |
| `ImageURL` | `image_url` | value |
| `JavaScriptImportModuleTag` | `javascript_import_module_tag` | output |
| `JavaScriptImportmapModulePreloadTags` | `javascript_importmap_module_preload_tags` | output |
| `JavaScriptImportmapTags` | `javascript_importmap_tags` | output |
| `JavaScriptIncludeTag` | `javascript_include_tag` | output |
| `JavaScriptInlineImportmapTag` | `javascript_inline_importmap_tag` | output |
| `JavaScriptPath` | `javascript_path` | value |
| `JavaScriptURL` | `javascript_url` | value |
| `PathToAsset` | `path_to_asset` | value |
| `PathToAudio` | `path_to_audio` | value |
| `PathToFont` | `path_to_font` | value |
| `PathToImage` | `path_to_image` | value |
| `PathToJavaScript` | `path_to_javascript` | value |
| `PathToStyleSheet` | `path_to_stylesheet` | value |
| `PathToVideo` | `path_to_video` | value |
| `PictureTag` | `picture_tag` | output |
| `PreloadLinkTag` | `preload_link_tag` | output |
| `PublicComputeAssetPath` | `public_compute_asset_path` | value |
| `StyleSheetLinkTag` | `stylesheet_link_tag` | output |
| `StyleSheetPath` | `stylesheet_path` | value |
| `StyleSheetURL` | `stylesheet_url` | value |
| `URLToAsset` | `url_to_asset` | value |
| `URLToAudio` | `url_to_audio` | value |
| `URLToFont` | `url_to_font` | value |
| `URLToImage` | `url_to_image` | value |
| `URLToJavaScript` | `url_to_javascript` | value |
| `URLToStyleSheet` | `url_to_stylesheet` | value |
| `URLToVideo` | `url_to_video` | value |
| `VideoPath` | `video_path` | value |
| `VideoTag` | `video_tag` | output |
| `VideoURL` | `video_url` | value |

:::

::: details Tags, classes and DOM ids (9)

| Module | Methods | Kind |
| --- | --- | --- |
| `BuildTagValues` | `build_tag_values` | value |
| `ClassNames` | `class_names` | value |
| `ContentTag` | `content_tag` | output |
| `Debug` | `debug` | output |
| `DOMClass` | `dom_class` | value |
| `DOMID` | `dom_id` | value |
| `JavaScriptTag` | `javascript_tag` | output |
| `Tag` | `tag` | buffered |
| `TokenList` | `token_list` | value |

:::

::: details Text, numbers, dates and translations (23)

| Module | Methods | Kind |
| --- | --- | --- |
| `CurrentCycle` | `current_cycle` | value |
| `Cycle` | `cycle` | value |
| `DistanceOfTimeInWords` | `distance_of_time_in_words` | value |
| `DistanceOfTimeInWordsToNow` | `distance_of_time_in_words_to_now` | value |
| `Excerpt` | `excerpt` | value |
| `Highlight` | `highlight` | output |
| `L` | `l` | value |
| `Localize` | `localize` | value |
| `NumberToCurrency` | `number_to_currency` | value |
| `NumberToHuman` | `number_to_human` | value |
| `NumberToHumanSize` | `number_to_human_size` | value |
| `NumberToPercentage` | `number_to_percentage` | value |
| `NumberToPhone` | `number_to_phone` | value |
| `NumberWithDelimiter` | `number_with_delimiter` | value |
| `NumberWithPrecision` | `number_with_precision` | value |
| `Pluralize` | `pluralize` | value |
| `ResetCycle` | `reset_cycle` | value |
| `SimpleFormat` | `simple_format` | output |
| `TimeAgoInWords` | `time_ago_in_words` | value |
| `TimeTag` | `time_tag` | output |
| `Translate` | `translate`, `t` | value |
| `Truncate` | `truncate` | value |
| `WordWrap` | `word_wrap` | value |

:::

::: details Sanitising (5)

| Module | Methods | Kind |
| --- | --- | --- |
| `EscapeOnce` | `escape_once` | value |
| `Sanitize` | `sanitize` | value |
| `SanitizeCSS` | `sanitize_css` | value |
| `StripLinks` | `strip_links` | value |
| `StripTags` | `strip_tags` | value |

:::

::: details Forms and model fields (39)

| Module | Methods | Kind |
| --- | --- | --- |
| `Checkbox` | `checkbox`, `check_box` | output |
| `CollectionCheckboxes` | `collection_checkboxes`, `collection_check_boxes` | builder |
| `CollectionRadioButtons` | `collection_radio_buttons` | builder |
| `CollectionSelect` | `collection_select` | output |
| `ColorField` | `color_field` | output |
| `DateField` | `date_field` | output |
| `DatetimeField` | `datetime_field` | output |
| `DatetimeLocalField` | `datetime_local_field` | output |
| `EmailField` | `email_field` | output |
| `ErrorMessage` | `error_message` | value |
| `ErrorWrapping` | `error_wrapping` | output |
| `FieldID` | `field_id` | value |
| `FieldName` | `field_name` | value |
| `Fields` | `fields` | builder |
| `FieldsFor` | `fields_for` | builder |
| `FileField` | `file_field` | output |
| `FormFor` | `form_for` | builder |
| `FormWith` | `form_with` | builder |
| `GroupedCollectionSelect` | `grouped_collection_select` | output |
| `HiddenField` | `hidden_field` | output |
| `Label` | `label` | builder |
| `MonthField` | `month_field` | output |
| `NumberField` | `number_field` | output |
| `Object` | `object` | value |
| `PasswordField` | `password_field` | output |
| `PhoneField` | `phone_field` | output |
| `RadioButton` | `radio_button` | output |
| `RangeField` | `range_field` | output |
| `RichTextArea` | `rich_textarea`, `rich_text_area` | output |
| `SearchField` | `search_field` | output |
| `Select` | `select` | output |
| `TelephoneField` | `telephone_field` | output |
| `TextField` | `text_field` | output |
| `TextArea` | `textarea`, `text_area` | output |
| `TimeField` | `time_field` | output |
| `TimeZoneSelect` | `time_zone_select` | output |
| `URLField` | `url_field` | output |
| `WeekField` | `week_field` | output |
| `WeekdaySelect` | `weekday_select` | output |

:::

::: details Form tags (without a model) (29)

| Module | Methods | Kind |
| --- | --- | --- |
| `ButtonTag` | `button_tag` | output |
| `CheckboxTag` | `checkbox_tag`, `check_box_tag` | output |
| `ColorFieldTag` | `color_field_tag` | output |
| `DateFieldTag` | `date_field_tag` | output |
| `DatetimeFieldTag` | `datetime_field_tag` | output |
| `DatetimeLocalFieldTag` | `datetime_local_field_tag` | output |
| `EmailFieldTag` | `email_field_tag` | output |
| `FieldSetTag` | `field_set_tag` | output |
| `FileFieldTag` | `file_field_tag` | output |
| `FormTag` | `form_tag` | output |
| `HiddenFieldTag` | `hidden_field_tag` | output |
| `ImageSubmitTag` | `image_submit_tag` | output |
| `LabelTag` | `label_tag` | output |
| `MonthFieldTag` | `month_field_tag` | output |
| `NumberFieldTag` | `number_field_tag` | output |
| `PasswordFieldTag` | `password_field_tag` | output |
| `PhoneFieldTag` | `phone_field_tag` | output |
| `RadioButtonTag` | `radio_button_tag` | output |
| `RangeFieldTag` | `range_field_tag` | output |
| `SearchFieldTag` | `search_field_tag` | output |
| `SelectTag` | `select_tag` | output |
| `SubmitTag` | `submit_tag` | output |
| `TelephoneFieldTag` | `telephone_field_tag` | output |
| `TextFieldTag` | `text_field_tag` | output |
| `TextAreaTag` | `textarea_tag`, `text_area_tag` | output |
| `TimeFieldTag` | `time_field_tag` | output |
| `URLFieldTag` | `url_field_tag` | output |
| `UTF8EnforcerTag` | `utf8_enforcer_tag` | output |
| `WeekFieldTag` | `week_field_tag` | output |

:::

::: details Select options and date selects (18)

| Module | Methods | Kind |
| --- | --- | --- |
| `DateSelect` | `date_select` | output |
| `DatetimeSelect` | `datetime_select` | output |
| `GroupedOptionsForSelect` | `grouped_options_for_select` | output |
| `OptionGroupsFromCollectionForSelect` | `option_groups_from_collection_for_select` | output |
| `OptionsForSelect` | `options_for_select` | output |
| `OptionsFromCollectionForSelect` | `options_from_collection_for_select` | output |
| `SelectDate` | `select_date` | output |
| `SelectDatetime` | `select_datetime` | output |
| `SelectDay` | `select_day` | output |
| `SelectHour` | `select_hour` | output |
| `SelectMinute` | `select_minute` | output |
| `SelectMonth` | `select_month` | output |
| `SelectSecond` | `select_second` | output |
| `SelectTime` | `select_time` | output |
| `SelectYear` | `select_year` | output |
| `TimeSelect` | `time_select` | output |
| `TimeZoneOptionsForSelect` | `time_zone_options_for_select` | output |
| `WeekdayOptionsForSelect` | `weekday_options_for_select` | output |

:::

::: details Content for layouts (3)

| Module | Methods | Kind |
| --- | --- | --- |
| `ContentFor` | `content_for`, `content_for?` | value |
| `Provide` | `provide` | value |
| `WithOutputBuffer` | `with_output_buffer` | output |

:::

::: details Controller, request and flash (6)

| Module | Methods | Kind |
| --- | --- | --- |
| `ActionName` | `action_name` | value |
| `ControllerName` | `controller_name` | value |
| `ControllerPath` | `controller_path` | value |
| `Flash` | `flash` | value |
| `Notice` | `notice` | value |
| `Request` | `request` | value |

:::

::: details Security (4)

| Module | Methods | Kind |
| --- | --- | --- |
| `ContentSecurityPolicyNonce` | `content_security_policy_nonce` | value |
| `CSPMetaTag` | `csp_meta_tag` | output |
| `CSRFMetaTags` | `csrf_meta_tags` | output |
| `FormAuthenticityToken` | `form_authenticity_token` | value |

:::

::: details Turbo and Action Cable (8)

| Module | Methods | Kind |
| --- | --- | --- |
| `ActionCableMetaTag` | `action_cable_meta_tag` | output |
| `TurboFrameTag` | `turbo_frame_tag` | output |
| `TurboIncludeTags` | `turbo_include_tags` | output |
| `TurboRefreshMethodTag` | `turbo_refresh_method_tag` | output |
| `TurboRefreshScrollTag` | `turbo_refresh_scroll_tag` | output |
| `TurboRefreshesWith` | `turbo_refreshes_with` | output |
| `TurboStream` | `turbo_stream` | buffered |
| `TurboStreamFrom` | `turbo_stream_from` | output |

:::

Some of these helpers come from gems that Rails apps don’t always have: the Turbo helpers need [turbo-rails](https://github.com/hotwired/turbo-rails), the importmap helpers need [importmap-rails](https://github.com/rails/importmap-rails), `rich_textarea` needs Action Text and `action_cable_meta_tag` needs Action Cable. An adapter only works when the helper it adapts exists in your app.

### Helpers without an adapter

Some Rails helpers don’t have an adapter, usually because Phlex already does the job.

| Rails helper | What to do instead |
| --- | --- |
| `raw` | Phlex has its own [`raw`](/sgml/raw), which only outputs strings marked as safe. |
| `capture` | Phlex has its own [`capture`](/sgml/helpers#capture). |
| `render` | Phlex has its own [`render`](/components/rendering), which also handles [partials and models](/components/rendering#rendering-rails-partials-in-phlex). |
| `cache`, `cache_if`, `cache_unless` | Phlex has its own [`cache`](/components/caching). Wrap it in a conditional for the `_if` and `_unless` forms. |
| `concat`, `safe_concat` | Not needed. Elements, `plain` and `raw` output directly. |
| `csrf_meta_tag` | Use `csrf_meta_tags`. |
| `params`, `cookies`, `session`, `controller` | Pass the data you need to the component from the controller. |

Others have no adapter and no Phlex equivalent, including `safe_join`, `to_sentence`, `escape_javascript` (`j`), `atom_feed`, `cdata_section`, `benchmark`, and the Turbo helpers `turbo_exempts_page_from_cache`, `turbo_exempts_page_from_preview` and `turbo_page_requires_reload`. If you need one of them, [register it yourself](#registering-your-own-helpers).

Calling a helper that has no adapter raises an ordinary `NoMethodError`, without the hint.

## Helpers aren’t available until rendering starts

Adapters call the helper on the Rails view context, which a component doesn’t have until it starts rendering. If you call a helper from `initialize`, you’ll get a `Phlex::Rails::HelpersCalledBeforeRenderError`. See [Helpers don’t work in `initialize`](/rails/views#helpers-don-t-work-in-initialize).

## Translations

`Phlex::Rails::Helpers::Translate` gives you `translate` and its alias `t`. `Phlex::Rails::Helpers::T` is another name for the same module.

Keys that start with a dot are relative to the component. The prefix comes from the component’s class name: `Components::UserCard` looks under `components.user_card`.

::: code-group

```ruby [component]
class Components::UserCard < Components::Base
  include Phlex::Rails::Helpers::Translate

  def view_template
    h1 { t(".title") }
    p { t(".greeting", name: "Joel") }
    p { t("hello") }
  end
end
```

```yaml [config/locales/en.yml]
en:
  hello: "Hello"
  components:
    user_card:
      title: "Profile"
      greeting: "Hello, %{name}"
```

:::

```html
<h1>Profile</h1>
<p>Hello, Joel</p>
<p>Hello</p>
```

A view named `Views::Articles::Index` looks under `views.articles.index`. You can check the prefix for any component that includes the module with the class method `translation_path`.

```ruby
Components::UserCard.translation_path # => "components.user_card"
```

## `tag` and `turbo_stream`

Rails’ `tag` and Turbo’s `turbo_stream` return builder objects. In ERB you’d write `<%= tag.div(...) %>`. In Phlex, the adapters return the builder wrapped in a `Phlex::Rails::Buffered`, which outputs the result of every method you call on it.

```ruby
class Components::Example < Components::Base
  include Phlex::Rails::Helpers::Tag
  include Phlex::Rails::Helpers::TurboStream

  def view_template
    tag.div(class: "a") { strong { "Hi" } }

    turbo_stream.append("list") { li { "New" } }
    turbo_stream.remove("old")
  end
end
```

```html
<div class="a"><strong>Hi</strong></div>
<turbo-stream action="append" target="list">
  <template>
    <li>New</li>
  </template>
</turbo-stream>
<turbo-stream action="remove" target="old"></turbo-stream>
```

Blocks are captured, so you can write Phlex inside them. To get at the original Rails object, call `unwrap`.

Called with arguments, as in `tag(:br)`, Rails’ `tag` returns HTML instead of a builder, and the adapter outputs it straight away.

::: warning
Phlex has its own [`tag`](/sgml/helpers#tag) method for rendering an element by name. Including `Phlex::Rails::Helpers::Tag` replaces it with the Rails helper in that component, so only include the adapter where you need Rails’ version.
:::

### Type checking a buffered object <Badge type="info" text="2.4+" />

If you pass one of these objects to a component that defines its props with [Literal](/miscellaneous/literal-properties), the type has to account for the wrapper. `Phlex::Rails::Buffered(type)` matches a `Phlex::Rails::Buffered` that wraps an object of the given type.

```ruby
class Components::StreamItem < Components::Base
  extend Literal::Properties

  prop :stream, Phlex::Rails::Buffered(Turbo::Streams::TagBuilder)

  def view_template
    @stream.remove("item_1")
  end
end
```

There’s a matching [`Phlex::Rails::Builder(type)`](/rails/forms#type-checking-a-form-builder) for form builders.

## Select options

`options_for_select` and `options_from_collection_for_select` are output helpers. They output `<option>` elements where you call them, so call them inside the block of a `<select>`. With `select_tag`, the block provides the options.

```ruby
class Components::StatusSelect < Components::Base
  include Phlex::Rails::Helpers::SelectTag
  include Phlex::Rails::Helpers::OptionsForSelect

  def view_template
    select_tag(:status, class: "s") do
      options_for_select([["Draft", "draft"], ["Published", "published"]], "published")
    end
  end
end
```

```html
<select name="status" id="status" class="s">
  <option value="draft">Draft</option>
  <option selected="selected" value="published">Published</option>
</select>
```

You don’t need the helper at all if you’d rather write the options in Phlex.

```ruby
select_tag(:status) do
  option(value: "draft") { "Draft" }
  option(value: "published", selected: true) { "Published" }
end
```

### Don’t pass the options as an argument <Badge type="info" text="2.3+" />

In ERB you’d pass the result of `options_for_select` as the second argument to `select_tag`. That can’t work in Phlex because the options have already been output by the time `select_tag` is called, so Phlex raises an error instead of rendering the wrong thing.

```ruby
select_tag :status, options_for_select([["Draft", "draft"]]) # 💥
```

```text
Phlex::ArgumentError: You can’t use the return value of options_for_select as an argument to another helper in Phlex. Instead, pass a block and call options_for_select inside that block, since options_for_select outputs HTML directly. Alternatively, you can pass your options value to the select helper, skipping the options_for_select helper altogether.
```

The same applies to `form.select` on a form builder. See [Select options in forms](/rails/forms#select-options).

## Forms

`form_with`, `form_for`, `fields_for` and the other helpers that yield a builder have their own page: [Forms](/rails/forms).

## Registering your own helpers

Sometimes you need an adapter for your own view helpers, or those provided by Ruby gems. To do this, you can use the class methods `register_value_helper` and `register_output_helper`.

```ruby
class Components::Base < Phlex::HTML
  # Register a Rails helper that returns a value that shouldn’t be pushed to the output buffer.
  # e.g. if you want to use it like `div { format_release_date(book.date) }`
  register_value_helper :format_release_date

  # Register a Rails helper that returns safe HTML to be pushed to the output buffer.
  register_output_helper :pagy_nav
end
```

The helper has to exist on the Rails view context. That’s the case for anything in `app/helpers`, anything added with `helper` or `helper_method` in a controller, and helpers that gems add to Action View.

Registered helpers accept blocks. The block’s output is captured and handed to the Rails helper as its block content.

::: code-group

```ruby [app/helpers/application_helper.rb]
module ApplicationHelper
  def card(&block)
    content_tag(:div, capture(&block), class: "card")
  end
end
```

```ruby [component]
class Components::Example < Components::Base
  register_output_helper :card

  def view_template
    card { h2 { "Inside" } }
  end
end
```

:::

```html
<div class="card">
  <h2>Inside</h2>
</div>
```

::: warning
You should never include Rails view helper modules directly. They are not designed to work with Phlex and they may override core Phlex methods such as `capture`, which will lead to all kinds of problems.
:::

### Output helpers that return plain strings <Badge type="info" text="2.4+" />

An output helper’s return value is passed to [`raw`](/sgml/raw), which only accepts HTML-safe strings. Most helpers return an `ActiveSupport::SafeBuffer`, which is fine. If yours builds HTML as a plain String, you’ll get this error:

```text
Phlex::ArgumentError: You passed an unsafe object to `raw`.
```

If you trust the helper to escape any user input itself, register it with `mark_safe: true`.

```ruby
# def legacy_icon(name) = "<i class=\"icon-#{h(name)}\"></i>"
register_output_helper :legacy_icon, mark_safe: true
```

```html
<i class="icon-star"></i>
```

Only do this for helpers whose output you’d be happy to call `html_safe` on.

### Helpers that yield a builder

Some helpers yield an object whose methods return HTML, the way `form_with` yields a form builder. Register these with `register_builder_yielding_helper`. The yielded object is wrapped in a [`Phlex::Rails::Builder`](/rails/forms#how-builders-work) so that its methods output directly.

```ruby
# def filter_form(&block) = form_with(url: "/search", method: :get, class: "filters", &block)
class Components::Filters < Components::Base
  register_builder_yielding_helper :filter_form

  def view_template
    filter_form do |form|
      form.search_field :q
      form.submit "Filter"
    end
  end
end
```

```html
<form class="filters" action="/search" accept-charset="UTF-8" method="get">
  <input type="search" name="q" id="q" />
  <input type="submit" name="commit" value="Filter" data-disable-with="Filter" />
</form>
```

This is the macro to use for form helpers provided by gems.

### Writing an adapter module

The built-in adapters are plain modules that extend `Phlex::Rails::HelperMacros`. You can write your own in the same way, which is useful when a set of helpers belongs together or you’re shipping them in a gem.

```ruby
module ReleaseHelpers
  extend Phlex::Rails::HelperMacros

  register_value_helper :format_release_date
  register_output_helper :release_badge
end
```

```ruby
class Components::Release < Components::Base
  include ReleaseHelpers

  def view_template
    time { format_release_date(@release.date) }
  end
end
```

All three macros are available in a module.

## The view context

Every adapter works by calling the helper on `view_context`, the Rails view context that’s rendering the component. You can call it yourself, but we don’t recommend it: output helpers called this way return their HTML instead of outputting it. See [The view context](/rails/views#the-view-context).

### `helpers` is deprecated

`helpers` is an older name for `view_context`. It still works, but it prints a deprecation warning every time it’s called and will be removed in the next minor version of `phlex-rails`. Replace `helpers.some_helper` with an adapter, or with `view_context.some_helper` if you have to.

## An alternative to custom helpers

There’s a good chance anything you’d have put in a custom view helper would be better as a component in Phlex.

Alternatively, you can define your own Phlex helpers as plain old methods — either directly on your base component or in a module that you include in the relevant components. In this context, your helpers can use regular HTML element methods rather than messing around with `safe_concat`.
