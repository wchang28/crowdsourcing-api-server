import {Readable} from "stream";
import {exec, ExecOptions} from "child_process";
import {CGIChildProcessLauncher} from "crowdsourcing-api";

class Launcher implements CGIChildProcessLauncher {
    exec(command: string, options?: ExecOptions) : Promise<Readable> {
        let cp = exec(command, options);
        /*
        console.log("pid=" + cp.pid);
        cp.on("error", (err: Error) => {
            console.log("!!! child process on <error>: " + JSON.stringify(err));
        }).on("exit", (code: number, signal: string) => {
            console.log("child process on <exit>: " + [code, signal].toString());
        }).on("close", (code: number, signal: string) => {
            console.log("child process on <close>: " + [code, signal].toString());
        });
        let stdout = cp.stdout;
        stdout.on("error", (err: Error) => {
            console.log("!!! child process stdout on <error>: " + JSON.stringify(err));
        }).on("end", () => {
            console.log("child process stdout on <end>");
        }).on("close", () => {
            console.log("child process stdout on <close>");
        });
        */
        //return Promise.resolve(cp.stdout);
        return Promise.resolve(cp.stdout);
    }
}

export function get() : CGIChildProcessLauncher {return new Launcher();}