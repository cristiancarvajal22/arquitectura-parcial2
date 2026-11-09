'use strict';
var AsmParser=(function(){
 var registers=['AX','BX','CX','DX'];
 var binary={ADD:0x30,SUB:0x31,AND:0x40,OR:0x41,XOR:0x42};
 var unary={INC:0x32,DEC:0x33,NOT:0x43};
 var jumps={JMP:0x50,JZ:0x51,JNZ:0x52};
 function own(obj,key){return Object.prototype.hasOwnProperty.call(obj,key);}
 function number(token){
  if(/^\d+$/.test(token))return Number(token);
  if(/^0x[0-9a-f]+$/i.test(token))return parseInt(token.slice(2),16);
  if(/^[0-9][0-9a-f]*h$/i.test(token))return parseInt(token.slice(0,-1),16);
  throw new Error('Número inválido: '+token);
 }
 function bounded(n,max,label){if(!Number.isSafeInteger(n)||n<0||n>max)throw new Error(label+' fuera de rango 0..'+max);return n;}
 function reg(token){var r=registers.indexOf(token.toUpperCase());if(r<0)throw new Error('Registro inválido: '+token);return r;}
 function assemble(source,origin){
  var errors=[],labels=Object.create(null),instructions=[],bytes=[];origin=origin===undefined?0:origin;
  function error(line,message){errors.push({line:line,message:message});}
  try{bounded(origin,479,'Origen');if(typeof source!=='string')throw new Error('El código debe ser texto');}
  catch(e){return {ok:false,bytes:[],instructions:[],labels:{},errors:[{line:0,message:e.message}]};}
  var pc=origin;
  source.split(/\r?\n/).forEach(function(raw,index){
   var line=index+1,text=raw.split(';')[0].trim(),match;
   if(!text)return;
   while((match=/^([A-Za-z_][A-Za-z0-9_]*):/.exec(text))){
    var label=match[1].toUpperCase();
    if(own(labels,label))error(line,'Etiqueta duplicada: '+label);
    else if(registers.indexOf(label)!==-1||label==='KBD'||label==='LCD')error(line,'Etiqueta reservada: '+label);
    else labels[label]=pc;
    text=text.slice(match[0].length).trim();
   }
   if(!text)return;
   var parts=/^(\S+)(?:\s+(.*))?$/.exec(text);
   var operands=parts[2]===undefined?[]:parts[2].split(',').map(function(p){return p.trim();});
   instructions.push({line:line,address:pc,mnemonic:parts[1].toUpperCase(),operands:operands});pc+=4;
   if(pc>480)error(line,'Programa invade la página reservada de E/S');
  });
  var starts=instructions.map(function(i){return i.address;});
  function address(token){var key=token.toUpperCase();
   if(key==='KBD')return 480;if(key==='LCD')return 488;
   if(own(labels,key))return bounded(labels[key],511,'Dirección');
   if(/^[A-Za-z_]/.test(token))throw new Error('Etiqueta ausente: '+token);
   return bounded(number(token),511,'Dirección');
  }
  function memory(token,write){
   var match=/^\[\s*([^\[\]]+?)\s*\]$/.exec(token);if(!match)throw new Error('Se esperaba [dirección]');
   var a=address(match[1].trim());if(a>=496)throw new Error('Dirección reservada');
   if(write&&a>=480&&a<488)throw new Error('STORE sobre KBD no permitido');return a;
  }
  instructions.forEach(function(ins){
   try{
    var op=ins.mnemonic,p=ins.operands,out,a;
    function count(n){if(p.length!==n||p.some(function(x){return !x;}))throw new Error(op+' requiere '+n+' operandos');}
    function encoded(code,r,addr){return [code,r,addr%256,Math.floor(addr/256)];}
    if(op==='HALT'||op==='NOP'){count(0);out=[op==='HALT'?0:1,0,0,0];}
    else if(op==='MOV'||op==='CMP'){
     count(2);var rd=reg(p[0]),rs=registers.indexOf(p[1].toUpperCase());
     out=[op==='MOV'?(rs<0?0x10:0x11):(rs<0?0x35:0x34),rd,rs<0?bounded(number(p[1]),255,'Inmediato'):rs,0];
    }else if(own(binary,op)){count(2);out=[binary[op],reg(p[0]),reg(p[1]),0];}
    else if(own(unary,op)){count(1);out=[unary[op],reg(p[0]),0,0];}
    else if(op==='LOAD'){count(2);out=encoded(0x20,reg(p[0]),memory(p[1],false));}
    else if(op==='STORE'){count(2);out=encoded(0x21,reg(p[1]),memory(p[0],true));}
    else if(own(jumps,op)){count(1);a=address(p[0]);if(starts.indexOf(a)===-1)throw new Error('Salto no apunta al inicio de una instrucción');out=encoded(jumps[op],0,a);}
    else if(op==='IN'){count(2);if(!/^\[\s*KBD\s*\]$/i.test(p[1]))throw new Error('IN requiere rd, [KBD]');out=[0x60,reg(p[0]),0,0];}
    else if(op==='OUT'){count(2);if(!/^\[\s*LCD\s*\]$/i.test(p[0]))throw new Error('OUT requiere [LCD], rs');out=[0x61,reg(p[1]),0,0];}
    else throw new Error('Instrucción desconocida: '+op);
    ins.bytes=out;bytes.push.apply(bytes,out);
   }catch(e){error(ins.line,e.message);}
  });
  if(errors.length)return {ok:false,bytes:[],instructions:[],labels:{},errors:errors};
  return {ok:true,origin:origin,bytes:bytes,instructions:instructions,labels:Object.assign({},labels),errors:[]};
 }
 return {assemble:assemble};
}());
if(typeof module!=='undefined'&&module.exports)module.exports=AsmParser;
