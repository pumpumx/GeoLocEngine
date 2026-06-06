

export interface IServer {
    port: number
} 

export interface IMongoDb {
    host:string,
    port:number,
    database:string,
    mongo_uri:string
}