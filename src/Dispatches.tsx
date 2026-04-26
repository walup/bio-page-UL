
import ReactMarkdown from 'react-markdown'

type Dispatch = {
    title:string
    date:string
    content: string
}

type DispatchesProps = {
    dispatches:Dispatch[]
}

function DispatchCard({ title, date, content }: Dispatch) {
    return (
        <div className="dispatch-card">
            <div className="dispatch-card__header">
                <h3 className="dispatch-card__title">{title}</h3>
                <span className="dispatch-card__date">{date}</span>
            </div>
            <div className="dispatch-card__body">
                <ReactMarkdown>{content}</ReactMarkdown>
            </div>
        </div>
    )
}


function Dispatches({ dispatches }: DispatchesProps) {
    return (
        <div className="dispatches">
            <h2>Dispatches</h2>
            <div className="dispatches__list">
                {dispatches.map((d) => (
                    <DispatchCard key={d.date} {...d} />
                ))}
            </div>
        </div>
    )
}

export default Dispatches

