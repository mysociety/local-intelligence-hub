import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { ReactNode } from 'react'

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface TemplateCardProps {
  heading: ReactNode
  description: string
  link?: string
  tag?: string
  labels?: ReactNode
  highlighted: boolean
  isExternalLink?: boolean
  logo?:
    | ReactNode
    | { url: string; content: ReactNode }
    | Array<{ url?: string; content: ReactNode }>
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  heading,
  description,
  link,
  isExternalLink,
  tag,
  highlighted,
  labels,
  logo,
}) => {
  const renderLogo = () => {
    if (!logo) return null

    if (Array.isArray(logo)) {
      return (
        <div className="flex flex-row items-center gap-4 flex-wrap">
          {logo.map((item, index) => (
            <div key={index} className="pt-4">
              {item.url ? (
                <Link href={item.url}>{item.content}</Link>
              ) : (
                item.content
              )}
            </div>
          ))}
        </div>
      )
    }

    if (typeof logo === 'object' && 'url' in logo) {
      return (
        <div className="w-6 h-6">
          <Link href={logo.url}>{logo.content}</Link>
        </div>
      )
    }

    return <div className="w-6 h-6">{logo}</div>
  }

  const cardContent = (
    <Card
      className={`${highlighted ? 'bg-meepGray-700 border-meepGray-600 hover:bg-meepGray-600 transition' : 'hover:bg-meepGray-700 transition'} p-6 h-full`}
    >
      <CardHeader>
        <CardTitle className="mb-3 flex gap-2 items-start">
          <p className="flex-grow">{heading}</p>
          {isExternalLink ? <ExternalLink className="w-4 h-4" /> : null}
        </CardTitle>
        <CardDescription className="text-sm text-meepGray-400 line-clamp-4">
          {description}
        </CardDescription>
        {renderLogo()}
        <div className="pt-4">{labels}</div>
      </CardHeader>

      {tag && (
        <CardFooter className="pt-6">
          <div
            className={`rounded-full ${highlighted ? 'bg-meepGray-600' : 'bg-meepGray-700'} py-1 px-2 text-tiny`}
          >
            {tag}
          </div>
        </CardFooter>
      )}
    </Card>
  )

  return link ? <Link href={link}>{cardContent}</Link> : cardContent
}

export default TemplateCard
