// Gate 3, second half: break the placeholder and confirm the shape check is loud.
import { resolve } from "./resolve.js";
import { partAConfig } from "./config.js";
const need=(o,p,k)=>{ if(!o||typeof o!=="object") throw new Error(`resolve() returned no ${p}`);
  for(const x of k) if(!(x in o)) throw new Error(`resolve() returned ${p} with no ${x}`); };
const check=(out)=>{ need(out,"result",["task","working","list","capture"]);
  need(out.list,"list",["list_header","sort_header","chip_row","cards","ideas","done","results"]);
  need(out.capture,"capture",["add_button","input_field","significance_row","type_chip","bound_task_chip","action_row","duplicate_dialog"]);
  out.list.cards.forEach((c,i)=>need(c,`list.cards[${i}]`,["card_title","card_reason","card_reason_short","card_band"])); };
// A line the engine accepts. An empty one is refused now, which is rule 8.
const good=resolve({typed_line:"Call markan morning",config:partAConfig,now:"2026-08-03T10:40:00+05:30",new_id:""});
const breaks=[["returns null",()=>null],
              ["drops list",()=>({task:good.task,working:good.working,capture:good.capture})],
              ["drops task",()=>({working:good.working,list:good.list,capture:good.capture})],
              ["drops working",()=>({task:good.task,list:good.list,capture:good.capture})],
              ["drops a card field",()=>({task:good.task,working:good.working,list:{...good.list,cards:[{card_title:"x",card_reason:"y"}]},capture:good.capture})],
              ["drops a capture field",()=>({task:good.task,working:good.working,list:good.list,capture:{add_button:"Add"}})]];
let ok=0;
for(const [name,f] of breaks){
  try{ check(f()); console.log(`  MISSED   ${name}`); }
  catch(e){ console.log(`  loud     ${name}  ->  ${e.message}`); ok++; }
}
try{ check(good); console.log("  clean    intact placeholder passes"); }
catch(e){ console.log("  BROKEN   intact placeholder failed:",e.message); process.exit(1); }
console.log(`\n${ok} of ${breaks.length} deliberate breaks are loud`);
process.exit(ok===breaks.length?0:1);
