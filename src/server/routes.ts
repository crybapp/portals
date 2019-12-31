import { Application } from 'express'

export default (app: Application) => {
	app.use(require('../controllers/index.controller').default)
}
