import FlakeId from 'flake-idgen'
import intformat from 'biguint-format'

const flake = new FlakeId({
    epoch: new Date(2019, 7, 31)
})

export const generateFlake = () => intformat(flake.next(), 'dec')
