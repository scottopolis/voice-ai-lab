import 'dotenv/config'
import { createApp } from './app.js'
const port=Number(process.env.API_PORT||8787)
createApp().listen(port,'127.0.0.1',()=>console.log(`Voice lab API listening on port ${port}`))
