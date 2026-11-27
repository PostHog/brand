# Make a build mode image

> {{description}}

HTML version: {{site}}/tools/images/build-mode · All image makers: {{site}}/tools/images.md

One image, four sizes: LinkedIn and Website (1920 × 1080), X (1500 × 600) and Substack (1200 × 630). Upload the main picture once and adjust it per size. Up to 3 authors show on LinkedIn and X.

The image is drawn in the browser and downloaded as a PNG. Every setting lives in the page link (`?image=`), so a link reopens the same image. Uploaded files stay in the browser and aren't part of the link.

## Make an image from a link

To open the maker with a new image already made, add `#new-` and a hex-encoded UTF-8 JSON object to the page URL: `{{site}}/tools/images/build-mode#new-<hex>`. Give the link to the person the image is for, who changes it and downloads it. In a browser with WebMCP, the `make_build_mode_image` tool takes the same keys and returns a preview (see {{site}}/tools/images.md).

| Key                   | Value                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| `title`               | Required. `                                                                                                                                            | `or`\n` breaks a line. |
| `highlight`           | A word or phrase from the title.                                                                                                                       |
| `highlightColor`      | `teal`, `purple`, `tangerine` or `blue`.                                                                                                               |
| `author` or `authors` | A name, or a list of up to 3. Only people with a photo in the maker.                                                                                   |
| `imageUrl`            | The picture on the grid. An https URL whose server allows cross-origin requests (res.cloudinary.com does), a `data:image` URL, or a path on this site. |

```bash
node -e 'console.log("{{site}}/tools/images/build-mode#new-" + Buffer.from(JSON.stringify({ title: process.argv[1], imageUrl: "/hoggies/robot.svg" })).toString("hex"))' "Post title"
```

{{license}}
