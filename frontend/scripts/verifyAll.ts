import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=path.resolve(process.env.TEST_ARTIFACTS||path.join(root,'test-artifacts','full-audit'));
fs.mkdirSync(output,{recursive:true});
const args=process.argv.slice(2),unitOnly=args.includes('--unit'),browserOnly=args.includes('--browser');
const selected=args.find(a=>a.startsWith('--script='))?.slice(9);
function files(dir:string):string[]{return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(dir,entry.name)):[path.join(dir,entry.name)]);}
const tests=files(path.join(root,'src')).filter(f=>/\.test\.tsx?$/.test(f));
const nodeTests=tests.filter(f=>/from ['"]node:test['"]/.test(fs.readFileSync(f,'utf8')));
const vitestTests=tests.filter(f=>!nodeTests.includes(f));
const jobs:{name:string;command:string;args:string[]}[]=[];
const npm=process.platform==='win32'?'npm.cmd':'npm';
if(!browserOnly&&!selected){
 for(const name of ['typecheck','build'])jobs.push({name,command:npm,args:['run',name]});
 jobs.push({name:'unit-node',command:process.execPath,args:['--import','tsx','--test',...nodeTests]});
 jobs.push({name:'unit-vitest',command:process.execPath,args:[path.join(root,'node_modules/vitest/vitest.mjs'),'run',...vitestTests]});
}
if(!unitOnly){
 // Checkpoint09 delegates to verifyUi09Final; execute the implementation once.
 for(const file of fs.readdirSync(path.join(root,'scripts')).filter(f=>/^verify.*\.ts$/.test(f)&&!['verifyAll.ts','verifyCheckpoint09.ts'].includes(f)).sort()){
  if(selected&&file!==selected&&file!==selected+'.ts')continue;
  jobs.push({name:file.replace(/\.ts$/,''),command:process.execPath,args:['--import','tsx',path.join(root,'scripts',file)]});
 }
}
if(!jobs.length)throw new Error('No matching verification script');
const results:{name:string;exitCode:number|null;timedOut:boolean;seconds:number;log:string}[]=[];
for(const job of jobs){
 const artifacts=path.join(output,job.name);fs.mkdirSync(artifacts,{recursive:true});
 const log=path.join(output,job.name+'.log'),fd=fs.openSync(log,'w'),start=Date.now();
 console.log('RUN',job.name);
 const child=spawn(job.command,job.args,{cwd:root,env:{...process.env,TEST_ARTIFACTS:artifacts,OPERATIONAL_SCENARIO:'',CP09_INTERACTIONS_ONLY:'',EXPECT_BASELINE_CRASH:''},stdio:['ignore',fd,fd],detached:process.platform!=='win32',shell:process.platform==='win32'&&job.command===npm});
 let timedOut=false;
 const timer=setTimeout(()=>{timedOut=true;if(process.platform==='win32')spawn('taskkill',['/PID',String(child.pid),'/T','/F']);else if(child.pid)process.kill(-child.pid,'SIGTERM');},Number(process.env.TEST_TIMEOUT_MS||1800000));
 const exitCode=await new Promise<number|null>(resolve=>{child.once('error',error=>{fs.writeSync(fd,String(error));resolve(1);});child.once('close',resolve);});clearTimeout(timer);fs.closeSync(fd);
 results.push({name:job.name,exitCode,timedOut,seconds:Math.round((Date.now()-start)/100)/10,log});
 fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify({completed:results.length===jobs.length,passed:results.every(r=>r.exitCode===0&&!r.timedOut),aliases:{verifyCheckpoint09:'verifyUi09Final'},results},null,2));
 console.log(exitCode===0&&!timedOut?'PASS':'FAIL',job.name);
}
if(results.some(r=>r.exitCode!==0||r.timedOut))process.exitCode=1;
