# Image maker references

Snapshots of what the image makers (`site/src/image-maker/`) draw right now, one PNG per case below. They're a quick way to check your own work: download a case before and after a change and see whether only what you meant to change, changed.

They aren't a spec and nothing in CI checks them. When you change how a maker looks on purpose, replace the affected references in the same commit, so the next person compares against the new look. Add, remove or rename cases whenever that helps.

## Check a change

1. Run the site: `pnpm dev:site` (from the repo root).
2. Open a case link below, press the maker's download button, and compare the download with its reference:

   ```sh
   cd site
   node scripts/compare-png.ts tests/makers/blog/seo/what-is-product-analytics.png ~/Downloads/what-is-product-analytics.png
   ```

   It prints `Match` or how many pixels differ. References are stored at half size to keep the repo small, so the download is scaled to match; a change of a few pixels at full size still shows.

Check the cases of the maker you changed, or all of them if you changed shared code (`editor/`).

## Update or add a reference

When a drawing changed on purpose, look at the new download, then save it over the reference (`--save` stores it at half size):

```sh
node scripts/compare-png.ts --save ~/Downloads/what-is-product-analytics.png tests/makers/blog/seo/what-is-product-analytics.png
```

To add a case, make the image in the maker, press **Copy link**, add the link to the list below, and `--save` its download into `tests/makers/<maker>/<case>/`. Uploaded files aren't part of a link, so a case that needs a picture points at a file the site serves (`/image-makers/…`) instead. If a maker's saved settings change shape, update the case links too (an old link still opens, with new settings at their defaults).

The references were made on macOS. Other systems draw text slightly differently, so on Linux or Windows, download the cases from the unchanged code first and compare against those.

## Cases

Links are for the local dev server.

### Build mode

- **[co-authors](http://localhost:5173/tools/images/build-mode?image=eyJ0aXRsZSI6IlNoaXBwaW5nIGEgd2hvbGV8cHJvZHVjdCBpbiBhIHdlZWtlbmQgd2l0aCBhZ2VudHMiLCJobFRleHQiOiJhIHdlZWtlbmQiLCJoaWdobGlnaHQiOiJ0ZWFsIiwiYXV0aG9yIjoiSWFuIFZhbmFnYXMiLCJpbWdJZCI6IiIsImltZ05hbWUiOiIiLCJpbWdTaXplIjoxMDAsImltZ1giOjAsImltZ1kiOjAsImZsaXAiOmZhbHNlLCJmaXQiOnt9LCJncmlkU2l6ZSI6OTYsInNob3dSaXAiOnRydWUsInNob3dMb2dvIjp0cnVlLCJsb2dvU2l6ZSI6MTUwLCJjb0F1dGhvcnMiOlsiSmluYSBZb29uIiwiQ2xlbyBMYW50Il19)**: `build-mode/co-authors/shipping-a-whole-product-in-a-weekend-with-agents-linkedin.png`, `build-mode/co-authors/shipping-a-whole-product-in-a-weekend-with-agents-substack.png`, `build-mode/co-authors/shipping-a-whole-product-in-a-weekend-with-agents-website.png`, `build-mode/co-authors/shipping-a-whole-product-in-a-weekend-with-agents-x.png`
- **[image-per-size](http://localhost:5173/tools/images/build-mode?image=eyJ0aXRsZSI6IldpdGggYW4gaW1hZ2UiLCJobFRleHQiOiJpbWFnZSIsImhpZ2hsaWdodCI6InB1cnBsZSIsImF1dGhvciI6IkNsZW8gTGFudCIsImltZ0lkIjoiL2ltYWdlLW1ha2Vycy9idWlsZC9jbGVvLWxhbnQucG5nIiwiaW1nTmFtZSI6ImNsZW8tbGFudCIsImltZ1NpemUiOjgwLCJpbWdYIjoxMjAsImltZ1kiOi02MCwiZmxpcCI6dHJ1ZSwiZml0Ijp7IlgiOnsic2l6ZSI6MTQwLCJ4IjotNDAsInkiOjMwLCJyIjoxMn0sIlN1YnN0YWNrIjp7InNpemUiOjYwfX0sImdyaWRTaXplIjo2NCwic2hvd1JpcCI6dHJ1ZSwic2hvd0xvZ28iOnRydWUsImxvZ29TaXplIjoxMjB9)**: `build-mode/image-per-size/with-an-image-linkedin.png`, `build-mode/image-per-size/with-an-image-substack.png`, `build-mode/image-per-size/with-an-image-website.png`, `build-mode/image-per-size/with-an-image-x.png`

### Blog

- **[seo](http://localhost:5173/tools/images/blog?image=eyJ0aXRsZSI6IldoYXQgaXMgcHJvZHVjdCBhbmFseXRpY3M_IiwiaGxUZXh0IjoicHJvZHVjdCBhbmFseXRpY3MiLCJzdWIiOiIiLCJkZXNjcmlwdGlvbiI6IiIsImF1dGhvciI6Ik5hdGFsaWEgQW1vcmltIiwiaG9nIjoiRmxvYXQiLCJob2dTaXplIjoxMDAsImhvZ1giOjAsImhvZ1kiOjAsImZsaXAiOmZhbHNlLCJjb2xvciI6ImJsdWUiLCJ0b25lIjoibGlnaHQiLCJtaWRUZXh0IjoiZGFyayIsImhpZ2hsaWdodCI6InB1cnBsZSIsInNlbyI6dHJ1ZX0)**: `blog/seo/what-is-product-analytics.png`
- **[mid-white](http://localhost:5173/tools/images/blog?image=eyJ0aXRsZSI6IldoeSB5b3VyfHdhcmVob3VzZSBiaWxsIGRvdWJsZWQiLCJobFRleHQiOiJiaWxsIGRvdWJsZWQiLCJzdWIiOiIiLCJkZXNjcmlwdGlvbiI6IiIsImF1dGhvciI6IkZpcnN0IExhc3QiLCJob2ciOiJCdXJuaW5nIE1vbmV5IiwiaG9nU2l6ZSI6MTIwLCJob2dYIjotMTAsImhvZ1kiOjgsImZsaXAiOnRydWUsImNvbG9yIjoiY29iYWx0IiwidG9uZSI6Im1pZCIsIm1pZFRleHQiOiJ3aGl0ZSIsImhpZ2hsaWdodCI6IndoaXRlIiwiY29BdXRob3JzIjpbIkFuYSBMb3BleiIsIlNhbSBLaW0iXX0)**: `blog/mid-white/why-your-warehouse-bill-doubled.png`
- **[subheading-auto](http://localhost:5173/tools/images/blog?image=eyJ0aXRsZSI6IkZhc3RlciBTUUwgZm9yIGV2ZXJ5b25lIiwiaGxUZXh0IjoiU1FMIiwic3ViIjoiQSBndWlkZSB0byAqKndyaXRpbmcgZmFzdGVyKiogcXVlcmllcyB3aXRob3V0IHRoZSAqKnBhaW4qKiIsImRlc2NyaXB0aW9uIjoic3FsIHF1ZXJpZXMgYW5kIGpvaW5zIiwiYXV0aG9yIjoiTGVlIFBhcmsiLCJob2ciOiJBdXRvIChtYXRjaCB0aXRsZSkiLCJob2dTaXplIjoxMDAsImhvZ1giOjAsImhvZ1kiOjAsImZsaXAiOmZhbHNlLCJjb2xvciI6ImNvcmFsIiwidG9uZSI6Im1pZCIsIm1pZFRleHQiOiJkYXJrIiwiaGlnaGxpZ2h0IjoidGVhbCJ9)**: `blog/subheading-auto/faster-sql-for-everyone.png`

### Events

- **[bold-even](http://localhost:5173/tools/images/events?image=eyJ0aXRsZSI6IioqRlJFRSoqIFBJWlpBfGFuZCAqKmxpZ2h0bmluZyoqIHRhbGtzIiwiaGVhZGxpbmUiOiJldmVuIiwiZGF0ZSI6IjIwMjYtMTItMDMiLCJzdGFydCI6IjE4OjAwIiwiZW5kIjoiMjE6MDAiLCJ0eiI6IiIsImxvY2F0aW9uIjoiVmVudWUsIENpdHkiLCJiZyI6InB1cnBsZSIsImNhbCI6ImxpbWUiLCJmb290ZXIiOiJ3aGl0ZSIsImhvZyI6IkNoZWYiLCJob2dTaXplIjoxNDAsImhvZ1giOi0yMCwiaG9nWSI6MTAsImZsaXAiOnRydWUsImhsU2NhbGUiOjEzMCwiZ2xvdyI6dHJ1ZSwibG9nb3MiOltdLCJjYWxGbGlwIjp0cnVlfQ)**: `events/bold-even/free-pizza-and-lightning-talks-2026-12-03.png`
- **[photo-and-logos](http://localhost:5173/tools/images/events?image=eyJ0aXRsZSI6IllvdXIgZXZlbnRcbnRpdGxlIGdvZXNcbmhlcmUiLCJoZWFkbGluZSI6ImZpdCIsImRhdGUiOiIyMDI2LTEyLTAzIiwic3RhcnQiOiIxODowMCIsImVuZCI6IjIxOjAwIiwidHoiOiIiLCJsb2NhdGlvbiI6IlZlbnVlLCBDaXR5IiwiYmciOiJncmVlbiIsImNhbCI6ImNvYmFsdCIsImZvb3RlciI6IndoaXRlIiwiaG9nIjoiQ2FrZSIsImhvZ1NpemUiOjEwMCwiaG9nWCI6MCwiaG9nWSI6MCwiZmxpcCI6ZmFsc2UsImhsU2NhbGUiOjEwMCwiZ2xvdyI6ZmFsc2UsImxvZ29zIjpbeyJpZCI6Ii9pbWFnZS1tYWtlcnMvY3VzdG9tZXJzL2FpcmJ1cy1saWdodC5zdmciLCJuYW1lIjoiYWlyYnVzLWxpZ2h0In0seyJpZCI6Ii9pbWFnZS1tYWtlcnMvY3VzdG9tZXJzL2NsZXJrLWxpZ2h0LnN2ZyIsIm5hbWUiOiJjbGVyay1saWdodCJ9LHsiaWQiOiIvaW1hZ2UtbWFrZXJzL2N1c3RvbWVycy9jcmVhdGlmeS1saWdodC5wbmciLCJuYW1lIjoiY3JlYXRpZnktbGlnaHQifV0sInBob3RvIjp7ImlkIjoiL2ltYWdlLW1ha2Vycy9idWlsZC9qaW5hLXlvb24ucG5nIiwibmFtZSI6ImppbmEteW9vbiIsInNpemUiOjEwMCwieCI6MCwieSI6MCwiZmxpcCI6ZmFsc2UsImZyb250Ijp0cnVlfX0)**: `events/photo-and-logos/your-event-title-goes-here-2026-12-03.png`

### Customer stories

- **[airbus-original](http://localhost:5173/tools/images/customer-stories?image=eyJjb21wYW55IjoiQWlyYnVzIiwibGliIjoiYWlyYnVzIiwidXBsb2FkIjpudWxsLCJsb2dvTW9kZSI6Im9yaWdpbmFsIiwibG9nb1NpemUiOjEwMCwiaG9nIjoiUm9ib3QiLCJob2dTaXplIjoxMTAsImhvZ1giOjUsImhvZ1kiOi0zLCJmbGlwIjp0cnVlLCJjb2xvciI6InRlYWwiLCJ0b25lIjoibGlnaHQiLCJpbmsiOiJkYXJrIn0)**: `customer-stories/airbus-original/customer-story-airbus.png`
- **[long-name](http://localhost:5173/tools/images/customer-stories?image=eyJjb21wYW55IjoiVGhlIEV4dHJlbWVseSBMb25nIEZpbnRlY2ggQmFua2luZyBDb21wYW55IE5hbWUgSW5jIiwibGliIjoiIiwidXBsb2FkIjpudWxsLCJsb2dvTW9kZSI6IiIsImxvZ29TaXplIjoxMDAsImhvZyI6IkF1dG8gKG1hdGNoIGNvbXBhbnkpIiwiaG9nU2l6ZSI6MTI1LCJob2dYIjowLCJob2dZIjowLCJmbGlwIjpmYWxzZSwiY29sb3IiOiJ2aW9sZXQiLCJ0b25lIjoibGlnaHQiLCJpbmsiOiJkYXJrIn0)**: `customer-stories/long-name/customer-story-the-extremely-long-fintech-banking-company-name-inc.png`
- **[uploaded-logo](http://localhost:5173/tools/images/customer-stories?image=eyJjb21wYW55IjoiVXBsb2FkIENvIiwibGliIjoiIiwidXBsb2FkIjp7ImlkIjoiL2ltYWdlLW1ha2Vycy9jdXN0b21lcnMvY3JlYXRpZnktbGlnaHQucG5nIiwibmFtZSI6ImNyZWF0aWZ5LWxpZ2h0In0sImxvZ29Nb2RlIjoiIiwibG9nb1NpemUiOjEwMCwiaG9nIjoiQXV0byAobWF0Y2ggY29tcGFueSkiLCJob2dTaXplIjoxMDAsImhvZ1giOjAsImhvZ1kiOjAsImZsaXAiOmZhbHNlLCJjb2xvciI6ImdyZWVuIiwidG9uZSI6Im1pZCIsImluayI6ImxpZ2h0In0)**: `customer-stories/uploaded-logo/customer-story-upload-co.png`
