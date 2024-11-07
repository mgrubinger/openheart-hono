# openheart-hono

Implementation of the [Open Heart Protocol](https://openheart.fyi/) using cloudflare KV.

```shell
npm install
npm run dev
```

Deploy to cloudflare:

```shell
npm run deploy
```

## Testing

Post an emoji for a url:

```shell
curl -X POST -d '🤣' 'http://localhost:8787/grooovinger.com/blog/one'
```

Get a list of emojis for a url

```shell
curl -X GET 'http://localhost:8787/grooovinger.com/blog/one'
```