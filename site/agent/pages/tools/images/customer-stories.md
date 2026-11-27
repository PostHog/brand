# Make a PostHog customer story image

> {{description}}

HTML version: {{site}}/tools/images/customer-stories · All image makers: {{site}}/tools/images.md

Type the company's name or website and select Find logo to look it up in the posthog.com/customers logos. Upload a logo if it isn't there. The logo can match the text color or keep its own colors.

The image is drawn in the browser and downloaded as a PNG. Every setting lives in the page link (`?image=`), so a link reopens the same image. Uploaded files stay in the browser and aren't part of the link.

## Make an image from a link

To open the maker with a new image already made, add `#new-` and a hex-encoded UTF-8 JSON object to the page URL: `{{site}}/tools/images/customer-stories#new-<hex>`. Give the link to the person the image is for, who changes it and downloads it. In a browser with WebMCP, the `make_customer_story_image` tool takes the same keys and returns a preview (see {{site}}/tools/images.md).

| Key                                        | Value                                                                                                                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `company`                                  | Required. The company's name or website, looked up in the posthog.com/customers logos.                                                                                  |
| `logoUrl`                                  | The logo, when the maker doesn't have it. An https URL whose server allows cross-origin requests (res.cloudinary.com does), a `data:image` URL, or a path on this site. |
| `logoMode`                                 | `match` (the text color) or `original` (its own colors; use it for a logo on a filled plate).                                                                           |
| `hoggie`                                   | A hoggie's name or slug. Leave it out to pick one for the company.                                                                                                      |
| `hoggieSize`, `hoggieX`, `hoggieY`, `flip` | Size in percent (75–125) and moves (-20–20; right and up are positive), and a mirror.                                                                                   |
| `color`                                    | `blue`, `yellow`, `teal`, `purple`, `corn-blue`, `coral`, `tangerine`, `lime`, `green`, `violet`, `cobalt` or `lemon`.                                                  |
| `tone`                                     | `light`, `mid` or `dark`.                                                                                                                                               |
| `ink`                                      | `light` or `dark` text.                                                                                                                                                 |

```bash
node -e 'console.log("{{site}}/tools/images/customer-stories#new-" + Buffer.from(JSON.stringify({ company: process.argv[1] })).toString("hex"))' "Supabase"
```

{{license}}
