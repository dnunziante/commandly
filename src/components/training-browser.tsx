"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpenCheck, Clock, FileText, PlayCircle } from "lucide-react";
import { TRAINING_CATEGORIES, toDisplayTrainingCategory } from "@/lib/training/categories";
import type { TrainingLessonDTO, TrainingModuleDTO } from "@/lib/training/types";

export function TrainingBrowser({ lessons, modules }: { lessons: TrainingLessonDTO[]; modules: TrainingModuleDTO[] }) {
  const [category, setCategory] = useState("All Categories");
  const visibleModules = category === "All Categories" ? modules : modules.filter((module) => module.category === category);
  const visibleLessons = category === "All Categories" ? lessons : lessons.filter((lesson) => toDisplayTrainingCategory(lesson.collection) === category);

  return <>
    <div className="section-heading training-module-filter-heading"><div><h2>Browse training</h2><p>Choose a category to quickly find the right modules and lessons.</p></div><label className="training-category-filter"><span>Training category</span><select className="input" value={category} onChange={(event) => setCategory(event.target.value)}><option>All Categories</option>{TRAINING_CATEGORIES.map((option) => <option key={option}>{option}</option>)}</select></label></div>

    {modules.length ? <><div className="section-heading"><div><h2>Training modules</h2><p>Follow each BGC learning path in order.</p></div><span className="badge blue">{visibleModules.length} shown</span></div>{visibleModules.length ? <div className="training-module-grid">{visibleModules.map((module) => <section className="card training-module-card" key={module.id}><div className="metric-row"><span className="badge blue">{module.category}</span><span className="training-duration"><Clock size={13}/>{module.lessons.reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0)} min</span></div><h2>{module.title}</h2><p>{module.description}</p><div className="training-module-path">{module.lessons.map((lesson, index) => <Link href={`/training/${lesson.id}`} key={lesson.id}><span>{index + 1}</span><span><strong>{lesson.title}</strong><small>{lesson.estimatedMinutes} min · {lesson.collection}</small></span><PlayCircle size={17}/></Link>)}</div></section>)}</div> : <div className="card output empty"><div><h3>No modules in {category}</h3><p>Choose another category to see available modules.</p></div></div>}</> : null}

    <div className="section-heading"><div><h2>Training lessons</h2><p>Published lessons stay linked to their approved source documents.</p></div><span className="badge blue"><BookOpenCheck size={13}/>{visibleLessons.length} shown</span></div>
    {visibleLessons.length ? <div className="training-lesson-grid">{visibleLessons.map((lesson) => <Link className="card training-source-card" href={`/training/${lesson.id}`} key={lesson.id}><div className="metric-row"><span className="badge blue">{toDisplayTrainingCategory(lesson.collection)}</span><span className="training-duration"><Clock size={13}/>{lesson.estimatedMinutes} min</span></div><div className="metric-icon"><FileText size={19}/></div><h2>{lesson.title}</h2><p>{lesson.description}</p><small>Source: {lesson.sourceFilename}</small><span className="btn btn-primary"><PlayCircle size={16}/> Open lesson</span></Link>)}</div> : <div className="card output empty"><div><BookOpenCheck size={30}/><h2>No training in {category}</h2><p>Choose another category to see available lessons.</p></div></div>}
  </>;
}
