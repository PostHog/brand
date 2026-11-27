# Make a PostHog image

> {{description}}

HTML version: {{site}}/tools/images · All docs for agents: {{site}}/llms.txt

The image makers draw PostHog images in the browser from the brand's own hoggies, colors and RoundHog. They have no backend: each one keeps the images you make in this browser's list, every setting lives in the page link (`?image=`), and you download the finished image as a PNG.

## Makers

{{makers}}

## For agents

Each maker makes a new image from a link: its page URL plus `#new-` and the settings as hex-encoded JSON (each maker's page lists the keys). Hand the link to the person the image is for.

Agents that don't browse can make images through the MCP server, {{site}}/mcp (see {{site}}/index.md): `make_blog_image`, `make_event_image`, `make_build_mode_image` and `make_customer_story_image` draw the image with the maker on the server and return a preview, the full-size PNG's URL and the maker link.

Any saved image (a maker link's `?image=` value) is also a PNG at `{{site}}/render/<maker>.png?image=<value>`, drawn by the maker on the server: add `&scale=2` for 2x, and `&size=LinkedIn`, `Website`, `X` or `Substack` for a build mode size. Pictures in it must come from this site, res.cloudinary.com or posthog.com, or be `data:image` URLs.

In a browser with WebMCP (`document.modelContext`), the site also registers one tool per maker: `make_blog_image`, `make_event_image`, `make_build_mode_image` and `make_customer_story_image`. They take the same keys, draw the image with the maker, and return a preview to check, the `?image=` link that reopens it, and warnings (a hoggie name that didn't match, a logo that didn't load). Pass `show: true` to open the image in the maker, saved in the user's list, or `download: true` to save the PNG. Pictures (logos, photos) are URLs whose server allows cross-origin requests, such as posthog.com's images on res.cloudinary.com.

## Using the images

The hoggies, colors and type are PostHog's brand assets. Make images for PostHog's own blog, newsletter, events and social posts.

{{license}}
