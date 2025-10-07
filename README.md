# NVM LOL YOU CAN'T USE SPOTIFY API ANYMORE OUTSIDE OF DEV MODE (25 max users which I have to add manually) unless I have 250k MAUs :). Apple Music could be an option but I don't even use it and it requires a 100 USD feed. Sooo this is abandoned.  

# SomaFM Spotify Track Adder

A browser extension that adds a button to SomaFM's web player to save tracks to a Spotify library.

#### Initial Authentication + Save

![Demo of first time song add](promo/gifs/spotify-login.gif)

#### Standard Operation

![Demo of use, icons and tooltips](promo/gifs/icon-tooltips.gif)

## Privacy

See [Privacy Policy](PRIVACY_POLICY.md).

## Build / Run Locally

```bash
git clone https://github.com/jamisonrobey/somafm-track-adder.git
cd somafm-track-adder
pnpm i

# run dev server
pnpm dev
# pnpm dev:firefox

# build extension which you can load into your browser manually
pnpm build
# pnpm build:firefox

cd build/.output/
```
