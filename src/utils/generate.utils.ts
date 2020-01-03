import intformat from 'biguint-format'
import FlakeId from 'flake-idgen'

const flake = new FlakeId({
	epoch: new Date(2019, 7, 31)
})

export const generateFlake = () => intformat(flake.next(), 'dec')
