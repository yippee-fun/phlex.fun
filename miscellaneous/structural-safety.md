---
title: Structural safety in Phlex
---

# Structural Safety

Phlex can provide strong HTML safety due to its structural design.

## What is cross-site-scripting?

Cross-site scripting (XSS) is when an attacker injects malicious scripts into websites that are then executed in other people’s browsers. As a simple example, what if one user says their name is `<script type="text/javascript">alert(1)</script>` and you subsequently display that user’s name to another unsuspecting user.

```ruby
dt { "Name" }
dd { @user.name }
```

If the second user sees the alert, that means the first user could have run any code in their browser logged in as them.

## How Phlex prevents cross-site-scripting

Phlex prevents cross-site-scripting in a number of different ways.

### Text content

All [text content](/sgml/text) is escaped by default. There are five characters that can be used to construct dangerous strings in HTML and they are escaped according to this table:

| Original character | Escape   |
| ------------------ | -------- |
| `&`                | `&amp;`  |
| `<`                | `&lt;`   |
| `>`                | `&gt;`   |
| `"`                | `&quot;` |
| `'`                | `&#39;`  |

So the example above renders the name as harmless text.

```html
<dt>Name</dt>
<dd>&lt;script type=&quot;text/javascript&quot;&gt;alert(1)&lt;/script&gt;</dd>
```

This applies to every element, including `script` and `style`, and to text in [comments](/sgml/comments).

### Attribute keys

Because Phlex uses Ruby keyword arguments for attributes, it is possible that you might output unsafe strings in attribute keys.

```ruby
div(**@user.settings)
```

When rendering these attribute keys, Phlex looks for unsafe characters — whitespace, `<`, `>`, `&`, `"`, `'`, `/` and `=` — and raises a `Phlex::ArgumentError` if any are found. In this case, it raises rather than escaping because it’s not a good idea to splat user data like this. The code should be fixed.

### Attribute values

Unlike attribute keys, it is reasonable to output user data in attribute values.

```ruby
input type: "text", value: @user.name
```

Phlex wraps attribute values in double quotes (`"`) so it escapes double quotes in the attribute values, replacing them with `&quot;`.

It also escapes `<` and `>` as `&lt;` and `&gt;`. Inside a quoted value these can’t start a tag, but they could end something the element is rendered inside. A value containing `-->` would close a [comment](/sgml/comments), and one containing `</noscript>` would close a `<noscript>` element, whose content browsers don’t parse as markup when scripting is on. Escaping doesn’t change the value the browser reads.

```ruby
input type: "text", value: %(--> "Ada" <script>)
```

```html
<input type="text" value="--&gt; &quot;Ada&quot; &lt;script&gt;">
```

This applies to every attribute value, including values branded as safe.

### Unsafe attributes

Some attributes are so unsafe, we completely prevent them by default, raising an error. If your Content Security Policy allows for unsafe inline JavaScript, the attribute `onclick` would execute its value as JavaScript when the element is clicked.

Phlex prevents the use of:

1. any attribute that starts with `on` and doesn’t contain a dash (`-`)
2. `srcdoc`
3. `sandbox`
4. `http-equiv`

```ruby
button(onclick: "alert(1)")
# Phlex::ArgumentError: Unsafe attribute name detected: onclick.
```

The same goes for names spelled with a nested Hash, such as `http: { equiv: "refresh" }`.

::: tip

You can bypass this guard by branding the value as _safe_ with the [`safe`](/sgml/raw#safe) method.

```ruby
button onclick: safe("alert(1)")
```

Only Phlex’s own `safe` does this. A String that Rails has marked as `html_safe` is safe to output as HTML, not to run as a script, so it’s checked like any other String.

:::

### Ref attributes

Attributes that reference URLs can be used to execute JavaScript code by using the `javascript:` protocol. For example, if your Content Security Policy allows for unsafe inline JavaScript, this link would trigger a JavaScript alert when clicked:

```html
<a href="javascript:alert(1)">Click me</a>
```

When the value of one of the following ref attributes uses the JavaScript protocol, Phlex leaves the whole attribute out. It doesn’t raise an error, and the rest of the element is rendered as normal.

1. `href`
2. `src`
3. `action`
4. `formaction`
5. `lowsrc`
6. `dynsrc`
7. `background`
8. `ping`
9. `data`, which takes a URL on `<object>`
10. `to`, `from`, `by` and `values`, which SVG animation elements such as `<set>` and `<animate>` write to the attribute named by `attributeName`, which can be `href`

A namespace prefix makes no difference. In an SVG document parsed as XML, any prefix can be bound to XLink, so `xlink:href` and `a:href` are checked the same way as `href`.

```ruby
a(href: "javascript:alert(1)") { "Click me" }
```

```html
<a>Click me</a>
```

Browsers are incredibly lenient in what they count as the JavaScript protocol so Phlex takes care to ignore whitespace, to match uppercase, lowercase or mixed case, to decode HTML character references such as `&colon;` and `&#58;`, and to prevent tricks like `javascript:javascript:alert(1)`.

This check applies to these attributes on any element, whatever the case of the attribute name. It doesn’t apply to attributes that only share a suffix, such as `data-href`.

::: tip

You can bypass this guard by branding the value as _safe_ with the `safe` method. As with unsafe attributes, an `html_safe` String from Rails doesn’t count.

```ruby
a(href: safe("javascript:alert(1)")) { "Click me" }
```

:::

### Dynamic tag names

[`tag`](/sgml/helpers#tag) renders an element whose name is decided at runtime, and that name might come from a user. So `tag` refuses to render `<script>`, `<style>` and `<base>`, raising a `Phlex::ArgumentError`. Their content or attributes run as code, or change where code is loaded from. Call `script`, `style` or `base` directly when you mean to render one.

### Raw output

The only way to output a String as HTML without escaping is to [brand it as safe](/sgml/raw). [`raw`](/sgml/raw) raises an error if you give it a regular String, so you can’t skip escaping by accident.

## Additional measures

While Phlex makes every effort to prevent cross-site-scripting attacks by default, there are some additional measures you can take to be extra safe.

### Configure a strong Content Security Policy

We strongly recommend configuring a strong [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) (CSP) that does not allow unsafe-inline JavaScript. Please also see the [Rails Guide to configuring a Content Security Policy](https://guides.rubyonrails.org/security.html#content-security-policy-header).

### Don’t make a habit of branding things as safe

The `safe` method — and in Rails, calling `.html_safe` on a String — brand that string as HTML safe. Doing this allows for the string to be output as HTML, and `safe` also bypasses the attribute guards above.

While it’s sometimes necessary to use this feature, it should be used carefully and kept close to the escaping/sanitization logic.

### Be careful with URLs

Phlex removes `javascript:` URLs, but it doesn’t validate URLs in any other way. If you render links that users provide, check that they point somewhere you’re happy to send people.

## How is this different to ERB?

Since ERB is string-based, it cannot follow the structure of your HTML. ERB performs basic HTML-escaping, but it doesn’t know if you’re outputting a value as part of a specific attribute.

For example, here ERB doesn’t know that `@user.bio_link` is being rendered in an `href` attribute.

```erb
<a href="<%= @user.bio_link %>">
```

## Reporting security vulnerabilities

If you believe you have found a security vulnerability in Phlex, please do not open an issue or pull request. Instead, please [send us a private advisory](https://github.com/yippee-fun/phlex/security/advisories/new) via GitHub.
