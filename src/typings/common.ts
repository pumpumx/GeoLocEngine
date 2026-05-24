

//Initial Config type
export type Config = {
    port: number;
    logLevel: string;
    db: {   
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
    };
    apiKeys: {
        googleMaps: string;
        openWeather: string;

    };
}

export type GeoLocation = {        
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
    timezone?: string;
    weather?: {
        temperature: number;
        description: string;
        humidity: number;
    };
}

