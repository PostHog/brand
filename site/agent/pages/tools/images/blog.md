# Make a PostHog blog image

> {{description}}

HTML version: {{site}}/tools/images/blog · All image makers: {{site}}/tools/images.md

The title wraps on its own (Enter or `|` forces a break). Type a word or phrase from it as the highlight. Add up to 3 authors, each on their own line. The hoggie is matched to the title and the description unless you pick one; the SEO / AEO switch limits hoggies and colors to that set. The description is not drawn on the image.

The image is drawn in the browser and downloaded as a PNG. Every setting lives in the page link (`?image=`), so a link reopens the same image. Uploaded files stay in the browser and aren't part of the link.

## Make an image from a link

To open the maker with a new image already made, add `#new-` and a hex-encoded UTF-8 JSON object to the page URL: `{{site}}/tools/images/blog#new-<hex>`. Give the link to the author, who changes the image and downloads it.

| Key                   | Value                                                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `title`               | Required. The post title.                                                                                              |
| `description`         | One or two sentences about the post. Not drawn; it helps match the hoggie.                                             |
| `highlight`           | A word or phrase from the title.                                                                                       |
| `author` or `authors` | A name, or a list of up to 3 names.                                                                                    |
| `hoggie`              | A hoggie's name. Leave it out to match one automatically.                                                              |
| `color`               | `blue`, `yellow`, `teal`, `purple`, `corn-blue`, `coral`, `tangerine`, `lime`, `green`, `violet`, `cobalt` or `lemon`. |
| `tone`                | `light`, `mid` or `dark`.                                                                                              |
| `highlightColor`      | `blue`, `teal`, `purple`, `tangerine`, `green` or `white` (`white` only on a `dark` tone).                             |

```bash
node -e 'console.log("{{site}}/tools/images/blog#new-" + Buffer.from(JSON.stringify({ title: process.argv[1], description: process.argv[2] })).toString("hex"))' "Post title" "One sentence about the post"
```

{{license}}
