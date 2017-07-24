import * as express from 'express';
import {IWebServerConfig, startServer} from 'express-web-server';
import * as bodyParser from "body-parser";
import noCache = require('no-cache-express');
import * as prettyPrinter from 'express-pretty-print';
import {getAllExtensionModules} from "./extensions";
import {ExtensionModuleExport, AppGlobal, getRequestData, ExtensionModule} from "crowdsourcing-api";
import * as rcf from "rcf";
import * as node$ from "rest-node";
import {get as getCGILauncher} from "./cgi-child-process";

let NODE_PATH = process.env["NODE_PATH"];
let Port = (process.env["PORT"] ? parseInt(process.env["PORT"]) : 80);

console.log("NODE_PATH=" + NODE_PATH);
console.log("Port=" + Port.toString());

if (!NODE_PATH) {
    console.error("env['NODE_PATH'] is not set");
    process.exit(1);
}

let app = express();

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

let selfApi = new rcf.AuthorizedRestApi(node$.get(), {instance_url: "http://127.0.0.1:" + Port.toString()});
let selfApiRoute = selfApi.mount("/");
let g: AppGlobal = {
    selfApiRoute
    ,cgiChildProcessLauncher: getCGILauncher()
};

app.set("global", g);   // set the global object

let serviceRouter = express.Router();

function getSetExtensionMiddleware(extension: ExtensionModule) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        let rqd = getRequestData(req);
        rqd.set("__ThisExtension__", extension);
        next();
    };
}

let extensionModules = getAllExtensionModules(NODE_PATH);
for (let i in extensionModules) {   // for each module
    let extension = extensionModules[i];
    let module = extension.module;
    try {
        let moduleExport: ExtensionModuleExport = require(module);
        let moduleRouter = express.Router();
        serviceRouter.use("/" + module, getSetExtensionMiddleware(extension), moduleRouter);
        moduleExport.init(moduleRouter);
    } catch(e) {

    }
}

app.use("/services", serviceRouter);

app.get("/doc/api-listing", (req: express.Request, res: express.Response) => {
    res.jsonp(extensionModules);
})

console.log(new Date().toISOString() + ": starting the crowdsourcing api server...");

startServer({http:{port: Port, host: "127.0.0.1"}}, app, (secure:boolean, host:string, port:number) => {
    let protocol = (secure ? 'https' : 'http');
    console.log(new Date().toISOString() + ': crowdsourcing api server listening at %s://%s:%s', protocol, host, port);
}, (err:any) => {
    console.error(new Date().toISOString() + ': !!! crowdsourcing api server error: ' + JSON.stringify(err));
    process.exit(1);
});

/*
import {Readable} from "stream";

let command = "curl https://www.yahoo.com";
//let command = "xxxyyyzzz https://www.yahoo.com";

getCGILauncher().exec(command)
.then((stdout: Readable) => {
    stdout.pipe(process.stdout);
}).catch((err: any) => {
    console.log("!!! error :"  + JSON.stringify(err));
});
*/