import server from './server'

server.listen(1337, () => console.log(require('fs').readFileSync('logo.txt', 'utf8')))