import {Readable} from "stream";
import {exec, ExecOptions} from "child_process";
import {CGIChildProcessLauncher} from "crowdsourcing-api";

class Launcher implements CGIChildProcessLauncher {
    exec(command: string, options?: ExecOptions) : Promise<Readable> {
        let stdout = exec(command, options).stdout;
        stdout.on("errro", (err: any) => {
            console.log("!!! stdout on error: " + JSON.stringify(err));
        })
        return Promise.resolve(stdout);
        //return Promise.resolve(exec(command, options).stdout);
    }
}

export function get() : CGIChildProcessLauncher {return new Launcher();}