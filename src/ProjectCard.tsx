
import { useState } from "react"

type ProjectCardProps = {
  name: string
  description: string
  domain: string
  scale: string
  status: string
  onClose: ()=> void
}

function ProjectCard({ name, description, domain, scale, status , onClose}: ProjectCardProps) {
  const badgeClass = `project-card__badge project-card__badge--${status}`
  const [closed, setClosed] = useState<boolean>(false);

  return (
    <>
    {!closed &&
    <div className="project-card">
      <div className="project-card__header">
        <h3 className="project-card__name">{name}</h3>
        <button className="project-card__close_button" onClick = {onClose}>X</button>
        </div>
        <div className="project-card__header">
        <span className={badgeClass}>
          <span className="project-card__badge-dot" />
          {status}
        </span>
      </div>
      <div className="project-card__meta">
        <span className="project-card__label">{domain}</span>
        <span className="project-card__label">Scale: {scale}</span>
      </div>
      <p className="project-card__description">{description}</p>
    </div>}</>
  );
}

export default ProjectCard
