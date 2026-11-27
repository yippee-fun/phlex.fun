import { defineConfig } from "vitepress";

const description =
	"Phlex is a Ruby gem for building fast, object-oriented HTML, SVG and CSV views in pure Ruby.";

export default defineConfig({
	title: "Phlex",
	description,
	sitemap: { hostname: "https://www.phlex.fun" },
	lastUpdated: true,
	srcExclude: [
		"README.md",
		"ai.md",
		"compare/**",
		"design/index.md",
		"design/performance.md",
	],
	head: [
		["meta", { property: "og:type", content: "website" }],
		["meta", { property: "og:site_name", content: "Phlex" }],
		["meta", { property: "og:title", content: "Phlex — views in pure Ruby" }],
		["meta", { property: "og:description", content: description }],
		["meta", { property: "og:url", content: "https://www.phlex.fun" }],
		["meta", { name: "twitter:card", content: "summary" }],
	],
	themeConfig: {
		search: {
			provider: "local",
		},

		outline: [2, 3],

		editLink: {
			pattern: "https://github.com/yippee-fun/phlex.fun/edit/main/:path",
		},

		nav: [
			{ text: "Home", link: "/" },
			{ text: "Docs", link: "/introduction/" },
			{ text: "Rails", link: "/rails/generators" },
			{ text: "Support", link: "https://www.rubyforum.org/tag/phlex/83" },
			{ text: "v1 Docs", link: "https://v1.phlex.fun" },
		],

		sidebar: [
			{
				text: "Introduction",
				collapsed: false,
				items: [
					{ text: "What is Phlex?", link: "/introduction/" },
					{ text: "Getting started", link: "/introduction/getting-started" },
					{ text: "Build your first page", link: "/introduction/tutorial" },
					{ text: "Coming from ERB", link: "/introduction/from-erb" },
				],
			},

			{
				text: "Writing HTML",
				collapsed: false,
				items: [
					{ text: "HTML elements", link: "/sgml/html-elements" },
					{ text: "Attributes", link: "/sgml/attributes" },
					{ text: "Text", link: "/sgml/text" },
					{ text: "Whitespace", link: "/sgml/whitespace" },
					{ text: "Comments", link: "/sgml/comments" },
					{ text: "Raw output", link: "/sgml/raw" },
					{ text: "Doctype", link: "/sgml/doctype" },
					{ text: "Helpers", link: "/sgml/helpers" },
					{ text: "SVG", link: "/sgml/svg-elements" },
					{ text: "Without a component", link: "/sgml/string-builder" },
				],
			},

			{
				text: "Components",
				collapsed: false,
				items: [
					{ text: "Rendering", link: "/components/rendering" },
					{ text: "Yielding", link: "/components/yielding" },
					{ text: "Kits", link: "/components/kits" },
					{ text: "Callbacks", link: "/components/callbacks" },
					{ text: "Context", link: "/components/context" },
					{ text: "Snippets", link: "/components/snippets" },
					{ text: "Testing", link: "/components/testing" },
				],
			},

			{
				text: "Rails",
				collapsed: false,
				items: [
					{ text: "Installation & generators", link: "/rails/generators" },
					{ text: "Adopting Phlex", link: "/rails/adopting-phlex" },
					{ text: "Views", link: "/rails/views" },
					{ text: "Helpers", link: "/rails/helpers" },
					{ text: "Layouts", link: "/rails/layouts" },
					{ text: "Forms", link: "/rails/forms" },
				],
			},

			{
				text: "Beyond the basics",
				collapsed: false,
				items: [
					{ text: "Fragments", link: "/components/fragments" },
					{ text: "Caching", link: "/components/caching" },
					{ text: "Streaming", link: "/components/streaming" },
					{ text: "CSV", link: "/csv/" },
				],
			},

			{
				text: "Reference",
				collapsed: false,
				items: [
					{ text: "Errors", link: "/miscellaneous/errors" },
					{ text: "Structural safety", link: "/miscellaneous/structural-safety" },
					{ text: "Literal properties", link: "/miscellaneous/literal-properties" },
					{ text: "Under the hood", link: "/miscellaneous/under-the-hood" },
					{ text: "Attribute caching", link: "/design/attribute-caching" },
					{ text: "Upgrading to v2", link: "/miscellaneous/v2-upgrade" },
				],
			},

			{
				text: "Project",
				collapsed: false,
				items: [
					{ text: "Community", link: "/project/community" },
					{ text: "GitHub", link: "https://github.com/yippee-fun/phlex" },
				],
			},
		],

		socialLinks: [{ icon: "github", link: "https://github.com/yippee-fun/phlex" }],

		footer: {
			message: "Released under the MIT License.",
			copyright:
				'Made by <a href="https://joel.drapper.me">Joel Drapper</a>, <a href="https://github.com/willcosgrove">Will Cosgrove</a> and dozens of other <a href="https://github.com/yippee-fun/phlex/graphs/contributors">contributors</a>.',
		},
	},
});
