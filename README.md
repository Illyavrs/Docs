# Docs

Bilingual (English and Traditional Chinese) operator documentation for [Illyaverse](https://github.com/Illyavrs/Illyaverse), built with [Fumadocs](https://fumadocs.dev) on Next.js. It is a standalone project: it needs nothing from the Illyaverse Docker setup and can be hosted anywhere that runs a Node.js container or static Next.js output.

## Develop

```sh
npm install
npm run dev
```

Pages live in `content/docs`. English is the default; a translation sits beside it with a locale suffix, for example `deployment.md` and `deployment.zh-TW.md`. Link between pages with file-relative links such as `./deployment.md` so they resolve inside each language.

## Build and run

```sh
npm run build
npm start
```

Or as a container, with any reverse proxy in front:

```sh
docker build -t illyaverse-docs .
docker run -p 3000:3000 illyaverse-docs
```

## License

MIT, see [LICENSE](LICENSE).
