import {IStateMachine} from "./state-machine";
import {IApiServerMessenger} from "./api-server-messenger";
import {IMsgTransaction} from "./msg-transaction";

export interface IGlobal {
    stateMachine: IStateMachine;
    apiServerMessenger: IApiServerMessenger;
    apiServerMsgTransaction: IMsgTransaction;
}