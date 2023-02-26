const http = require('http')
const { WarpFactory, LoggerFactory } = require('warp-contracts')

LoggerFactory.INST.logLevel('fatal')
const warp = WarpFactory.forMainnet()
const prop = k => o => o[k]

http.createServer(function (req, res) {
  const [path, params, ...rest] = req.url.split('?')
  if (path === '/contract') {

    const searchparams = new URLSearchParams(params)
    const contract = searchparams.get('id')
    if (contract && contract.length === 43) {
      console.time('warp:' + contract)
      readState(contract)
        .then(results => {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(results))
          console.timeEnd('warp:' + contract)
        })
    } else {
      res.writeHead(404)
      res.end('ERROR Contract not found')
    }
  } else {
    res.end('cache.permaweb.tools (SmartWeave Contract Cache Service')
  }
})
  .listen(3000)


async function readState(contract) {
  await warp.contract(contract)
    .syncState('https://dre-2.warp.cc/contract', { validity: true })
    .catch(console.log.bind(console))

  return warp.contract(contract)
    .setEvaluationOptions({
      internalWrites: true,
      allowBigInt: true,
      unsafeClient: 'skip',
      useVM2: true
    })
    .readState()
    .then(r => ({
      sortKey: r.sortKey,
      state: r.cachedValue.state,
      status: 'evaluated'
    }))
}