import {IStateMachine} from "./state-machine";
import {IApiServerMessenger} from "./api-server-messenger";
import {IMsgTransaction} from "./msg-transaction";
import {IConnectionsManager} from 'rcf-message-router';

export interface IGlobal {
    stateMachine: IStateMachine;
    connectionsManager: IConnectionsManager;
    apiServerMessenger: IApiServerMessenger;
    apiServerMsgTransaction: IMsgTransaction;
}