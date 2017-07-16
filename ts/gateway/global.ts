import {IStateMachine} from "./state-machine";
import {IMsgTransaction} from "./msg-transaction";

export interface IGlobal {
    stateMachine: IStateMachine;
    apiMsgTransaction: IMsgTransaction;
}