

export interface IServer {
    port: number
} 

export interface IMongoDb {
    host:string,
    port:number,
    database:string,
    mongo_uri:string
}

export interface IMusicFck {
    BaseUrl:string
}
export interface IServices {
    MusicFck:IMusicFck
}