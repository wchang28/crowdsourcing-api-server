// app factory for the crowdsourcing api server
import * as events from "events";
import * as express from 'express';
import * as bodyParser from "body-parser";
import noCache = require('no-cache-express');
import * as prettyPrinter from 'express-pretty-print';
import {getAllExtensionModules} from "./extensions";
import {ExtensionModuleExport, AppGlobal} from "crowdsourcing-api";
import * as rcf from "rcf";
import * as node$ from "rest-node";

export interface IAPIAppFactory {
    readonly SelfPort: number;
    create() : express.Express;
    on(event: "app-just-created", listener: (app: express.Express) => void) : this;
}

export interface AppFactoryOptions {
    SelfPort: number;
};

class APIAppFactory extends events.EventEmitter implements IAPIAppFactory {
    constructor(private options: AppFactoryOptions) {
        super();
    }
    get SelfPort(): number {return this.options.SelfPort;}
    create() : express.Express {    // create the api app
        let NODE_PATH = process.env["NODE_PATH"];
        if (!NODE_PATH) throw "env['NODE_PATH'] is not set";
        
        let app = express();
        this.emit("app-just-created", app);

        /*
        app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            req.connection.setTimeout(20000);
            next();
        });
        */

        app.set('jsonp callback name', 'cb');

        app.use(noCache);
        app.use(bodyParser.text({"limit":"999mb"}));
        app.use(bodyParser.json({"limit":"999mb"}));
        app.use(prettyPrinter.get());

        app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            res.header('Access-Control-Allow-Origin', '*');
            next();
        });

        app.options("/*", (req: express.Request, res: express.Response) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH,HEAD');
            res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Content-Length,X-Requested-With');
            res.send(200);
        });

        let selfApi = new rcf.AuthorizedRestApi(node$.get(), {instance_url: "http://127.0.0.1:" + this.SelfPort.toString()});
        let selfApiRoute = selfApi.mount("/");
        let g: AppGlobal = {
            selfApiRoute
        };

        app.set("global", g);   // set the global object
        
        let serviceRouter = express.Router();

        let extensionModules = getAllExtensionModules(NODE_PATH);
        for (let i in extensionModules) {   // for each module
            let module = extensionModules[i].module;
            try {
                let moduleExport: ExtensionModuleExport = require(module);
                let moduleRouter = express.Router();
                serviceRouter.use("/" + module, moduleRouter);
                moduleExport.init(moduleRouter);
            } catch(e) {

            }
        }

        app.use("/services", serviceRouter);

        return app;
    } 
}

export function get(options: AppFactoryOptions) : IAPIAppFactory {return new APIAppFactory(options);}