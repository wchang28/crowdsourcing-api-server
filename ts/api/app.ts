import * as express from 'express';
import {IWebServerConfig, startServer} from 'express-web-server';
import * as af from "./app-factory";

let NODE_PATH = process.env["NODE_PATH"];
let Port = (process.argv.length >= 3 ? parseInt(process.argv[2]) : 80);

console.log("NODE_PATH=" + NODE_PATH);
console.log("Port=" + Port);

function startApiAppServer(appFactory: af.IAPIAppFactory, port: number, callback?: () => void) {
    console.log(new Date().toISOString() + ": starting the crowdsourcing api server...");
    startServer({http:{port, host: "127.0.0.1"}}, appFactory.create(), (secure:boolean, host:string, port:number) => {
        let protocol = (secure ? 'https' : 'http');
        console.log(new Date().toISOString() + ': crowdsourcing api server listening at %s://%s:%s', protocol, host, port);
        if (typeof callback === "function") callback();
    }, (err:any) => {
        console.error(new Date().toISOString() + ': !!! crowdsourcing api server error: ' + JSON.stringify(err));
        process.exit(1);
    });
}

let appFactory = af.get({SelfPort: Port});
startApiAppServer(appFactory, Port);