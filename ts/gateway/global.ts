import {IStateMachine} from "./state-machine";
import {IApiServerMessenger} from "./api-server-messenger";
import {IConnectionsManager} from 'rcf-message-router';

export interface IGlobal {
    NODE_PATH: string;
    stateMachine: IStateMachine;
    connectionsManager: IConnectionsManager;
    apiServerMessenger: IApiServerMessenger;
}