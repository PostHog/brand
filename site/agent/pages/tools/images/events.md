# Make a PostHog event image

> {{description}}

HTML version: {{site}}/tools/images/events · All image makers: {{site}}/tools/images.md

Wrap words in `**double stars**` to keep only those bold. Set the date, time and location, add up to 4 partner logos for the footer, and pick a hoggie, upload your own picture, or both.

The image is drawn in the browser and downloaded as a PNG. Every setting lives in the page link (`?image=`), so a link reopens the same image. Uploaded files stay in the browser and aren't part of the link.

## Make an image from a link

To open the maker with a new image already made, add `#new-` and a hex-encoded UTF-8 JSON object to the page URL: `{{site}}/tools/images/events#new-<hex>`. Give the link to the person the image is for, who changes it and downloads it. In a browser with WebMCP, the `make_event_image` tool takes the same keys and returns a preview (see {{site}}/tools/images.md).

| Key                                        | Value                                                                                                                                                          |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`                                    | Required. The headline. `\n` breaks a line; `**words**` stay bold and the rest go lighter.                                                                     |
| `headline`                                 | `fit` (each line fills the width) or `even` (one size).                                                                                                        |
| `date`                                     | `YYYY-MM-DD`.                                                                                                                                                  |
| `start`, `end`                             | 24-hour `HH:MM`.                                                                                                                                               |
| `timezone`                                 | Shown after the time, e.g. `GMT`.                                                                                                                              |
| `location`                                 | e.g. `Venue, City`.                                                                                                                                            |
| `color`, `calendarColor`                   | `blue`, `yellow`, `teal`, `purple`, `corn-blue`, `coral`, `tangerine`, `lime`, `green`, `violet`, `cobalt` or `lemon`.                                         |
| `footerColor`                              | A color above, or `white`.                                                                                                                                     |
| `darkText`                                 | `true` for dark text.                                                                                                                                          |
| `hoggie`                                   | A hoggie's name or slug. Leave it out for none.                                                                                                                |
| `photoUrl`                                 | A photo, in front of the hoggie. An https URL whose server allows cross-origin requests (res.cloudinary.com does), a `data:image` URL, or a path on this site. |
| `logos`                                    | Up to 4 partner logo URLs, as for `photoUrl`.                                                                                                                  |
| `hoggieSize`, `hoggieX`, `hoggieY`, `flip` | Size in percent (50–200) and moves (-50–50; right and up are positive), and a mirror. Left out, the hoggie is placed clear of the date, time and location.     |
| `logoColor`                                | `auto`, `white` or `black`.                                                                                                                                    |

```bash
node -e 'console.log("{{site}}/tools/images/events#new-" + Buffer.from(JSON.stringify({ title: "Hog **meetup**\nBerlin", date: "2027-01-20", start: "19:00", location: "Berlin", hoggie: "party" })).toString("hex"))'
```

{{license}}
