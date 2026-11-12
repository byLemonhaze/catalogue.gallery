# Header signature

`/gallery-signature.svg` typesets `.gallery` in Caveat, weight 600. It is an outlined wordmark, not a site-wide font. The full font is not shipped. Sora remains the visible loading/error fallback and the accessible text label is always present.

Source: https://github.com/google/fonts/blob/main/ofl/caveat/Caveat%5Bwght%5D.ttf
Font revision: a85fc09e44c70c7159761adfdc9d5dd007792c15 (Caveat 2.000).
Copyright 2014 The Caveat Project Authors (https://github.com/googlefonts/caveat).
License: SIL Open Font License 1.1; see `caveat-OFL.txt`.

Reproduce on macOS after downloading the upstream font:

```sh
swift scripts/generate-gallery-signature.swift '/path/to/Caveat[wght].ttf' > public/gallery-signature.svg
```

No font installation, application runtime dependency, or remote font request is needed.
