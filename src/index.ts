import App from "./App.js";
import ExternalRoutes from "./routes/external.routes.js";
import InternalRoutes from "./routes/internal.routes.js";




export const app = new App([new ExternalRoutes(),new InternalRoutes()])
app.listen()