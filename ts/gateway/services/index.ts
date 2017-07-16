// route /services
import * as express from 'express';
import * as core from 'express-serve-static-core';
import {RequestData} from "../request-data";
import {StateMachineJSON, State, Server} from "../state-machine";
import * as msg from "../../message";
import {IApiServerMessenger} from "../api-server-messenger"
import {ITransaction, TransactionId} from "../msg-transaction";

let router = express.Router();
export {router as Router};

router.get("/", RequestData.Endware<StateMachineJSON>((rqd: RequestData) => Promise.resolve<StateMachineJSON>(rqd.StateMachine.toJSON())));
router.get("/state", RequestData.Endware<State>((rqd: RequestData) => Promise.resolve<State>(rqd.StateMachine.State)));
router.get("/deploy", RequestData.Endware<any>((rqd: RequestData) => rqd.StateMachine.deploy()));

class QueryApiServerStateTx implements ITransaction {
    constructor(public Server: Server, private apiServerMessenger: IApiServerMessenger) {}
    sendRequest(TransactionId: TransactionId) : Promise<any> {
        this.apiServerMessenger.queryState(this.Server.Id, TransactionId);
        return Promise.resolve<any>(null);
    }
    toJSON(): Server {return this.Server;}
}

router.get("/curr-server/state", RequestData.Endware<msg.ApiServerState>((rqd: RequestData) => {
    if (rqd.StateMachine.CurrentServer)
        return rqd.APIServerMsgTransaction.execute<msg.ApiServerState>(new QueryApiServerStateTx(rqd.StateMachine.CurrentServer, rqd.APIServerMessenger));
    else
        return Promise.reject({error: "not-found", "error_description": "api server not found"});
}));

router.get("/new-server/state", RequestData.Endware<msg.ApiServerState>((rqd: RequestData) => {
    if (rqd.StateMachine.NewServer)
        return rqd.APIServerMsgTransaction.execute<msg.ApiServerState>(new QueryApiServerStateTx(rqd.StateMachine.NewServer, rqd.APIServerMessenger));
    else
        return Promise.reject({error: "not-found", "error_description": "api server not found"});
}));

router.get("/old-server/state", RequestData.Endware<msg.ApiServerState>((rqd: RequestData) => {
    if (rqd.StateMachine.OldServer)
        return rqd.APIServerMsgTransaction.execute<msg.ApiServerState>(new QueryApiServerStateTx(rqd.StateMachine.OldServer, rqd.APIServerMessenger));
    else
        return Promise.reject({error: "not-found", "error_description": "api server not found"});
}));