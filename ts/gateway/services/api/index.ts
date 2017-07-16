import * as express from 'express';
import * as core from 'express-serve-static-core';
import {RequestData} from "../../request-data";
import * as apiExt from "../../../extensions";

let router = express.Router();
export {router as Router};

router.get("/", RequestData.Endware<apiExt.ExtensionModule[]>((rqd: RequestData) => Promise.resolve<apiExt.ExtensionModule[]>(apiExt.getAllExtensionModules(rqd.NODE_PATH))));