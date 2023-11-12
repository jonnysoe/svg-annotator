# SVG Annotator

Primitive single-script (`JavaScript`) to annotate name into [SVG](https://www.w3.org/Graphics/SVG) image.
This can usually be helpful to annotate documents like certificates, name cards, invitation cards, etc.

## Requirements

- [nodejs](https://nodejs.org/en/download)

### Optional

- [inkscape](https://inkscape.org/release)
- [git](https://git-scm.com/downloads)
- [cURL](https://curl.se/download.html) - pre-installed on Windows and MacOS; Linux environment could either install curl (`sudo apt install -y curl`) or use the pre-installed [wget](https://www.gnu.org/software/wget/manual/wget.html) as alternative
- [yarn](https://classic.yarnpkg.com/lang/en/docs/install) (`npm install --global yarn`)

## Usage

Annotate `SVG` image formats with the names from user input argument or text file (for multiple names to different `SVG` files), based on the given `SVG` template.

Script Arguments:
- `name` (optional): Intended name for annotation, can be a name or a file, defaults to check if `names.txt` exists for list of names if none was provided.
- `template` (optional): `SVG` template to be annotated, defaults to check if `template.svg` exists to be annotated.
- `font` (optional): Font style, as long they are recognized by `inkscape`.

### Reference
Check out [sample/names.txt](./sample/names.txt) and [sample/template.svg](./sample/template.svg).

### Getting Started
1. Start with either of the following, then `cd` into the directory.
    - git clone
        ```
        git clone git@github.com:jonnysoe/svg-annotator.git && cd svg-annotator
        ```
    - download the single [svg-annotator.js](./svg-annotator.js) script into a temp directory
        ```
        mkdir svg-annotator && cd svg-annotator && curl -L -o svg-annotator.js https://raw.githubusercontent.com/jonnysoe/svg-annotator/main/svg-annotator.js
        ```
2. Prepare name list by the name `names.txt` (separated by new lines) in project root directory.
3. Prepare a template svg file by the name `template.svg`.
4. Run this command:
    ```
    node svg-annotator.js
    ```
   Alternatively, can run the following when [package.json](./package.json) is present
    ```
    node .
    ```
    ```
    npm run start
    ```
    ```
    yarn run start
    ```
    NOTE: Single file svg-annotator.js will still generate [package.json](./package.json) file.

### TODO
- Annotate a single `SVG` image with multiple names, might wanna change `names.txt` to `CSV` format where names on the same row separated by comma will appear on the same `SVG` file

## License

Copyright © 2023 Jonny Soe.

Licensed under [the MIT License (MIT)](https://opensource.org/licenses/MIT) or see [LICENSE](./LICENSE.md) file for details.