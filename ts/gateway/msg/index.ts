// route /msg
import * as express from 'express';
import * as core from 'express-serve-static-core';
import * as tr from 'rcf-message-router';

let router = express.Router();

let destAuthRouter = express.Router();

/*
destAuthRouter.post("/topic/gateway", tr.destAuth((req: tr.DestAuthRequest, res: tr.DestAuthResponse) => {
    res.accept();
}));

destAuthRouter.get("/topic/:InstanceId", tr.destAuth((req: tr.DestAuthRequest, res: tr.DestAuthResponse) => {
    res.accept();
}));
*/

let options: tr.Options = {
    connKeepAliveIntervalMS: 10000
    //connKeepAliveIntervalMS: 0
    ,dispatchMsgOnClientSend: false
    //,destinationAuthorizeRouter: destAuthRouter
}

let ret = tr.get('/', options);
router.use('/events', ret.router); // topic subscription endpoint is available at /events from this route
let connectionsManager = ret.connectionsManager;

connectionsManager.on('client_connect', (req:express.Request, connection: tr.ITopicConnection) : void => {
    console.log('client ' + connection.id + ' @ ' + connection.remoteAddress + ' connected to the SSE topic endpoint');
}).on('client_disconnect', (req:express.Request, connection: tr.ITopicConnection) : void => {
    console.log('client ' + connection.id + ' @ ' + connection.remoteAddress +  ' disconnected from the SSE topic endpoint');
});

export {router as Router, connectionsManager as ConnectionsManager};