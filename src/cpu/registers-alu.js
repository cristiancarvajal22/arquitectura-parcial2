'use strict';
var CpuAlu = (function () {
  var names = ['AX', 'BX', 'CX', 'DX'];
  function integer(value, max, name) {
    if (!Number.isInteger(value) || value < 0 || value > max) throw new RangeError(name + ': 0..' + max);
  }
  function reset() {
    return {registers:{AX:0,BX:0,CX:0,DX:0},pc:0,mar:0,mdr:0,
      ir:{bytes:[0,0,0,0],decoded:null,loadedBytes:0},
      flags:{ZF:false,CF:false,SF:false},alu:{a:0,b:0,result:0,operation:null}};
  }
  function validate(cpu) {
    names.forEach(function (r) { integer(cpu.registers[r],255,r); });
    integer(cpu.pc,511,'PC'); integer(cpu.mar,511,'MAR'); integer(cpu.mdr,255,'MDR');
    if (!Array.isArray(cpu.ir.bytes) || cpu.ir.bytes.length !== 4) throw new Error('IR requiere cuatro bytes');
    for (var i=0;i<4;i++) integer(cpu.ir.bytes[i],255,'IR');
    integer(cpu.ir.loadedBytes,4,'IR.loadedBytes');
    ['ZF','CF','SF'].forEach(function(f){if(typeof cpu.flags[f] !== 'boolean') throw new Error('Flag inválido: '+f);});
    return true;
  }
  // Pure combinational ALU: callers must capture result on the bus before committing CPU state.
  function evaluate(operation, a, b, flags) {
    integer(a,255,'A'); integer(b,255,'B');
    if (!flags || typeof flags.CF !== 'boolean') throw new Error('CF booleano requerido');
    var raw, carry=false;
    switch(operation) {
      case 'ADD': raw=a+b; carry=raw>255; break;
      case 'INC': raw=a+1; carry=raw>255; break;
      case 'SUB': case 'CMP': raw=a-b; carry=raw<0; break;
      case 'DEC': raw=a-1; carry=raw<0; break;
      case 'AND': raw=a&b; break;
      case 'OR': raw=a|b; break;
      case 'XOR': raw=a^b; break;
      case 'NOT': raw=~a; carry=flags.CF; break;
      default: throw new Error('Operación ALU desconocida: '+operation);
    }
    var result=raw&255;
    return {a:a,b:b,result:result,operation:operation,writeResult:operation!=='CMP',
      flags:{ZF:result===0,CF:carry,SF:(result&128)!==0}};
  }
  function snapshot(cpu) { validate(cpu); return JSON.parse(JSON.stringify(cpu)); }
  return {reset:reset,validate:validate,evaluate:evaluate,snapshot:snapshot};
}());
if(typeof module!=='undefined' && module.exports) module.exports=CpuAlu;
