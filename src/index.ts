import server from './server'

const port = process.env.PORT || 1337
server.listen(port, () => console.log(require('fs').readFileSync('logo.txt', 'utf8')))
