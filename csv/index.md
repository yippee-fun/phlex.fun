---
title: Building CSV files with Phlex
---

# CSV

`Phlex::CSV` lets you describe a CSV file as a class, in the same way you describe HTML with `Phlex::HTML`. You give it a collection, tell it how to turn one item into a row, and it takes care of headers, quoting and escaping.

## Your first CSV

Subclass `Phlex::CSV`, define `row_template`, and say whether you want [CSV injection escaping](#csv-injection).

```ruby
class ProductsCSV < Phlex::CSV
  def escape_csv_injection? = true

  def row_template(product)
    column "Name", product.name
    column "Price", product.price
  end
end
```

Create an instance with a collection and call `call` to get the CSV as a String.

```ruby
Product = Struct.new(:name, :price)

products = [
  Product.new("Apple", 1.0),
  Product.new("Banana", 0.25),
]

ProductsCSV.new(products).call
```

```csv
Name,Price
Apple,1.0
Banana,0.25
```

`row_template` is called once for each item in the collection. Each call to `column` adds one cell to the current row. Its first argument is the header for that column and its second is the value.

## The collection

`Phlex::CSV.new` takes one argument, the collection. It can be anything that responds to `each`. It’s available inside the class as `collection`.

If you need other arguments, define your own `initialize` and pass the collection to `super`.

```ruby
class ProductsCSV < Phlex::CSV
  def initialize(products, currency:)
    super(products)
    @currency = currency
  end

  def escape_csv_injection? = true

  def row_template(product)
    column "Name", product.name
    column "Price (#{@currency})", product.price
  end
end

ProductsCSV.new(products, currency: "GBP").call
```

```csv
Name,Price (GBP)
Apple,1.0
Banana,0.25
```

To change how the collection is iterated, override `each_item`. It receives a block and must yield each item to it.

```ruby
class ProductsCSV < Phlex::CSV
  def escape_csv_injection? = true

  def each_item(&)
    collection.sort_by(&:price).each(&)
  end

  def row_template(product)
    column "Name", product.name
    column "Price", product.price
  end
end
```

```csv
Name,Price
Banana,0.25
Apple,1.0
```

## Columns and values

Values are converted with `to_s`, so you can pass Strings, Symbols, numbers, `nil` or anything else with a sensible `to_s`.

Values are quoted when they need to be. A value is wrapped in double quotes if it contains the delimiter, a double quote or a newline, or if it starts or ends with whitespace. Double quotes inside it are doubled. Empty values, including `nil`, are written as `""`.

```ruby
products = [
  Product.new(%(12" Pizza, large), nil),
  Product.new("  Padded  ", 2),
]

ProductsCSV.new(products).call
```

```csv
Name,Price
"12"" Pizza, large",""
"  Padded  ",2
```

## Headers

The header row is taken from the first row: the header you pass to each `column` call for the first item becomes that column’s header. If the collection is empty, the output is an empty String with no header row.

Every row must then produce the same columns in the same order. If a later row has a different header in some position, Phlex raises a `Phlex::RuntimeError`:

```text
Header mismatch at index 1: expected Price, got Note.
```

This usually means a `column` call is conditional. Output the column for every row and make the value conditional instead. The check only compares the columns a row has, so a row that leaves out its last column isn’t caught. It’s written as a short row.

```ruby
column "Price", (product.price if product.for_sale?)
```

To leave the header row out, define `render_headers?` to return `false`.

```ruby
class ProductsCSV < Phlex::CSV
  def escape_csv_injection? = true
  def render_headers? = false

  def row_template(product)
    column product.name
    column product.price
  end
end
```

```csv
Apple,1.0
Banana,0.25
```

The header argument to `column` is optional, as in this example. Leave it out only when you’ve turned headers off.

## CSV injection

You must define `escape_csv_injection?` in every `Phlex::CSV` class. If you don’t, `call` raises a `RuntimeError` that starts:

```text
You need to define `escape_csv_injection?` in ProductsCSV.
```

Phlex makes you choose because neither answer is right for everyone.

CSV injection is an attack on the person who opens the file. Spreadsheet programs such as Excel and Google Sheets treat a cell that starts with `=`, `+`, `-` or `@` as a formula. If your CSV includes values that came from users, someone can enter a formula as their name, and it will run on the computer of whoever opens your export. Formulas can leak the contents of the spreadsheet to another server or, in some programs, run commands. [OWASP has more detail](https://owasp.org/www-community/attacks/CSV_Injection).

### Escaping on

```ruby
def escape_csv_injection? = true
```

Any value starting with `=`, `+`, `-`, `@`, a tab or a carriage return is prefixed with a single quote `'`, which tells the spreadsheet to treat it as text.

```ruby
products = [
  Product.new("=SUM(A1:A9)", 10),
  Product.new("Refund", -5),
]

ProductsCSV.new(products).call
```

```csv
Name,Price
"'=SUM(A1:A9)",10
Refund,"'-5"
```

The cost is that the data has changed. The file no longer contains `=SUM(A1:A9)`, it contains `'=SUM(A1:A9)`. Notice it applies to harmless values too: the negative number `-5` became `'-5`. Another program reading this file will see the quote.

Choose this when people will open the file in a spreadsheet.

### Escaping off

```ruby
def escape_csv_injection? = false
```

Values are written exactly as they are.

```csv
Name,Price
=SUM(A1:A9),10
Refund,-5
```

Choose this when the file is read by other software and must be an exact copy of your data, and you’re confident nobody will open it in a spreadsheet program. Don’t combine it with [`trim_whitespace?`](#trimming-whitespace).

## Trimming whitespace

Define `trim_whitespace?` to return `true` to strip leading and trailing whitespace from every header and value.

```ruby
class ProductsCSV < Phlex::CSV
  def escape_csv_injection? = true
  def trim_whitespace? = true

  def row_template(product)
    column "Name", product.name
    column "Price", product.price
  end
end

ProductsCSV.new([Product.new("  Padded  ", nil)]).call
```

```csv
Name,Price
Padded,
```

With trimming on, empty values are written as nothing at all rather than `""`.

::: warning
Only use `trim_whitespace?` with `escape_csv_injection?` returning `true`. In Phlex 2.4, trimming with escaping off writes every value unquoted, so a value that contains the delimiter, a double quote or a newline breaks the row.
:::

## Delimiter <Badge type="info" text="2.1+" />

The delimiter is a comma by default. Define `delimiter` to change it for the class, or pass `delimiter:` to `call` to change it for one render.

```ruby
class ProductsCSV < Phlex::CSV
  def escape_csv_injection? = true
  def delimiter = ";"

  def row_template(product)
    column "Name", product.name
    column "Price", product.price
  end
end

ProductsCSV.new(products).call
```

```csv
Name;Price
Apple;1.0
Banana;0.25
```

```ruby
ProductsCSV.new(products).call(delimiter: "\t")
```

The delimiter must be a single-character String. A longer or empty String raises a `Phlex::ArgumentError` with the message `Delimiter must be a single character`.

## Wrapping rows with `around_row` <Badge type="info" text="2.2.1+" />

`around_row` is called once for each item. The default implementation calls `row_template` with the item and then writes the row. Override it and call `super` to control when, and how many times, that happens.

Skip an item by not calling `super`:

```ruby
class ProductsCSV < Phlex::CSV
  def escape_csv_injection? = true

  def around_row(product)
    super unless product.price.zero?
  end

  def row_template(product)
    column "Name", product.name
    column "Price", product.price
  end
end
```

Write several rows for one item by calling `super` more than once. Whatever arguments you pass to `super` are passed on to `row_template`, so you can give it more than the item.

```ruby
Order = Struct.new(:id, :items)

class OrderItemsCSV < Phlex::CSV
  def escape_csv_injection? = true

  def around_row(order)
    order.items.each do |item|
      super(order, item)
    end
  end

  def row_template(order, item)
    column "Order", order.id
    column "Item", item
  end
end

orders = [
  Order.new(1, ["Pen", "Ink"]),
  Order.new(2, ["Paper"]),
]

OrderItemsCSV.new(orders).call
```

```csv
Order,Item
1,Pen
1,Ink
2,Paper
```

## Content type and filename

A `Phlex::CSV` has two methods that describe the file, for whatever is going to serve it.

- `content_type` returns `"text/csv"`.
- `filename` returns `nil`. Override it to give the file a name.

```ruby
class ProductsCSV < Phlex::CSV
  def filename = "products.csv"

  # ...
end
```

Phlex doesn’t use either of these itself. They’re there for you to read when you build a response, as in the [Rails example](#sending-a-csv-from-a-controller) below.

## Writing to a buffer

Like HTML components, `call` takes an optional buffer as its first argument: any object that responds to `<<`. The CSV is appended to it a cell at a time and the buffer is returned, so you can write a large file straight to disk without building it in memory first.

```ruby
File.open("products.csv", "w") do |file|
  ProductsCSV.new(products).call(file)
end
```

## Deprecated APIs

Two older ways of writing a `Phlex::CSV` still work but print a deprecation warning.

- **`view_template`**: Before 2.1, the row method was called `view_template`. Rename it to `row_template`.
- **`yielder`**: Before 2.2.1, you customised rows by defining a `yielder` method that yielded to a block. Rename it to `around_row` and change `yield` to `super`.

## CSV in Rails <Badge type="danger" text="Rails" />

### Batched loading <Badge type="info" text="2.1.3+" />

`phlex-rails` changes how `Phlex::CSV` iterates when the collection is an `ActiveRecord::Relation`. If the relation has no `order`, records are loaded in batches with `find_each` instead of all at once with `each`.

```ruby
ProductsCSV.new(Product.all).call                # uses find_each
ProductsCSV.new(Product.order(:name)).call       # uses each, keeping your order
ProductsCSV.new(Product.where(live: true)).call  # uses find_each
```

`find_each` orders by primary key, which is why it’s only used when you haven’t asked for an order of your own. To do something else, override [`each_item`](#the-collection).

### Sending a CSV from a controller

A `Phlex::CSV` can’t be passed to `render`. Call it yourself and send the result with `send_data`, using `content_type` and `filename` for the response headers.

```ruby
class ProductsController < ApplicationController
  def index
    respond_to do |format|
      format.html { render Views::Products::Index.new(products: Product.all) }

      format.csv do
        csv = ProductsCSV.new(Product.all)
        send_data csv.call, type: csv.content_type, filename: csv.filename
      end
    end
  end
end
```

A request for `/products.csv` now downloads the file. The response has the content type `text/csv` and, if you defined `filename`, a `Content-Disposition` header that makes the browser save it under that name.
