/** Three reproducible programs; every demo runs through the same CPU motor. */
var P2Catalog = (function () {
  var arithmetic='MOV AX, 0\nMOV BX, 7\nMOV CX, 5\nMOV DX, 0\nloop: ADD AX, BX\nINC DX\nDEC CX\nCMP CX, 0\nJNZ loop\nSTORE [300], AX\nHALT';
  var echo='MOV CX, 8\nloop: IN DX, [KBD]\nOUT [LCD], DX\nDEC CX\nCMP CX, 0\nJNZ loop\nHALT';
  var scattered=[];
  [256,288,320,352,384,416,448].forEach(function(address,index){scattered.push('MOV AX, '+(65+index),'STORE ['+address+'], AX');});
  [256,288,320,352,384,416,448].forEach(function(address){scattered.push('LOAD DX, ['+address+']');});
  scattered.push('HALT');
  var entries=[{id:'arithmetic',name:'Aritmética · 7 × 5',source:arithmetic,expected:'AX=35; DX=5; VA 300=35'},
    {id:'echo',name:'Eco · teclado a LCD',source:echo,input:'ABCDEFGH',expected:'LCD=ABCDEFGH; cola vacía; cursor=0'},
    {id:'scattered',name:'Accesos dispersos · FIFO y Swap',source:scattered.join('\n'),expected:'DX=71; Page Faults y guardado de páginas Dirty'}];
  return {list:function(){return JSON.parse(JSON.stringify(entries));},get:function(id){var entry=entries.find(function(e){return e.id===id;});if(!entry)throw new Error('UNKNOWN_PROGRAM');return JSON.parse(JSON.stringify(entry));}};
}());
