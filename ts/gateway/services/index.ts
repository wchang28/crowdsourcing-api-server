// route /services
import * as express from 'express';
import * as core from 'express-serve-static-core';
import {RequestData} from "../request-data";
import {StateMachineJSON, State, Server} from "../state-machine";

let router = express.Router();
export {router as Router};

router.get("/", RequestData.Endware<StateMachineJSON>((rqd: RequestData) => Promise.resolve<StateMachineJSON>(rqd.StateMachine.toJSON())));
router.get("/state", RequestData.Endware<State>((rqd: RequestData) => Promise.resolve<State>(rqd.StateMachine.State)));
router.get("/deploy", RequestData.Endware<any>((rqd: RequestData) => rqd.StateMachine.deploy()));