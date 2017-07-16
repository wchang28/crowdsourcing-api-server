// route /services
import * as express from 'express';
import * as core from 'express-serve-static-core';
import {RequestData} from "../request-data";
import {StateMachineJSON, State} from "../state-machine";
import {Router as serverRouter} from "./server";
import {ITopicConnectionJSON} from 'rcf-message-router';

let router = express.Router();
export {router as Router};

router.get("/", RequestData.Endware<StateMachineJSON>((rqd: RequestData) => Promise.resolve<StateMachineJSON>(rqd.StateMachine.toJSON())));
router.get("/state", RequestData.Endware<State>((rqd: RequestData) => Promise.resolve<State>(rqd.StateMachine.State)));
router.get("/deploy", RequestData.Endware<any>((rqd: RequestData) => rqd.StateMachine.deploy()));
router.get("/connections", RequestData.Endware<ITopicConnectionJSON[]>((rqd: RequestData) => Promise.resolve<ITopicConnectionJSON[]>(rqd.ConnectionsManager.toJSON())));
router.use("/server", serverRouter);