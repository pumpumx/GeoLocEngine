import cors from 'cors'
import cookieParser from 'cookie-parser';
import express from "express";
import { NODE_ENV, PORT } from "./config/index.js";
import { Routes } from "./typings/routes.js";
import { connectWithMongo } from './databases/index.js';



class App {
  public env: string;
  public port: number;
  public app: express.Application;
  private routes:Routes[]

  constructor(routes: Routes[]) {
    this.env = NODE_ENV;
    this.port = PORT;
    this.app = express();
    this.routes = routes


    this.initialiseMiddlewares()
    this.initialiseRoutes()

  }

  public listen() {
    this.app.listen(this.port, () => {
      console.info(`=================================`);
      console.info(`======= ENV: ${this.env} =======`);
      console.info(`🚀 App listening on the port ${this.port}`);
      console.info(`=================================`);
    });
    this.initialiseMongo()
  }

  public getServer(){
    return this.app
  }

  private initialiseRoutes(){
    this.routes.forEach((route)=>{
      this.app.use('/',route.router)
      console.log(route)
    })
  }

  private async initialiseMongo(){
    await connectWithMongo()
  }

  private initialiseMiddlewares(){

    this.app.use(cors())
    this.app.use(cookieParser())
    this.app.use(express.json())
    this.app.use(express.urlencoded({limit:'64kb'}))

  }
}

export default App
