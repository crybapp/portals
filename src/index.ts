import server from './server'
import {testFunction} from './drivers/digitalocean.driver'

//server.listen(1337, () => console.log(require('fs').readFileSync('logo.txt', 'utf8')))
server.listen(1337)

testFunction()