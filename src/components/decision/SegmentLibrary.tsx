import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Bookmark, BookOpen, Check, TriangleAlert } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { audiences } from '../../data';
import { number } from '../../model';

const KEY='spark-saved-recipes-v1';
const useCases:Record<string,string>={a1:'Repeat purchase · observed lapse',a2:'Frequency building · category shoppers',a3:'First grocery shop · validation needed'};

export function SegmentLibrary({ selectedId, offerId, onSelect }: { selectedId:string; offerId:string; onSelect:(a:string,o:string,l:number)=>void }) {
  const [open,setOpen]=useState(false);
  const [saved,setSaved]=useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]');}catch{return [];}});
  function toggle(id:string){const next=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];setSaved(next);localStorage.setItem(KEY,JSON.stringify(next));}
  return <><div className="recipe-callout"><span><BookOpen size={16}/><strong>Reusable audience recipes</strong><small>Shared definitions make the next brief faster.</small></span><Button variant="outline" size="sm" onClick={()=>setOpen(true)}>Explore recipes <ArrowUpRight size={14}/></Button></div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="recipe-dialog"><DialogHeader><span className="t-overline">SEGMENT LIBRARY · LOCAL DEMO</span><DialogTitle>Start from a repeatable definition</DialogTitle><DialogDescription>These are candidate recipes derived from the synthetic data. An analyst must approve the eligibility rules before operational use.</DialogDescription></DialogHeader>
      <div className="recipe-list">{audiences.map((a,i)=><motion.article key={a.id} className="recipe-card" data-selected={selectedId===a.id}
        initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.3,delay:i*.07}}>
        <div className="recipe-card-head"><span>RECIPE {a.letter} · v0.1</span><button onClick={()=>toggle(a.id)} aria-label={`${saved.includes(a.id)?'Remove':'Save'} ${a.name}`} aria-pressed={saved.includes(a.id)}><Bookmark size={15} fill={saved.includes(a.id)?'currentColor':'none'}/></button></div>
        <h3>{a.name}</h3><p>{useCases[a.id]}</p><div className="recipe-card-meta"><span>{number(a.sizes[1])} balanced members</span><span>{a.granularity==='category'?'Category signal':'Partner fallback'}</span></div>
        <ul>{a.criteria(1).slice(0,2).map(rule=><li key={rule}><Check size={12}/>{rule}</li>)}</ul>
        {a.id==='a3'&&<small className="recipe-warning"><TriangleAlert size={12}/>Lifecycle rule needs validation</small>}
        <Button size="sm" variant={selectedId===a.id?'outline':'default'} onClick={()=>{onSelect(a.id,offerId,1);setOpen(false);}}>{selectedId===a.id?'Current audience':'Use recipe'}</Button>
      </motion.article>)}</div>
      <p className="recipe-foot">Saved markers stay in this browser. They do not publish or approve a segment.</p>
    </DialogContent></Dialog></>;
}
