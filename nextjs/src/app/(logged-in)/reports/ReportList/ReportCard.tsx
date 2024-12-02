'use client'

import { formatRelative } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'

import { ListReportsQuery } from '@/__generated__/graphql'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function ReportCard({
  report,
}: {
  report: ListReportsQuery['reports'][0]
}) {
  return (
    <Link href={`/reports/${report.id}`}>
      <Card>
        <CardHeader>
          <CardContent>
            <Image
              src="/reports_page_card_image.png"
              alt="Description of the image"
              width={300}
              height={300}
              className="w-auto"
            />
          </CardContent>
          <CardTitle className="mb-1 px-5 pt-4">{report.name}</CardTitle>
          <CardDescription className="text-sm text-meepGray-400 px-5 pb-5">
            Last edited{' '}
            <span className="text-meepGray-300">
              {formatRelative(report.lastUpdate, new Date())}
            </span>
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
