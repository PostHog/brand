# Make a PostHog blog image

> {{description}}

HTML version: {{site}}/tools/images/blog · All image makers: {{site}}/tools/images.md

The title wraps on its own (Enter or `|` forces a break). Type a word or phrase from it as the highlight. Add up to 3 authors, each on their own line. The hoggie is matched to the title and the description unless you pick one; the SEO / AEO switch limits hoggies and colors to that set. The description has no field in the maker: it comes only from a link (`description` below, or a shared `?image=` link), and it isn't drawn on the image.

The image is drawn in the browser and downloaded as a PNG. Every setting lives in the page link (`?image=`), so a link reopens the same image. Uploaded files stay in the browser and aren't part of the link.

## Make an image from a link

To open the maker with a new image already made, add `#new-` and a hex-encoded UTF-8 JSON object to the page URL: `{{site}}/tools/images/blog#new-<hex>`. Give the link to the author, who changes the image and downloads it. In a browser with WebMCP, the `make_blog_image` tool takes the same keys and returns a preview (see {{site}}/tools/images.md).

| Key                                        | Value                                                                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `title`                                    | Required. The post title.                                                                                              |
| `description`                              | One or two sentences about the post. Not drawn; it helps match the hoggie.                                             |
| `highlight`                                | A word or phrase from the title.                                                                                       |
| `author` or `authors`                      | A name, or a list of up to 3 names.                                                                                    |
| `hoggie`                                   | A hoggie's name. Leave it out to match one automatically.                                                              |
| `hoggieSize`, `hoggieX`, `hoggieY`, `flip` | Size in percent (75–125) and moves (-20–20; right and up are positive), and a mirror.                                  |
| `color`                                    | `blue`, `yellow`, `teal`, `purple`, `corn-blue`, `coral`, `tangerine`, `lime`, `green`, `violet`, `cobalt` or `lemon`. |
| `tone`                                     | `light`, `mid` or `dark`.                                                                                              |
| `highlightColor`                           | `blue`, `teal`, `purple`, `tangerine`, `green` or `white` (`white` only on a `dark` tone).                             |
| `textColor`                                | `dark` or `white`: the text on a `mid` tone.                                                                           |
| `seo`                                      | `true` for an SEO / AEO post: limits the hoggies and colors to that set.                                               |

```bash
node -e 'console.log("{{site}}/tools/images/blog#new-" + Buffer.from(JSON.stringify({ title: process.argv[1], description: process.argv[2] })).toString("hex"))' "Post title" "One sentence about the post"
```

{{license}}
