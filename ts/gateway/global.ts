import {IStateMachine} from "./state-machine";
import {IApiServerMessenger} from "./api-server-messenger";
import {IMsgTransactionProcessor} from "msg-transaction-processor";
import {IConnectionsManager} from 'rcf-message-router';

export interface IGlobal {
    stateMachine: IStateMachine;
    connectionsManager: IConnectionsManager;
    apiServerMessenger: IApiServerMessenger;
    apiServerMsgTransactionProcessor: IMsgTransactionProcessor;
}