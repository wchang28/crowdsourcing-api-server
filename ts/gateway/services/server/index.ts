import * as express from 'express';
import * as core from 'express-serve-static-core';
import {RequestData} from "../../request-data";
import * as msg from "../../../message";
import {Server} from "../../state-machine";
import {IApiServerMessenger} from "../../api-server-messenger"
import {ITransaction, TransactionId} from "../../msg-transaction";

let router = express.Router();
export {router as Router};

function getSetApiServerMiddleware(getApiServerFromRequestData: (rqd: RequestData) => Server) : express.RequestHandler {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        let rqd = new RequestData(req);
        let apiServer = getApiServerFromRequestData(rqd);
        if (apiServer) {
            rqd.APIServer = apiServer;  // set the api server to rqd
            next();
        } else
            res.status(404).json({error: "not-found", error_description: "api server not found"});
    };
}

let serverItemRouter = express.Router();

router.use("/curr", getSetApiServerMiddleware((rqd: RequestData) => rqd.StateMachine.CurrentServer), serverItemRouter);
router.use("/new", getSetApiServerMiddleware((rqd: RequestData) => rqd.StateMachine.NewServer), serverItemRouter);
router.use("/old", getSetApiServerMiddleware((rqd: RequestData) => rqd.StateMachine.OldServer), serverItemRouter);

class QueryApiServerStateTx implements ITransaction {
    constructor(public APIServer: Server, private apiServerMessenger: IApiServerMessenger) {}
    sendRequest(TransactionId: TransactionId) : Promise<any> {
        this.apiServerMessenger.queryState(this.APIServer.Id, TransactionId);
        return Promise.resolve<any>(null);
    }
    toJSON(): Server {return this.APIServer;}
}

serverItemRouter.get("/state", RequestData.Endware<msg.ApiServerState>((rqd: RequestData) => {
    return rqd.APIServerMsgTransaction.execute<msg.ApiServerState>(new QueryApiServerStateTx(rqd.APIServer, rqd.APIServerMessenger));
}));