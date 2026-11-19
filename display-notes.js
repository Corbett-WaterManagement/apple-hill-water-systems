const summaries={
 ah2:{well:'The well supplies water to the pressure and control assembly.',winter1:'Winterization service connection. Normal irrigation flow continues along the main pipe.',winter2:'Winterization service connection beside the pressure and control assembly.',shutoff:'Isolation valve in the control assembly.',gauge:'Shows pressure at its connection. Shares a metallic tee with the pressure transducer.',transducer:'Pressure-sensing device connected to the same metallic tee as the gauge.',pressure:'Pressure vessel beside the control assembly.',filter:'Water enters the filter housing and returns to the outlet. The outlet continues toward the field mainline.'},
 ah3:{well:'The well supplies the control assembly, filter and downstream flow sensor.',winter:'Winterization port rising directly from the main pipe. It is a service connection, not a normal-flow destination.',shutoff:'Shutoff valve on the main water path.',quick:'Quick-coupler service connection on the building side of the main pipe.',filter:'Flow enters the filter housing and returns to the outlet before continuing toward Worcester Road.',sensor:'Flow-sensing component on the roadward leg after the filter.'}
};
export function displayNote(system,node){
 if(summaries[system]?.[node.id])return summaries[system][node.id];
 if(system==='wg'&&node.routeBranch)return 'This is a representation of the continuing mainline, not its actual end.';
 if(system==='wg'&&node.id==='well')return 'The well supplies water to the irrigation collection tank.';
 if(system==='wg'&&node.id==='tank')return 'Collects well water for the irrigation system.';
 if(system==='wg'&&node.id==='v0')return 'Isolation valve on the supply pipe from the tank.';
 if(system==='wg'&&node.id==='inlet')return 'Water enters the shaft assembly and descends to the lower pipe.';
 if(system==='wg'&&node.id==='outlet')return 'Water rises from the lower assembly and continues toward the discharge components.';
 if(system==='wg'&&node.id==='v1')return 'Isolates the irrigation discharge mainline.';
 if(system==='wg'&&node.id==='filter')return 'Water passes through the filter housing before returning to the mainline. Manufacturer: Netafim.';
 if(system==='wg'&&node.id==='winter')return 'Service connection used for winterization.';
 if(system==='wg'&&node.id==='meter')return 'Measures flow through the discharge mainline.';
 if(system==='wg'&&node.id==='mainline')return 'The discharge mainline branches to serve the landscape.';
 if(system==='wg'&&node.id==='header')return 'Water crosses the lower assembly and rises toward the discharge mainline. A pressure tank, gauge and pressure transducer connect to this assembly.';
 if(system==='wg'&&node.layer==='non-irrigation')return 'Standalone non-irrigation storage tank. No pipe connections are shown.';
 return node.note.split(/(?<=[.!?])\s+/).filter(s=>!/(\b(?:ft|feet|foot|inch|inches|depth|dimension|dimensions|spacing|size|diameter|envelope|elevation|capacity)\b|\d\s*×)/i.test(s)).join(' ').replace(/\s*\([0-4]\)/g,'');
}
