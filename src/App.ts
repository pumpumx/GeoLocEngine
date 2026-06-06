import cors from 'cors'
import cookieParser from 'cookie-parser';
import express from "express";
import { NODE_ENV, PORT } from "./config/index.js";
import { Routes } from "./typings/routes.js";



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
  }

  public listen() {
    this.app.listen(this.port, () => {
      console.info(`=================================`);
      console.info(`======= ENV: ${this.env} =======`);
      console.info(`🚀 App listening on the port ${this.port}`);
      console.info(`=================================`);
    });
  }

  public getServer(){
    return this.app
  }

  private initialiseMiddlewares(){

    this.app.use(cors())
    this.app.use(cookieParser())

  }
}

export default App
